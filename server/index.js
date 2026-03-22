require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/media', express.static(path.resolve(__dirname, '..', 'data', 'images')));

app.get('/', (req, res) => {
  res.json({
    service: 'CampusEats API',
    get: ['/health'],
    post: ['/parse', '/parse-image'],
    mount: ['/events'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/events', require('./routes/events'));
app.use('/parse', require('./routes/parse'));
app.use('/parse-image', require('./routes/parse-image'));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  return next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
