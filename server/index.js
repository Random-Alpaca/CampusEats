require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/events', require('./routes/events'));

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

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
