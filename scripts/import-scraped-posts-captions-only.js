/**
 * Import events from data/scraped_posts.json using Gemini on captions only.
 *
 * Does not read local images or image URLs—faster and cheaper than import-scraped-posts.js.
 * Skips posts with no caption (image-only posts are ignored).
 *
 * Same manifest (data/imported_post_ids.json), --limit, --school, --use-api, etc. as the main importer.
 *
 * Usage (e.g. next 80 after the first batch, skipping IDs already in the manifest):
 *   node scripts/import-scraped-posts-captions-only.js --limit=80
 *   node scripts/import-scraped-posts-captions-only.js --dry-run --limit=5
 *
 * Env: same as import-scraped-posts.js (IMPORT_USE_API, IMPORT_DELAY_MS, …)
 */
require('dotenv').config();

const fs = require('fs');
const {
  SCRAPED_PATH,
  MANIFEST_PATH,
  DELAY_MS,
  parseArgs,
  extractCaptionBody,
  hasRequiredFieldsForCore,
  pickImportLatLng,
  loadJsonSafe,
  saveManifest,
  sleep,
  assertApiReachable,
  saveEventToDatabase,
} = require('./lib/scraped-import-shared');
const { parseEvent } = require('../services/gemini');

async function main() {
  const { dryRun, force, requireFood, limit, school, useApi } = parseArgs(
    process.argv.slice(2)
  );

  if (!dryRun && useApi) {
    await assertApiReachable();
  } else if (!dryRun && !useApi) {
    console.log('Import mode: Firestore (direct). Ensure GOOGLE_APPLICATION_CREDENTIALS is set.\n');
  }

  console.log(
    'Captions-only import (no image fallback). Posts without a caption are skipped.\n'
  );

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
  let skippedNoCaption = 0;
  let parseErrors = 0;
  let postErrors = 0;

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

        if (!hasCaption) {
          skippedNoCaption += 1;
          continue;
        }

        if (!force && importedSet.has(postId)) {
          skippedDup += 1;
          continue;
        }

        if (Number.isFinite(limit) && parseAttempts >= limit) {
          break outer;
        }

        const text = extractCaptionBody(caption);
        const label = `[${schoolKey}/${clubHandle}/${postId}]`;

        parseAttempts += 1;
        let parsed;
        try {
          parsed = await parseEvent(text);
        } catch (e) {
          console.error(label, 'parse error:', e.message || e);
          parseErrors += 1;
          await sleep(DELAY_MS);
          continue;
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
          console.log(label, 'skip (incomplete parse from caption only)');
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
    `import-scraped-posts-captions-only — ` +
      `parse attempts (--limit applies here): ${parseAttempts}, created: ${created}, ` +
      `skipped duplicate: ${skippedDup}, skipped no caption: ${skippedNoCaption}, ` +
      `skipped incomplete: ${skippedEmpty}, skipped no-food: ${skippedFood}, ` +
      `parse errors: ${parseErrors}, POST errors: ${postErrors}` +
      (dryRun ? ' (dry-run)' : '')
  );

  if (!dryRun && created === 0 && skippedEmpty > 0) {
    console.log(
      '\nNo rows saved: Gemini must return title, location, time, and food_type from the caption.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
