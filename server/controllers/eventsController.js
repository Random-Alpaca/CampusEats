const eventModel = require('../models/event');

const REQUIRED_EVENT_FIELDS = [
  'title',
  'location',
  'lat',
  'lng',
  'time',
  'food_type',
];

const VOTE_TYPES = new Set(['available', 'finished']);

function validateCreateEventBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }

  const missing = [];
  for (const key of REQUIRED_EVENT_FIELDS) {
    const value = body[key];
    if (value === undefined || value === null) {
      missing.push(key);
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    return `Missing or empty required field(s): ${missing.join(', ')}`;
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat)) {
    return 'lat must be a valid number';
  }
  if (!Number.isFinite(lng)) {
    return 'lng must be a valid number';
  }

  return null;
}

function validateVoteBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }
  const { type } = body;
  if (type === undefined || type === null) {
    return 'type is required';
  }
  if (typeof type !== 'string' || !VOTE_TYPES.has(type)) {
    return 'type must be "available" or "finished"';
  }
  return null;
}

async function listEvents(req, res, next) {
  try {
    const events = await eventModel.getAllEvents();
    return res.status(200).json(events);
  } catch (err) {
    return next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const message = validateCreateEventBody(req.body);
    if (message) {
      return res.status(400).json({ error: message });
    }

    const { title, location, lat, lng, time, food_type } = req.body;
    const event = await eventModel.createEvent({
      title,
      location,
      lat,
      lng,
      time,
      food_type,
    });
    return res.status(201).json(event);
  } catch (err) {
    return next(err);
  }
}

async function vote(req, res, next) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const voteError = validateVoteBody(req.body);
    if (voteError) {
      return res.status(400).json({ error: voteError });
    }

    const { type } = req.body;

    const existing = await eventModel.getEventById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await eventModel.voteEvent(id, type);
    const updated = await eventModel.getEventById(id);
    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listEvents,
  createEvent,
  vote,
};
