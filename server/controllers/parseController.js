const {
  parseEvent,
  parseEventFromImage,
  parseEventFromImageBuffer,
  resolveUploadedImageMime,
} = require('../../services/gemini');

/** Placeholder coordinates until geocoding or user-provided location exists */
const DUMMY_LAT = 37.4274;
const DUMMY_LNG = -122.1697;

function coreApiBaseUrl() {
  const raw = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
  return raw.replace(/\/$/, '');
}

/** Matches Core POST /events validation (non-empty strings). */
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

async function saveParsedEventToCore(parsed_event) {
  const body = {
    title: parsed_event.title,
    location: parsed_event.location,
    time: parsed_event.time,
    food_type: parsed_event.food_type,
    organization: parsed_event.organization || '',
    date: parsed_event.date || '',
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

    if (!hasRequiredFieldsForCore(parsed_event)) {
      return res.status(422).json({
        error:
          'Parser did not extract title, location, time, and food type from the caption. Check PROJECT_ID, LOCATION, and Vertex AI access, or set GEMINI_DEBUG=1 on the server for details.',
        parsed_event,
      });
    }

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

async function parseImage(req, res, next) {
  try {
    const ct = req.headers['content-type'] || '';
    const isMultipart = ct.includes('multipart/form-data');

    if (req.file) {
      const mime = resolveUploadedImageMime(req.file.mimetype, req.file.originalname);
      if (!mime) {
        return res.status(400).json({
          error: 'Image must be JPEG, PNG, or WebP',
        });
      }
      const event = await parseEventFromImageBuffer(req.file.buffer, mime);
      return res.status(200).json({ event });
    }

    if (isMultipart) {
      return res.status(400).json({
        error:
          'Missing image file. Send multipart/form-data with field name "image" (JPEG, PNG, or WebP).',
      });
    }

    const { imageUrl } = req.body ?? {};

    if (imageUrl === undefined || imageUrl === null) {
      return res.status(400).json({
        error:
          'Provide either multipart/form-data with field "image" (JPEG/PNG/WebP) or JSON body with imageUrl',
      });
    }
    if (typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'imageUrl must be a string' });
    }
    const trimmed = imageUrl.trim();
    if (trimmed === '') {
      return res.status(400).json({ error: 'imageUrl must not be empty' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      return res.status(400).json({ error: 'imageUrl must be a valid URL' });
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'imageUrl must use http or https' });
    }

    const event = await parseEventFromImage(trimmed);
    return res.status(200).json({ event });
  } catch (err) {
    if (err && err.code === 'IMAGE_FETCH_FAILED') {
      return res.status(422).json({
        error: err.message,
        hint:
          'Instagram and some CDNs block server downloads or expire links. Save the image (right-click → Save) and POST it with: curl -F "image=@yourfile.webp" http://127.0.0.1:3000/parse-image',
      });
    }
    return next(err);
  }
}

module.exports = {
  parseCaption,
  parseImage,
};
