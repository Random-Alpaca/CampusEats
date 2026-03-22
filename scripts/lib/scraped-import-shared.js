/**
 * Shared helpers for import-scraped-posts.js and import-scraped-posts-captions-only.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
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

function pickImportLatLng(parsed) {
  const lat = parsed?.lat;
  const lng = parsed?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
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
  const { createEvent } = require('../../server/models/event');
  return createEvent(body);
}

module.exports = {
  ROOT,
  SCRAPED_PATH,
  MANIFEST_PATH,
  DEFAULT_LAT,
  DEFAULT_LNG,
  DELAY_MS,
  SKIP_IMAGE_URL,
  apiBaseUrl,
  parseArgs,
  extractCaptionBody,
  hasRequiredFieldsForCore,
  pickImportLatLng,
  loadJsonSafe,
  saveManifest,
  sleep,
  resolveLocalImagePath,
  postEvent,
  assertApiReachable,
  saveEventToDatabase,
};
