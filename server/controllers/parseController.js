const { parseEvent } = require('../../services/gemini');

/** Placeholder coordinates until geocoding or user-provided location exists */
const DUMMY_LAT = 37.4274;
const DUMMY_LNG = -122.1697;

function coreApiBaseUrl() {
  const raw = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
  return raw.replace(/\/$/, '');
}

async function saveParsedEventToCore(parsed_event) {
  const body = {
    title: parsed_event.title,
    location: parsed_event.location,
    time: parsed_event.time,
    food_type: parsed_event.food_type,
    lat: DUMMY_LAT,
    lng: DUMMY_LNG,
  };

  const res = await fetch(`${coreApiBaseUrl()}/events`, {
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
    const err = new Error('Core API POST /events failed');
    err.status = 502;
    err.details = data;
    throw err;
  }

  return data;
}

async function parseCaption(req, res, next) {
  try {
    const { text } = req.body ?? {};

    if (text === undefined || text === null) {
      return res.status(400).json({ error: 'text is required' });
    }
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text must be a string' });
    }
    if (text.trim() === '') {
      return res.status(400).json({ error: 'text must not be empty' });
    }

    const parsed_event = await parseEvent(text);

    try {
      const saved_event = await saveParsedEventToCore(parsed_event);
      return res.status(200).json({ parsed_event, saved_event });
    } catch (saveErr) {
      if (saveErr.status === 502) {
        return res.status(502).json({
          error: 'Failed to save event via Core API',
          parsed_event,
          details: saveErr.details,
        });
      }
      return next(saveErr);
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  parseCaption,
};
