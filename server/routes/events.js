const express = require('express');
const eventsController = require('../controllers/eventsController');

const router = express.Router();

router.get('/', eventsController.listEvents);
router.post('/', eventsController.createEvent);
router.post('/:id/vote', eventsController.vote);

module.exports = router;
