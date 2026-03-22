require('dotenv').config();
const { createEvent } = require('../server/models/event');

async function main() {
  const event = await createEvent({
    title: 'Hackathon Info Session',
    location: 'Huang Engineering Center',
    lat: 37.4277,
    lng: -122.1701,
    time: '7:00 PM',
    food_type: 'Bobas & Snacks',
    organization: 'Stanford Computer Science Society',
    date: 'Oct 25',
    instagram_url: 'https://instagram.com/p/mock123',
  });
  console.log('Created event with new fields:', event);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
