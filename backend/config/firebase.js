const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin SDK for server-side operations
 */

let firebaseApp;
let initialized = false;

function initializeFirebase() {
  if (initialized) {
    return firebaseApp;
  }

  try {
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

    // Option 1: Use service account file (recommended for local development)
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || 'event-mobile-app-8805b',
      });
      console.log('✅ Firebase Admin SDK initialized (using service account file)');
    }
    // Option 2: Use environment variables (recommended for production)
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'event-mobile-app-8805b',
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'event-mobile-app-8805b',
      });
      console.log('✅ Firebase Admin SDK initialized (using environment variables)');
    }
    // Option 3: Use default credentials (for Google Cloud environments)
    else {
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'event-mobile-app-8805b',
      });
      console.log('✅ Firebase Admin SDK initialized (using default credentials)');
    }

    initialized = true;
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
}

// Initialize Firebase
// Removed top-level initialization to allow lazy loading and prevent startup crashes
// if (process.env.USE_FIREBASE === 'true') {
//   initializeFirebase();
// }

// Get Firestore instance
const getDb = () => {
  if (!initialized && process.env.USE_FIREBASE === 'true') {
    initializeFirebase();
  }
  if (!initialized) {
    throw new Error('Firebase not initialized. Set USE_FIREBASE=true and provide service account.');
  }
  return admin.firestore();
};

// Get Auth instance
const getAuth = () => {
  if (!initialized && process.env.USE_FIREBASE === 'true') {
    initializeFirebase();
  }
  if (!initialized) {
    throw new Error('Firebase not initialized. Set USE_FIREBASE=true and provide service account.');
  }
  return admin.auth();
};

// Get Storage instance
const getStorage = () => {
  if (!initialized && process.env.USE_FIREBASE === 'true') {
    initializeFirebase();
  }
  if (!initialized) {
    throw new Error('Firebase not initialized. Set USE_FIREBASE=true and provide service account.');
  }
  return admin.storage();
};

// Lazy getters that initialize on first access
let _db = null;
let _auth = null;
let _storage = null;

module.exports = {
  admin,
  get db() {
    if (!_db) _db = getDb();
    return _db;
  },
  get auth() {
    if (!_auth) _auth = getAuth();
    return _auth;
  },
  get storage() {
    if (!_storage) _storage = getStorage();
    return _storage;
  },
  firebaseApp: initialized ? firebaseApp : null,
  initializeFirebase,
};

