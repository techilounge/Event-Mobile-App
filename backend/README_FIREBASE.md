# Firebase Integration Guide

## Overview

Your backend now supports Firebase integration! The system automatically uses Firebase when configured, falling back to PostgreSQL or JSON file storage if Firebase is not enabled.

## Architecture

The system uses a **hybrid approach**:
- **Firebase Authentication**: Handled by mobile app, backend verifies tokens
- **Firestore Database**: Stores all application data
- **Express.js Backend**: Provides API layer, business logic, and security

## Setup Instructions

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **event-mobile-app-8805b**
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file
6. Save it as `backend/firebase-service-account.json`

**⚠️ IMPORTANT**: This file contains sensitive credentials. Never commit it to version control!

### Step 2: Configure Environment Variables

Add to your `backend/.env` file:

```env
# Enable Firebase
USE_FIREBASE=true
FIREBASE_PROJECT_ID=event-mobile-app-8805b
```

### Step 3: Test Firebase Connection

Create a test file `backend/test-firebase.js`:

```javascript
require('dotenv').config();
const { db, auth } = require('./config/firebase');

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...\n');
    
    // Test Firestore
    const testRef = db.collection('test');
    await testRef.doc('connection').set({ timestamp: new Date() });
    console.log('✅ Firestore connection successful');
    
    // Test Auth
    const users = await auth.listUsers(1);
    console.log('✅ Firebase Auth connection successful');
    
    console.log('\n✅ All Firebase services connected successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    process.exit(1);
  }
}

testFirebase();
```

Run:
```bash
node test-firebase.js
```

## How It Works

### Database Priority

The system checks in this order:
1. **Firebase** (if `USE_FIREBASE=true`)
2. **PostgreSQL** (if `USE_DATABASE=true`)
3. **JSON file** (fallback)

### Authentication Flow

#### With Firebase Enabled:

1. **Mobile App**: User logs in with Firebase Auth (Email/Password or Google)
2. **Mobile App**: Gets Firebase ID token
3. **Mobile App**: Sends ID token to backend in `Authorization: Bearer <token>` header
4. **Backend**: Verifies token with Firebase Admin SDK
5. **Backend**: Returns data from Firestore

#### Without Firebase (JWT Mode):

1. **Client**: Sends credentials to `/api/auth/login`
2. **Backend**: Validates credentials, generates JWT
3. **Client**: Uses JWT token in requests
4. **Backend**: Verifies JWT token

## API Endpoints

All endpoints work the same way, but authentication method changes:

### With Firebase:
```bash
# Get events (using Firebase ID token)
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer <firebase-id-token>"
```

### Without Firebase:
```bash
# Get events (using JWT token)
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer <jwt-token>"
```

## Firestore Collections

The following collections are created automatically:

- `users` - User profiles and authentication data
- `events` - Event information
- `announcements` - Event announcements
- `community_posts` - Community board posts

## Firestore Security Rules

Update your Firestore security rules in Firebase Console:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isOrganizer() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isOrganizer());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isOrganizer());
      allow delete: if isOrganizer();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isOrganizer();
    }
    
    // Announcements collection
    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isOrganizer();
    }
    
    // Community Posts collection
    match /community_posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        resource.data.createdBy == request.auth.uid || isOrganizer()
      );
    }
  }
}
```

## Mobile App Integration

### React Native Example

```javascript
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Login
const userCredential = await auth().signInWithEmailAndPassword(email, password);
const idToken = await userCredential.user.getIdToken();

// Use token in API calls
const response = await fetch('http://your-api.com/api/events', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
});
```

### Flutter Example

```dart
import 'package:firebase_auth/firebase_auth.dart';

// Login
UserCredential userCredential = await FirebaseAuth.instance.signInWithEmailAndPassword(
  email: email,
  password: password,
);

String idToken = await userCredential.user.getIdToken();

// Use token in API calls
final response = await http.get(
  Uri.parse('http://your-api.com/api/events'),
  headers: {
    'Authorization': 'Bearer $idToken',
  },
);
```

## Data Migration

### From JSON File to Firestore

If you have existing data in `db.json`, you can migrate it:

```javascript
// scripts/migrate-to-firestore.js
require('dotenv').config();
const db = require('../db/adapter');
const fs = require('fs');

const jsonData = JSON.parse(fs.readFileSync('db.json', 'utf8'));

async function migrate() {
  console.log('Migrating data to Firestore...\n');
  
  // Migrate users
  for (const user of jsonData.users) {
    await db.createUser(user);
    console.log(`Migrated user: ${user.email}`);
  }
  
  // Migrate events
  for (const event of jsonData.events) {
    await db.createEvent(event);
    console.log(`Migrated event: ${event.title}`);
  }
  
  // ... migrate other collections
  
  console.log('\n✅ Migration complete!');
}

migrate();
```

## Environment Variables

### Required for Firebase:
```env
USE_FIREBASE=true
FIREBASE_PROJECT_ID=event-mobile-app-8805b
```

### Optional (if not using service account file):
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@event-mobile-app-8805b.iam.gserviceaccount.com
```

## Troubleshooting

### Error: "Firebase Admin SDK initialization failed"

**Solutions:**
1. Check that `firebase-service-account.json` exists in `backend/` directory
2. Verify the file is valid JSON
3. Check that `FIREBASE_PROJECT_ID` matches your Firebase project
4. Ensure `USE_FIREBASE=true` in `.env`

### Error: "Permission denied" in Firestore

**Solutions:**
1. Update Firestore security rules (see above)
2. Check that user is authenticated
3. Verify user has correct role/permissions

### Error: "Invalid token" when using Firebase Auth

**Solutions:**
1. Ensure mobile app is using correct Firebase project
2. Check that token hasn't expired
3. Verify token is being sent correctly in Authorization header

### Data not appearing in Firestore

**Solutions:**
1. Check Firestore console in Firebase
2. Verify security rules allow the operation
3. Check backend logs for errors
4. Ensure `USE_FIREBASE=true` is set

## Benefits of Firebase Integration

✅ **Real-time Updates**: Firestore supports real-time listeners  
✅ **Scalability**: Automatically scales with your app  
✅ **Offline Support**: Built-in offline persistence  
✅ **Security**: Firestore security rules  
✅ **Authentication**: Integrated with Firebase Auth  
✅ **Cloud Storage**: Easy file uploads with Firebase Storage  
✅ **Analytics**: Built-in analytics and monitoring  

## Next Steps

1. ✅ Firebase integration - **COMPLETED**
2. ⏳ Update Firestore security rules
3. ⏳ Test all endpoints with Firebase
4. ⏳ Migrate existing data (if needed)
5. ⏳ Set up Firebase Storage for file uploads
6. ⏳ Configure Firebase Cloud Messaging for push notifications

## Files Created

- `backend/config/firebase.js` - Firebase Admin SDK configuration
- `backend/db/firestoreAdapter.js` - Firestore database adapter
- `backend/middleware/firebaseAuth.js` - Firebase token verification middleware
- Updated `backend/db/adapter.js` - Now supports Firebase
- Updated `backend/routes/auth.js` - Firebase Auth integration
- Updated `backend/index.js` - Uses Firebase when enabled

## Quick Start

1. Download service account key → `backend/firebase-service-account.json`
2. Set `USE_FIREBASE=true` in `.env`
3. Start server: `npm start`
4. Test: `node test-firebase.js`

Your backend is now ready to use Firebase! 🎉

