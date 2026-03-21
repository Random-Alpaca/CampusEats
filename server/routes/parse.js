const express = require('express');
const parseController = require('../controllers/parseController');

const router = express.Router();

router.post('/', parseController.parseCaption);

module.exports = router;
