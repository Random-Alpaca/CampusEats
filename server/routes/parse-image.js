const express = require('express');
const multer = require('multer');
const parseController = require('../controllers/parseController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function multipartUpload(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('multipart/form-data')) {
    return next();
  }
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image file too large (max 10 MB)' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'Failed to process upload' });
    }
    next();
  });
}

router.post('/', multipartUpload, parseController.parseImage);

module.exports = router;
