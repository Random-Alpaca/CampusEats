/**
 * Firestore (firebase-admin)
 *
 * Service account JSON (do not commit):
 *   1. Firebase Console → Project settings → Service accounts → Generate new private key.
 *   2. Save the file as: config/firebase-service-account.json (path is gitignored).
 *   3. Set GOOGLE_APPLICATION_CREDENTIALS to that path (see .env.example).
 *
 * In production, set the same env var to the file path mounted as a secret, or use
 * workload identity / default credentials on GCP instead of a JSON file.
 */
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!keyPath) {
  throw new Error(
    'Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH to your Firebase service account JSON file path (see comments in config/firebase.js and .env.example).'
  );
}

const resolvedPath = path.isAbsolute(keyPath)
  ? keyPath
  : path.resolve(process.cwd(), keyPath);

if (!fs.existsSync(resolvedPath)) {
  throw new Error(`Service account file not found: ${resolvedPath}`);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(resolvedPath),
  });
}

const db = admin.firestore();

module.exports = db;
