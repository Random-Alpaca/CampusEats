// Auth: GOOGLE_APPLICATION_CREDENTIALS (or gcloud auth application-default login).
// Enable Vertex AI API on the project; grant the account "Vertex AI User" (or Editor) if calls fail with 403.
const {
  VertexAI,
  FunctionDeclarationSchemaType: S,
} = require('@google-cloud/vertexai');

/**
 * Use a current stable model. gemini-1.5-flash-002 (and siblings) were retired Sept 2025 → 404.
 * Override with GEMINI_MODEL if needed (e.g. gemini-2.0-flash-001).
 * @see https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions
 */
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/** Set GEMINI_DEBUG=1 in .env to log Vertex/Gemini errors and bad JSON snippets (server terminal only). */
function geminiDebugEnabled() {
  const v = (process.env.GEMINI_DEBUG || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function logGeminiDebug(stage, errOrDetail) {
  if (!geminiDebugEnabled()) return;
  if (errOrDetail instanceof Error) {
    console.error('[gemini]', stage, errOrDetail.message);
    if (errOrDetail.stack) console.error(errOrDetail.stack);
  } else {
    console.error('[gemini]', stage, errOrDetail);
  }
}

let generativeModel;

function getGenerativeModel() {
  if (generativeModel) return generativeModel;

  const project = process.env.PROJECT_ID;
  const location = process.env.LOCATION;
  if (!project || !location) {
    throw new Error(
      'Set PROJECT_ID and LOCATION environment variables for Vertex AI (see .env.example).'
    );
  }

  const vertexAI = new VertexAI({ project, location });
  generativeModel = vertexAI.getGenerativeModel({ model: MODEL_ID });
  return generativeModel;
}

function extractText(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid Gemini response');
  }

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Prompt blocked (blockReason: ${blockReason})`);
  }

  const candidates = response.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    const extra = response.promptFeedback
      ? ` promptFeedback=${JSON.stringify(response.promptFeedback)}`
      : '';
    throw new Error(`No candidates in Gemini response.${extra}`);
  }

  const candidate = candidates[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .map((p) => (p && typeof p.text === 'string' ? p.text : ''))
    .join('');
  if (text) return text;

  const fr = candidate?.finishReason;
  throw new Error(
    fr
      ? `No text in Gemini response (finishReason: ${fr})`
      : 'No text in Gemini response (empty parts)'
  );
}

function emptyEvent() {
  return {
    title: '',
    location: '',
    time: '',
    date: '',
    food_type: '',
    food_available: false,
    organization: '',
    is_happening_soon: false,
  };
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Parses common time strings (12h with optional minutes, 24h).
 * @returns {{ h: number, m: number } | null}
 */
function parseTimeParts(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const s = timeStr.trim().replace(/\s+/g, ' ');
  if (!s) return null;

  let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (h < 1 || h > 12 || min > 59) return null;
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return { h, m: min };
  }

  m = s.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const ap = m[2].toUpperCase();
    if (h < 1 || h > 12) return null;
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return { h, m: 0 };
  }

  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    return { h, m: min };
  }

  return null;
}

/**
 * Resolves which calendar day the event is on. Returns null if the date text is too ambiguous.
 */
function resolveEventDate(dateStr, now) {
  if (!dateStr || !dateStr.trim()) {
    return startOfLocalDay(now);
  }

  const s = dateStr.trim().toLowerCase();
  if (s === 'today') return startOfLocalDay(now);
  if (s === 'tomorrow') {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return startOfLocalDay(t);
  }

  const parsed = Date.parse(dateStr.trim());
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    if (!Number.isNaN(d.getTime())) {
      return startOfLocalDay(d);
    }
  }

  if (/^(sun|mon|tue|wed|thu|fri|sat)/i.test(dateStr.trim())) {
    return null;
  }

  return null;
}

/**
 * @returns {Date | null}
 */
function inferEventStart({ time, date }, now = new Date()) {
  const parts = parseTimeParts(time);
  if (!parts) return null;

  const day = resolveEventDate(date, now);
  if (!day) return null;

  const start = new Date(day);
  start.setHours(parts.h, parts.m, 0, 0);
  return start;
}

/**
 * True when the inferred start time is between now and now + 2 hours (inclusive of now).
 */
function computeIsHappeningSoon(event, now = new Date()) {
  const start = inferEventStart(event, now);
  if (!start) return false;

  const t0 = now.getTime();
  const t1 = t0 + TWO_HOURS_MS;
  const ts = start.getTime();
  return ts >= t0 && ts <= t1;
}

const EVENT_RESPONSE_SCHEMA = {
  type: S.OBJECT,
  properties: {
    title: { type: S.STRING },
    location: { type: S.STRING },
    time: { type: S.STRING },
    date: { type: S.STRING },
    food_type: { type: S.STRING },
    food_available: { type: S.BOOLEAN },
    organization: { type: S.STRING },
  },
  required: [
    'title',
    'location',
    'time',
    'date',
    'food_type',
    'food_available',
    'organization',
  ],
};

/**
 * Reusable instruction block for Instagram caption → event JSON.
 * Real caption is appended by buildParsePrompt.
 */
const PARSE_EVENT_PROMPT = `You extract structured event data from short social posts (e.g. Instagram captions).

Task: Read the caption and fill every field with concise, factual phrases—never long sentences.
Return ONLY JSON. No extra text. No markdown fences. No explanation before or after the object.

JSON shape (all keys required):
- title: short event name (infer from context if needed).
- location: venue or building name, or "".
- time: normalized time if present (e.g. "5:00 PM"), or "".
- date: day or date if present, or "".
- food_type: short label using common categories when possible (e.g. Pizza, Snacks, Drinks, Coffee, Tacos, Donuts), or "".
- food_available: true if food or drink is mentioned (pizza, snacks, drinks, coffee, donuts, tacos, catering, etc.); false if not mentioned.
- organization: host club, company, or group if clear, or "".

Use "" for any string you cannot determine. food_available must be false when no food or drink is mentioned.

Example

Input:
"Join us Thursday for a startup panel! Free pizza provided 🍕 UBC Engineering Building 5pm"

Output:
{
  "title": "Startup Panel",
  "location": "UBC Engineering Building",
  "time": "5:00 PM",
  "date": "",
  "food_type": "Pizza",
  "food_available": true,
  "organization": ""
}

---

Caption to parse:
`;

/**
 * Vision: poster / social image → structured event JSON (no prose).
 */
const PARSE_EVENT_FROM_IMAGE_PROMPT = `You are extracting structured event information from a poster or social media image.

Instructions:
1. Read all visible text in the image.
2. Identify event details (what, where, when, who is hosting).
3. Detect food or drink mentions (pizza, snacks, drinks, coffee, catering, etc.)—set food_available accordingly and food_type to a short label when known.

Fields (all keys required; use "" if unknown):
- title, location, time, date, food_type, food_available (boolean), organization

Example — if the image contains:
"FREE PIZZA NIGHT 🍕
Engineering Building
Thursday 6PM
Hosted by CS Club"

Output:
{
  "title": "Pizza Night",
  "location": "Engineering Building",
  "time": "6:00 PM",
  "date": "",
  "food_type": "Pizza",
  "food_available": true,
  "organization": "CS Club"
}

Return ONLY JSON. No markdown. No explanation.`;

function buildParsePrompt(caption) {
  return `${PARSE_EVENT_PROMPT}${caption}`;
}

/**
 * @param {string | null} contentTypeHeader
 * @param {string} url
 * @returns {string}
 */
function guessImageMimeType(contentTypeHeader, url) {
  if (contentTypeHeader) {
    const m = contentTypeHeader.split(';')[0].trim().toLowerCase();
    if (m.startsWith('image/')) return m;
  }
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

/**
 * Detect image format from magic bytes (more reliable than Content-Type for CDNs).
 * @returns {'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | null}
 */
function sniffImageMimeType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38
  ) {
    return 'image/gif';
  }
  if (
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function looksLikeHtmlResponse(buf, contentType) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/json')) return true;
  const head = buf.slice(0, 64).toString('utf8').trimStart();
  return head.startsWith('<!') || head.toLowerCase().startsWith('<html');
}

/**
 * Instagram/Facebook CDNs often block anonymous fetch(); browser-like headers help.
 */
function fetchHeadersForImageUrl(imageUrl) {
  const headers = {
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
  try {
    const u = new URL(imageUrl);
    if (/instagram\.com|cdninstagram\.com|fbcdn\.net/i.test(u.hostname)) {
      headers.Referer = 'https://www.instagram.com/';
      headers.Origin = 'https://www.instagram.com';
    }
  } catch {
    /* ignore */
  }
  return headers;
}

/**
 * Fetches an image over HTTP(S) for Vertex inlineData.
 * @param {string} imageUrl
 * @returns {Promise<{ mimeType: string, data: string }>}
 */
async function fetchImageAsInlineData(imageUrl) {
  const url = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  if (!url) {
    throw new Error('imageUrl must be a non-empty string');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid image URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Image URL must be http or https');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: fetchHeadersForImageUrl(url),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      throw new Error('Empty image body');
    }

    const ct = res.headers.get('content-type');
    if (looksLikeHtmlResponse(buf, ct)) {
      throw new Error(
        'URL returned HTML instead of an image (login page or block). Instagram often blocks server-side downloads—save the image and POST it as multipart field "image", or use a direct image host.'
      );
    }

    const sniffed = sniffImageMimeType(buf);
    const mimeType = sniffed || guessImageMimeType(ct, url);

    if (!sniffed && (!mimeType || !mimeType.startsWith('image/'))) {
      throw new Error(
        `Could not determine image type (Content-Type: ${ct || 'none'}).`
      );
    }

    return { mimeType, data: buf.toString('base64') };
  } finally {
    clearTimeout(timer);
  }
}

function emptyEventImageFields() {
  const { is_happening_soon: _drop, ...rest } = normalizeEvent({}, new Date());
  return rest;
}

function stripJsonFence(s) {
  let t = String(s).trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/u, '');
  }
  return t.trim();
}

/** Known aliases → canonical display labels */
const FOOD_TYPE_CANONICAL = {
  pizza: 'Pizza',
  snack: 'Snacks',
  snacks: 'Snacks',
  drink: 'Drinks',
  drinks: 'Drinks',
  beverage: 'Drinks',
  beverages: 'Drinks',
  coffee: 'Coffee',
  donut: 'Donuts',
  donuts: 'Donuts',
  taco: 'Tacos',
  tacos: 'Tacos',
  catering: 'Catering',
  lunch: 'Lunch',
  dinner: 'Dinner',
  breakfast: 'Breakfast',
  brunch: 'Brunch',
  bbq: 'BBQ',
  barbecue: 'BBQ',
  sandwich: 'Sandwiches',
  sandwiches: 'Sandwiches',
  burger: 'Burgers',
  burgers: 'Burgers',
  sushi: 'Sushi',
  dessert: 'Dessert',
  desserts: 'Dessert',
  appetizers: 'Appetizers',
  appetizer: 'Appetizers',
};

function normalizeFoodType(value) {
  const t = toTrimmedString(value);
  if (!t) return '';

  const lower = t.toLowerCase();
  if (FOOD_TYPE_CANONICAL[lower]) return FOOD_TYPE_CANONICAL[lower];

  const words = t.split(/\s+/).map((w) => {
    const lw = w.toLowerCase();
    if (FOOD_TYPE_CANONICAL[lw]) return FOOD_TYPE_CANONICAL[lw];
    if (w.length === 0) return '';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
  return words.filter(Boolean).join(' ');
}

function toTrimmedString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ');
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function toStrictBoolean(value) {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'y') {
      return true;
    }
    if (
      lower === 'false' ||
      lower === '0' ||
      lower === 'no' ||
      lower === 'n' ||
      lower === ''
    ) {
      return false;
    }
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

function safeParseJsonObject(text) {
  try {
    const data = JSON.parse(text);
    return data !== null && typeof data === 'object' && !Array.isArray(data)
      ? data
      : null;
  } catch {
    return null;
  }
}

function normalizeEvent(raw, now = new Date()) {
  const base = emptyEvent();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return base;
  }

  let foodType = normalizeFoodType(raw.food_type);
  if (!foodType) {
    foodType = 'Unspecified';
  }

  const event = {
    title: toTrimmedString(raw.title),
    location: toTrimmedString(raw.location),
    time: toTrimmedString(raw.time),
    date: toTrimmedString(raw.date),
    food_type: foodType,
    food_available: toStrictBoolean(raw.food_available),
    organization: toTrimmedString(raw.organization),
  };

  return {
    ...event,
    is_happening_soon: computeIsHappeningSoon(event, now),
  };
}

/** Fields required by Core POST /events (non-empty strings). */
function isCoreRequiredFieldsEmpty(event) {
  if (!event || typeof event !== 'object') return true;
  return (
    !String(event.title ?? '').trim() ||
    !String(event.location ?? '').trim() ||
    !String(event.time ?? '').trim() ||
    !String(event.food_type ?? '').trim()
  );
}

/**
 * @param {string} trimmedCaption
 * @param {boolean} useResponseSchema
 */
async function generateNormalizedEventFromCaption(trimmedCaption, useResponseSchema) {
  const model = getGenerativeModel();
  const generationConfig = useResponseSchema
    ? {
        responseMimeType: 'application/json',
        responseSchema: EVENT_RESPONSE_SCHEMA,
      }
    : {
        responseMimeType: 'application/json',
        temperature: 0.2,
      };

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: buildParsePrompt(trimmedCaption) }] },
    ],
    generationConfig,
  });

  const responseText = extractText(result.response);
  const rawJson = stripJsonFence(responseText);
  const parsed = safeParseJsonObject(rawJson);
  if (!parsed) {
    logGeminiDebug(
      'generateNormalizedEventFromCaption.invalidJson',
      String(rawJson).slice(0, 500)
    );
    return null;
  }
  return normalizeEvent(parsed, new Date());
}

/**
 * Last-resort Gemini call: no JSON MIME type (some Vertex configs return empty parts with JSON mode).
 */
async function generateNormalizedEventFromCaptionPlain(trimmedCaption) {
  const model = getGenerativeModel();
  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: buildParsePrompt(trimmedCaption) }] },
    ],
    generationConfig: { temperature: 0.2 },
  });

  const responseText = extractText(result.response);
  const rawJson = stripJsonFence(responseText);
  const parsed = safeParseJsonObject(rawJson);
  if (!parsed) {
    logGeminiDebug(
      'generateNormalizedEventFromCaptionPlain.invalidJson',
      String(rawJson).slice(0, 500)
    );
    return null;
  }
  return normalizeEvent(parsed, new Date());
}

/**
 * Regex-based extraction when Vertex/Gemini is unavailable or returns nothing.
 * Handles common patterns: title (before weekday), time (12h), location (after time, before "Hosted by").
 */
function heuristicParseCaptionToEvent(trimmedCaption, now = new Date()) {
  const s = trimmedCaption.replace(/\s+/g, ' ').trim();
  if (s.length < 8) return null;

  const timeRe = /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i;
  const tm = s.match(timeRe);
  if (!tm || tm.index === undefined) return null;

  const middle =
    tm[2] !== undefined
      ? `${tm[1]}:${tm[2]} ${tm[3]}`
      : `${tm[1]} ${tm[3]}`;
  const tp = parseTimeParts(middle.trim());
  if (!tp) return null;

  const h24 = tp.h;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const time = `${h12}:${String(tp.m).padStart(2, '0')} ${ampm}`;

  const timeIdx = tm.index;
  let afterTime = s.slice(timeIdx + tm[0].length).trim();
  afterTime = afterTime.replace(/^[.,\s]+/, '');
  const beforeHosted = afterTime.split(/\bHosted\s+by\b/i)[0];
  let location = beforeHosted.replace(/\s*\.\s*$/, '').replace(/[.,]+$/, '').trim();
  if (location.length < 2) return null;

  const dayRe =
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i;
  const dm = s.match(dayRe);
  let titleEnd = timeIdx;
  if (dm && dm.index !== undefined && dm.index < timeIdx) {
    titleEnd = dm.index;
  }
  let title = s.slice(0, titleEnd).trim().replace(/[.,\s]+$/g, '');
  if (title.length < 2) {
    title = 'Campus Event';
  }
  if (title.length > 120) {
    title = `${title.slice(0, 117)}...`;
  }

  let food_type = 'Unspecified';
  let food_available = false;
  if (/\bpizza\b/i.test(s)) {
    food_type = 'Pizza';
    food_available = true;
  } else if (/\b(taco|tacos)\b/i.test(s)) {
    food_type = 'Tacos';
    food_available = true;
  } else if (/\b(snack|snacks)\b/i.test(s)) {
    food_type = 'Snacks';
    food_available = true;
  } else if (/\bcoffee\b/i.test(s)) {
    food_type = 'Coffee';
    food_available = true;
  } else if (/\bdrinks?\b/i.test(s)) {
    food_type = 'Drinks';
    food_available = true;
  } else if (
    /\b(free\s+food|catering|donuts?|doughnuts?|lunch|dinner|brunch|bbq|barbecue)\b/i.test(
      s
    )
  ) {
    food_available = true;
  }

  let organization = '';
  const hm = s.match(/\bHosted\s+by\s+([^.,]+)/i);
  if (hm) organization = hm[1].trim();

  return normalizeEvent(
    {
      title,
      location,
      time,
      date: '',
      food_type,
      food_available,
      organization,
    },
    now
  );
}

/**
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function generateText(prompt) {
  if (typeof prompt !== 'string' || prompt.length === 0) {
    throw new Error('prompt must be a non-empty string');
  }

  const model = getGenerativeModel();
  const result = await model.generateContent(prompt);
  return extractText(result.response);
}

/**
 * Parse an Instagram caption into structured event fields using Gemini.
 * On any failure (API, network, invalid JSON), returns a safe empty-shaped object.
 *
 * @param {string} text
 * @returns {Promise<{
 *   title: string,
 *   location: string,
 *   time: string,
 *   date: string,
 *   food_type: string,
 *   food_available: boolean,
 *   organization: string,
 *   is_happening_soon: boolean
 * }>}
 */
async function parseEvent(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return emptyEvent();
  }

  const fallback = emptyEvent();
  const trimmedCaption = text.trim();

  let event = null;
  try {
    event = await generateNormalizedEventFromCaption(trimmedCaption, true);
  } catch (err) {
    logGeminiDebug('parseEvent.generateContent.schema', err);
  }

  if (isCoreRequiredFieldsEmpty(event)) {
    try {
      const second = await generateNormalizedEventFromCaption(
        trimmedCaption,
        false
      );
      if (second) event = second;
    } catch (err) {
      logGeminiDebug('parseEvent.generateContent.jsonFallback', err);
    }
  }

  if (isCoreRequiredFieldsEmpty(event)) {
    try {
      const third = await generateNormalizedEventFromCaptionPlain(
        trimmedCaption
      );
      if (third) event = third;
    } catch (err) {
      logGeminiDebug('parseEvent.generateContent.plain', err);
    }
  }

  if (isCoreRequiredFieldsEmpty(event)) {
    const h = heuristicParseCaptionToEvent(trimmedCaption, new Date());
    if (h && !isCoreRequiredFieldsEmpty(h)) {
      event = h;
    }
  }

  if (!event || isCoreRequiredFieldsEmpty(event)) {
    return fallback;
  }

  return event;
}

/**
 * @returns {Promise<{
 *   title: string,
 *   location: string,
 *   time: string,
 *   date: string,
 *   food_type: string,
 *   food_available: boolean,
 *   organization: string
 * }>}
 */
async function parseEventFromInlineData(mimeType, base64Data) {
  const fallback = emptyEventImageFields();
  const userParts = [
    { text: PARSE_EVENT_FROM_IMAGE_PROMPT },
    { inlineData: { mimeType, data: base64Data } },
  ];

  async function tryVisionParse(generationConfig) {
    const model = getGenerativeModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: userParts }],
      generationConfig,
    });
    const responseText = extractText(result.response);
    const rawJson = stripJsonFence(responseText);
    const parsed = safeParseJsonObject(rawJson);
    if (!parsed) {
      logGeminiDebug(
        'parseEventFromInlineData.invalidJson',
        String(rawJson).slice(0, 500)
      );
      return null;
    }
    const { is_happening_soon: _drop, ...event } = normalizeEvent(
      parsed,
      new Date()
    );
    return event;
  }

  let event = null;
  try {
    event = await tryVisionParse({
      responseMimeType: 'application/json',
      responseSchema: EVENT_RESPONSE_SCHEMA,
    });
  } catch (err) {
    logGeminiDebug('parseEventFromInlineData.schema', err);
  }

  if (isCoreRequiredFieldsEmpty(event)) {
    try {
      const second = await tryVisionParse({
        responseMimeType: 'application/json',
        temperature: 0.2,
      });
      if (second) event = second;
    } catch (err) {
      logGeminiDebug('parseEventFromInlineData.jsonOnly', err);
    }
  }

  if (isCoreRequiredFieldsEmpty(event)) {
    try {
      const third = await tryVisionParse({ temperature: 0.2 });
      if (third) event = third;
    } catch (err) {
      logGeminiDebug('parseEventFromInlineData.plain', err);
    }
  }

  if (!event || isCoreRequiredFieldsEmpty(event)) {
    return fallback;
  }
  return event;
}

/**
 * Parse a flyer/poster/screenshot image (via URL) into structured event fields using Gemini multimodal.
 * On any failure (invalid URL, fetch, API, invalid JSON), returns empty string fields and food_available false.
 *
 * @param {string} imageUrl HTTP(S) URL to an image (fetched server-side and sent as inline data).
 */
async function parseEventFromImage(imageUrl) {
  let inline;
  try {
    inline = await fetchImageAsInlineData(imageUrl);
  } catch (err) {
    logGeminiDebug('parseEventFromImage.fetchImage', err);
    const e = err instanceof Error ? err : new Error(String(err));
    e.code = 'IMAGE_FETCH_FAILED';
    throw e;
  }
  return parseEventFromInlineData(inline.mimeType, inline.data);
}

/**
 * JPEG/PNG upload MIME normalization for multipart uploads.
 * @param {string | undefined} mimetype
 * @param {string | undefined} originalname
 * @returns {'image/jpeg' | 'image/png' | null}
 */
function resolveUploadedImageMime(mimetype, originalname) {
  if (mimetype && typeof mimetype === 'string') {
    const m = mimetype.toLowerCase().split(';')[0].trim();
    if (m === 'image/jpg' || m === 'image/jpeg' || m === 'image/pjpeg') {
      return 'image/jpeg';
    }
    if (m === 'image/png' || m === 'image/x-png') {
      return 'image/png';
    }
    if (m === 'image/webp') {
      return 'image/webp';
    }
  }
  if (originalname && typeof originalname === 'string') {
    const lower = originalname.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
  }
  return null;
}

/**
 * Parse an uploaded JPEG/PNG buffer (inline Gemini image).
 * @param {Buffer} buffer
 * @param {'image/jpeg' | 'image/png' | 'image/webp'} mimeType
 */
async function parseEventFromImageBuffer(buffer, mimeType) {
  const fallback = emptyEventImageFields();
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return fallback;
  }
  if (
    mimeType !== 'image/jpeg' &&
    mimeType !== 'image/png' &&
    mimeType !== 'image/webp'
  ) {
    return fallback;
  }
  return parseEventFromInlineData(mimeType, buffer.toString('base64'));
}

module.exports = {
  generateText,
  parseEvent,
  parseEventFromImage,
  parseEventFromImageBuffer,
  resolveUploadedImageMime,
};
