// Auth: GOOGLE_APPLICATION_CREDENTIALS (or gcloud auth application-default login).
// Enable Vertex AI API on the project; grant the account "Vertex AI User" (or Editor) if calls fail with 403.
const {
  VertexAI,
  FunctionDeclarationSchemaType: S,
} = require('@google-cloud/vertexai');

const MODEL_ID = 'gemini-1.5-flash';

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
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text).filter(Boolean).join('');
  if (text) return text;

  const reason = response?.candidates?.[0]?.finishReason;
  throw new Error(
    reason
      ? `No text in Gemini response (finishReason: ${reason})`
      : 'No text in Gemini response'
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

function buildParsePrompt(caption) {
  return `${PARSE_EVENT_PROMPT}${caption}`;
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

  const event = {
    title: toTrimmedString(raw.title),
    location: toTrimmedString(raw.location),
    time: toTrimmedString(raw.time),
    date: toTrimmedString(raw.date),
    food_type: normalizeFoodType(raw.food_type),
    food_available: toStrictBoolean(raw.food_available),
    organization: toTrimmedString(raw.organization),
  };

  return {
    ...event,
    is_happening_soon: computeIsHappeningSoon(event, now),
  };
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

  let responseText;
  try {
    const model = getGenerativeModel();
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: buildParsePrompt(trimmedCaption) }] },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: EVENT_RESPONSE_SCHEMA,
      },
    });
    responseText = extractText(result.response);
  } catch {
    return fallback;
  }

  const rawJson = stripJsonFence(responseText);
  const parsed = safeParseJsonObject(rawJson);
  if (!parsed) {
    return fallback;
  }

  return normalizeEvent(parsed, new Date());
}

module.exports = {
  generateText,
  parseEvent,
};
