const eventModel = require('../models/event');

async function listEvents(req, res, next) {
  try {
    const events = await eventModel.getAllEvents();
    res.json(events);
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const { title, location, lat, lng, time, food_type } = req.body;
    const event = await eventModel.createEvent({
      title,
      location,
      lat,
      lng,
      time,
      food_type,
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

async function vote(req, res, next) {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (type !== 'available' && type !== 'finished') {
      return res.status(400).json({
        error: 'type must be "available" or "finished"',
      });
    }

    const existing = await eventModel.getEventById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await eventModel.voteEvent(id, type);
    const updated = await eventModel.getEventById(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  createEvent,
  vote,
};
