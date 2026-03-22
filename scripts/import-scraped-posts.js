/**
 * Import events from data/scraped_posts.json using parseEvent (Gemini).
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
const path = require('path');
const {
  parseEvent,
  parseEventFromImage,
  parseEventFromImageBuffer,
  resolveUploadedImageMime,
} = require('../services/gemini');

const ROOT = path.resolve(__dirname, '..');
const SCRAPED_PATH = path.join(ROOT, 'data', 'scraped_posts.json');
const MANIFEST_PATH = path.join(ROOT, 'data', 'imported_post_ids.json');

const DEFAULT_LAT = Number(process.env.IMPORT_LAT) || 49.2606;
const DEFAULT_LNG = Number(process.env.IMPORT_LNG) || -123.246;
const DELAY_MS = Math.max(0, parseInt(process.env.IMPORT_DELAY_MS || '400', 10) || 400);
const SKIP_IMAGE_URL = ['1', 'true', 'yes'].includes(
  String(process.env.IMPORT_SKIP_IMAGE_URL || '').toLowerCase()
);

function apiBaseUrl() {
  const raw = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
  return raw.replace(/\/$/, '');
}

function parseArgs(argv) {
  let dryRun = false;
  let force = false;
  let requireFood = false;
  let limit = Infinity;
  let school = process.env.IMPORT_SCHOOL || null;
  let useApi = false;

  for (const a of argv) {
    if (a === '--dry-run') dryRun = true;
    else if (a === '--force') force = true;
    else if (a === '--require-food') requireFood = true;
    else if (a === '--use-api') useApi = true;
    else if (a.startsWith('--limit=')) {
      const n = parseInt(a.slice(8), 10);
      if (Number.isFinite(n) && n >= 0) limit = n;
    } else if (a.startsWith('--school=')) {
      school = a.slice(9).trim().toLowerCase() || null;
    }
  }
  if (['1', 'true', 'yes'].includes(String(process.env.IMPORT_USE_API || '').toLowerCase())) {
    useApi = true;
  }
  return { dryRun, force, requireFood, limit, school, useApi };
}

/**
 * Strip scraper wrapper: `N likes … - handle on DATE: "real caption"`.
 */
function extractCaptionBody(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  const m = s.match(/\s-\s[a-z0-9_.]+\s+on\s+[^:]+:\s*"([\s\S]*)"\s*\.?\s*$/i);
  if (m) return m[1].trim();
  return s;
}

function hasRequiredFieldsForCore(event) {
  if (!event || typeof event !== 'object') return false;
  const { title, location, time, food_type } = event;
  return (
    typeof title === 'string' &&
    title.trim() !== '' &&
    typeof location === 'string' &&
    location.trim() !== '' &&
    typeof time === 'string' &&
    time.trim() !== '' &&
    typeof food_type === 'string' &&
    food_type.trim() !== ''
  );
}

function loadJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const t = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(t);
  } catch {
    return fallback;
  }
}

function saveManifest(ids) {
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(ids, null, 2)}\n`, 'utf8');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @param {string | undefined} relOrAbs */
function resolveLocalImagePath(relOrAbs) {
  if (!relOrAbs || typeof relOrAbs !== 'string') return null;
  const t = relOrAbs.trim();
  if (!t) return null;
  return path.isAbsolute(t) ? t : path.join(ROOT, t);
}

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

async function postEvent(body) {
  const res = await fetch(`${apiBaseUrl()}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`POST /events failed: ${res.status}`);
    err.details = data;
    throw err;
  }
  return data;
}

async function assertApiReachable() {
  try {
    const res = await fetch(`${apiBaseUrl()}/health`);
    if (!res.ok) {
      console.warn('Warning: GET /health returned', res.status);
    }
  } catch (e) {
    console.error(
      `Cannot reach API at ${apiBaseUrl()} (${e.message || e}).\n` +
        'Start the server (npm start) or run without --use-api to write to Firestore directly.'
    );
    process.exit(1);
  }
}

/**
 * @param {object} body same shape as POST /events
 * @param {{ dryRun: boolean, useApi: boolean }} opts
 */
async function saveEventToDatabase(body, opts) {
  const { dryRun, useApi } = opts;
  if (dryRun) {
    return { id: 'dry-run', ...body };
  }
  if (useApi) {
    return postEvent(body);
  }
  const { createEvent } = require('../server/models/event');
  return createEvent(body);
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
        const body = {
          title: parsed.title,
          location: parsed.location,
          time: parsed.time,
          food_type: parsed.food_type,
          organization,
          date: parsed.date || '',
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
          instagram_url: instagramUrl,
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
