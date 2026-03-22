const express = require('express');
const eventsController = require('../controllers/eventsController');

const router = express.Router();

router.get('/', eventsController.listEvents);
router.post('/', eventsController.createEvent);
router.post('/:id/vote', eventsController.vote);
router.get('/:id/calendar', eventsController.exportCalendar);
router.get('/:id/gcal', eventsController.exportGoogleCalendar);

module.exports = router;
