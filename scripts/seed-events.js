/**
 * Inserts 3 sample events into Firestore (same shape as POST /events).
 * Run from project root: npm run seed:events
 * Requires GOOGLE_APPLICATION_CREDENTIALS / .env like the server.
 */
require('dotenv').config();

const { createEvent } = require('../server/models/event');

// Stanford University campus–style coordinates (distinct buildings, ~1km spread)
const SAMPLES = [
  {
    title: 'Free Pizza',
    location: 'Engineering Building',
    lat: 37.4302,
    lng: -122.1721,
    time: '5:00 PM',
    food_type: 'pizza',
  },
  {
    title: 'Taco Night',
    location: 'Student Union',
    lat: 37.4252,
    lng: -122.1657,
    time: '6:30 PM',
    food_type: 'tacos',
  },
  {
    title: 'Donuts & Coffee',
    location: 'Library',
    lat: 37.4274,
    lng: -122.1697,
    time: '9:00 AM',
    food_type: 'donuts',
  },
];

async function main() {
  const created = [];
  for (const row of SAMPLES) {
    const event = await createEvent(row);
    created.push(event);
    console.log('Created:', event.id, event.title);
  }
  console.log(`\nDone. ${created.length} events inserted. GET /events will list them (ordered by title).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
