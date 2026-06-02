const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

let initialized = false;

function initializeFirebase() {
  if (initialized) return;

  try {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(__dirname, '../../scriptumai-39607-firebase-adminsdk-fbsvc-645028dcb9.json');

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    logger.info('Firebase Admin SDK initialized');
  } catch (err) {
    logger.warn('Firebase Admin SDK not initialized — push notifications disabled', { error: err.message });
    return;
  }
}

function isFirebaseReady() {
  return initialized;
}

module.exports = { admin, initializeFirebase, isFirebaseReady };
