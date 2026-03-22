/**
 * Firestore (firebase-admin)
 *
 * Service account JSON (do not commit):
 *   1. Firebase Console → Project settings → Service accounts → Generate new private key.
 *   2. Save the file as: config/firebase-service-account.json (path is gitignored).
 *   3. Set GOOGLE_APPLICATION_CREDENTIALS to that path (see .env.example).
 *
 * In production (e.g. Vercel), set FIREBASE_SERVICE_ACCOUNT_JSON to the full
 * JSON string contents of the service account file instead of a file path.
 */
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Option 1: JSON string in env var (Vercel / serverless)
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    const serviceAccount = JSON.parse(jsonEnv);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Option 2: File path (local development)
    const keyPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!keyPath) {
      throw new Error(
        'Set FIREBASE_SERVICE_ACCOUNT_JSON (for Vercel) or GOOGLE_APPLICATION_CREDENTIALS (for local dev) — see .env.example.'
      );
    }

    const resolvedPath = path.isAbsolute(keyPath)
      ? keyPath
      : path.resolve(process.cwd(), keyPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Service account file not found: ${resolvedPath}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert(resolvedPath),
    });
  }
}

const db = admin.firestore();

module.exports = db;
