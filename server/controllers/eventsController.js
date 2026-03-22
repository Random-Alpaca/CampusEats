const eventModel = require('../models/event');
const ics = require('ics');

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

    const { title, location, lat, lng, time, food_type, organization, date, instagram_url } = req.body;
    const event = await eventModel.createEvent({
      title,
      location,
      lat,
      lng,
      time,
      food_type,
      organization: organization || '',
      date: date || '',
      instagram_url: instagram_url || '',
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

async function exportCalendar(req, res, next) {
  try {
    const { id } = req.params;
    const event = await eventModel.getEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // ics module uses 1-indexed months
    let date = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    
    const timeStr = typeof event.time === 'string' ? event.time.trim() : '';

    // Simplified time parsing matching gemini.js time logic
    let m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (m) {
      let h = parseInt(m[1], 10);
      let min = parseInt(m[2], 10);
      const ap = m[3] ? m[3].toUpperCase() : null;
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      hour = h;
      minute = min;
    } else {
      const single = timeStr.match(/^(\d{1,2})\s*(AM|PM)$/i);
      if (single) {
        let h = parseInt(single[1], 10);
        const ap = single[2].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        hour = h;
        minute = 0;
      }
    }

    const eventData = {
      start: [year, month, date, hour, minute],
      duration: { hours: 1, minutes: 0 },
      title: event.title || 'Campus Eats Event',
      description: `Food type: ${event.food_type || 'Unspecified'} | Time: ${event.time}`,
      location: event.location || '',
      geo: { lat: event.lat || 0, lon: event.lng || 0 },
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
    };

    ics.createEvent(eventData, (error, value) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to generate calendar event' });
      }
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="event-${id}.ics"`);
      return res.send(value);
    });
  } catch (err) {
    return next(err);
  }
}

async function exportGoogleCalendar(req, res, next) {
  try {
    const { id } = req.params;
    const event = await eventModel.getEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let date = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();

    const timeStr = typeof event.time === 'string' ? event.time.trim() : '';

    let m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (m) {
      let h = parseInt(m[1], 10);
      let min = parseInt(m[2], 10);
      const ap = m[3] ? m[3].toUpperCase() : null;
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      hour = h;
      minute = min;
    } else {
      const single = timeStr.match(/^(\d{1,2})\s*(AM|PM)$/i);
      if (single) {
        let h = parseInt(single[1], 10);
        const ap = single[2].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        hour = h;
        minute = 0;
      }
    }

    // Build start/end Date objects (1 hour duration)
    const start = new Date(year, month, date, hour, minute, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    // Format as YYYYMMDDTHHmmss (local time, no trailing Z)
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Campus Eats Event',
      dates: `${fmt(start)}/${fmt(end)}`,
      location: event.location || '',
      details: `Food type: ${event.food_type || 'Unspecified'}`,
    });

    const gcalUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    return res.redirect(gcalUrl);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listEvents,
  createEvent,
  vote,
  exportCalendar,
  exportGoogleCalendar,
};
