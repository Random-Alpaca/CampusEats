/**
 * Import events from data/scraped_posts.json using parseEvent (Gemini).
 *
 * Caption first; if core fields are missing, tries local image then optional image URL.
 * For caption-only imports (no images), use: scripts/import-scraped-posts-captions-only.js
 *
 * Writes to Firestore by default (same as npm run seed:events). Requires .env with
 * GOOGLE_APPLICATION_CREDENTIALS + PROJECT_ID + LOCATION. No API server needed.
 *
 * Use --use-api (or IMPORT_USE_API=1) to POST to the Express server instead.
 *
 * Usage:
 *   node scripts/import-scraped-posts.js --dry-run --limit=5
 *   node scripts/import-scraped-posts.js --school=ubc --require-food
 *
 * Env:
 *   IMPORT_USE_API=1  use HTTP POST /events instead of Firestore (start server first)
 *   API_BASE_URL      (default http://127.0.0.1:3000) when using IMPORT_USE_API
 *   IMPORT_LAT        (default UBC Vancouver ~49.26)
 *   IMPORT_LNG        (default ~-123.25)
 *   IMPORT_DELAY_MS   delay between Gemini calls (default 400)
 *   IMPORT_SKIP_IMAGE_URL=1  do not try image_url after local file (faster; avoids CDN blocks)
 */
require('dotenv').config();

const fs = require('fs');
const {
  SCRAPED_PATH,
  MANIFEST_PATH,
  DELAY_MS,
  SKIP_IMAGE_URL,
  parseArgs,
  extractCaptionBody,
  hasRequiredFieldsForCore,
  pickImportLatLng,
  loadJsonSafe,
  saveManifest,
  sleep,
  resolveLocalImagePath,
  assertApiReachable,
  saveEventToDatabase,
} = require('./lib/scraped-import-shared');
const {
  parseEvent,
  parseEventFromImage,
  parseEventFromImageBuffer,
  resolveUploadedImageMime,
} = require('../services/gemini');

/**
 * Caption first; if core fields missing, try local image then (optionally) image URL.
 * @returns {{ parsed: object, imageFallback: 'none' | 'local' | 'url' }}
 */
async function parseCaptionThenImage(text, post, label) {
  let parsed;
  try {
    parsed = await parseEvent(text);
  } catch (e) {
    throw e;
  }

  if (hasRequiredFieldsForCore(parsed)) {
    return { parsed, imageFallback: 'none' };
  }

  await sleep(DELAY_MS);

  const localPath = resolveLocalImagePath(post.image_local_path);
  if (localPath && fs.existsSync(localPath)) {
    const mime = resolveUploadedImageMime(undefined, localPath);
    if (mime) {
      try {
        const buf = fs.readFileSync(localPath);
        const fromImg = await parseEventFromImageBuffer(buf, mime);
        if (hasRequiredFieldsForCore(fromImg)) {
          console.log(label, 'parse: used local image (caption incomplete)');
          return { parsed: fromImg, imageFallback: 'local' };
        }
      } catch (e) {
        console.error(label, 'parseEventFromImageBuffer:', e.message || e);
      }
    }
  }

  await sleep(DELAY_MS);

  if (!SKIP_IMAGE_URL && post.image_url && typeof post.image_url === 'string') {
    const u = post.image_url.trim();
    if (u) {
      try {
        const fromUrl = await parseEventFromImage(u);
        if (hasRequiredFieldsForCore(fromUrl)) {
          console.log(label, 'parse: used image URL (caption incomplete)');
          return { parsed: fromUrl, imageFallback: 'url' };
        }
      } catch (e) {
        if (e && e.code === 'IMAGE_FETCH_FAILED') {
          console.log(
            label,
            'image URL not fetchable (CDN); ensure image_local_path exists or download manually'
          );
        } else {
          console.error(label, 'parseEventFromImage:', e.message || e);
        }
      }
    }
  }

  return { parsed, imageFallback: 'none' };
}

async function main() {
  const { dryRun, force, requireFood, limit, school, useApi } = parseArgs(
    process.argv.slice(2)
  );

  if (!dryRun && useApi) {
    await assertApiReachable();
  } else if (!dryRun && !useApi) {
    console.log('Import mode: Firestore (direct). Ensure GOOGLE_APPLICATION_CREDENTIALS is set.\n');
  }

  if (!fs.existsSync(SCRAPED_PATH)) {
    console.error('Missing', SCRAPED_PATH);
    process.exit(1);
  }

  const scraped = loadJsonSafe(SCRAPED_PATH, null);
  if (!scraped || !scraped.schools || typeof scraped.schools !== 'object') {
    console.error('Invalid scraped_posts.json shape (expected schools).');
    process.exit(1);
  }

  let manifest = loadJsonSafe(MANIFEST_PATH, []);
  if (!Array.isArray(manifest)) manifest = [];
  const importedSet = new Set(manifest.map(String));

  const schools = school
    ? Object.entries(scraped.schools).filter(([k]) => k.toLowerCase() === school)
    : Object.entries(scraped.schools);

  if (schools.length === 0) {
    console.error(school ? `No school "${school}" in scraped_posts.json` : 'No schools in file.');
    process.exit(1);
  }

  let parseAttempts = 0;
  let created = 0;
  let skippedDup = 0;
  let skippedEmpty = 0;
  let skippedFood = 0;
  let parseErrors = 0;
  let postErrors = 0;
  let imageFallbackUsed = 0;

  outer: for (const [schoolKey, clubs] of schools) {
    if (!clubs || typeof clubs !== 'object') continue;
    for (const [clubHandle, clubData] of Object.entries(clubs)) {
      const posts = clubData && clubData.posts;
      if (!posts || typeof posts !== 'object') continue;

      for (const [postId, post] of Object.entries(posts)) {
        if (!post || typeof post !== 'object') continue;

        const caption = post.caption;
        const hasCaption =
          typeof caption === 'string' && caption.trim() !== '';
        const hasImage =
          (post.image_local_path && String(post.image_local_path).trim()) ||
          (post.image_url && String(post.image_url).trim());
        if (!hasCaption && !hasImage) continue;

        if (!force && importedSet.has(postId)) {
          skippedDup += 1;
          continue;
        }

        if (Number.isFinite(limit) && parseAttempts >= limit) {
          break outer;
        }

        const text = hasCaption ? extractCaptionBody(caption) : '';
        const label = `[${schoolKey}/${clubHandle}/${postId}]`;

        parseAttempts += 1;
        let parsed;
        let imageFallback = 'none';
        try {
          const r = await parseCaptionThenImage(text, post, label);
          parsed = r.parsed;
          imageFallback = r.imageFallback;
        } catch (e) {
          console.error(label, 'parse error:', e.message || e);
          parseErrors += 1;
          await sleep(DELAY_MS);
          continue;
        }

        if (imageFallback !== 'none') {
          imageFallbackUsed += 1;
        }

        await sleep(DELAY_MS);

        if (requireFood && !parsed.food_available) {
          skippedFood += 1;
          console.log(label, 'skip (no food detected)');
          continue;
        }

        const organization =
          (parsed.organization && String(parsed.organization).trim()) || clubHandle;

        if (!hasRequiredFieldsForCore(parsed)) {
          skippedEmpty += 1;
          console.log(
            label,
            'skip (incomplete parse from caption and image)'
          );
          continue;
        }

        const instagramUrl = `https://www.instagram.com/p/${postId}/`;
        const { lat, lng } = pickImportLatLng(parsed);
        const body = {
          title: parsed.title,
          location: parsed.location,
          time: parsed.time,
          food_type: parsed.food_type,
          organization,
          date: parsed.date || '',
          lat,
          lng,
          instagram_url: instagramUrl,
          image_url: typeof post.image_url === 'string' ? post.image_url : '',
          image_local_path:
            typeof post.image_local_path === 'string' ? post.image_local_path : '',
        };

        if (dryRun) {
          console.log(label, 'DRY-RUN would create:', {
            title: body.title,
            location: body.location,
            time: body.time,
            food_type: body.food_type,
            organization: body.organization,
            instagram_url: body.instagram_url,
          });
          created += 1;
          continue;
        }

        try {
          const saved = await saveEventToDatabase(body, { dryRun, useApi });
          created += 1;
          if (!force && !dryRun) {
            manifest.push(postId);
            importedSet.add(postId);
            saveManifest(manifest);
          }
          console.log(label, 'created', saved && saved.id ? saved.id : saved);
        } catch (e) {
          postErrors += 1;
          console.error(label, e.message, e.details || '');
        }
      }
    }
  }

  console.log('\n---');
  console.log(
    `import-scraped-posts (caption + image fallback) — ` +
      `parse attempts (--limit applies here): ${parseAttempts}, created: ${created}, ` +
      `image fallback used: ${imageFallbackUsed}, ` +
      `skipped duplicate: ${skippedDup}, skipped incomplete: ${skippedEmpty}, ` +
      `skipped no-food: ${skippedFood}, parse errors: ${parseErrors}, POST errors: ${postErrors}` +
      (dryRun ? ' (dry-run)' : '')
  );

  if (!dryRun && created === 0 && skippedEmpty > 0) {
    console.log(
      '\nNo rows saved: Gemini must return title, location, time, and food_type. ' +
        'Ensure captions or data/images/* local files exist for image fallback.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
