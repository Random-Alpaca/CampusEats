const db = require('../../config/firebase');
const admin = require('firebase-admin');

const COLLECTION = 'events';

const FieldValue = admin.firestore.FieldValue;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function createEvent(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    title: String(data.title ?? ''),
    location: String(data.location ?? ''),
    lat: toNum(data.lat),
    lng: toNum(data.lng),
    time: String(data.time ?? ''),
    food_type: String(data.food_type ?? ''),
    organization: String(data.organization ?? ''),
    date: String(data.date ?? ''),
    instagram_url: String(data.instagram_url ?? ''),
    votes_available: 0,
    votes_finished: 0,
  };
  await ref.set(payload);
  return { id: ref.id, ...payload };
}

async function getAllEvents() {
  const snap = await db.collection(COLLECTION).orderBy('title').get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getEventById(id) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function voteEvent(id, type) {
  if (type !== 'available' && type !== 'finished') {
    throw new Error('type must be "available" or "finished"');
  }
  const field = type === 'available' ? 'votes_available' : 'votes_finished';
  const ref = db.collection(COLLECTION).doc(id);
  await ref.update({ [field]: FieldValue.increment(1) });
}

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  voteEvent,
};
