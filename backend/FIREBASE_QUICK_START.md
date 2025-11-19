# Firebase Integration - Quick Start

## ✅ What's Been Done

All Firebase integration files have been created and your code has been updated! Here's what you need to do next:

## Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **event-mobile-app-8805b**
3. Click **⚙️ Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file
6. **Save it as**: `backend/firebase-service-account.json`

⚠️ **IMPORTANT**: This file is already in `.gitignore` - never commit it!

## Step 2: Update .env File

Add these lines to `backend/.env`:

```env
USE_FIREBASE=true
FIREBASE_PROJECT_ID=event-mobile-app-8805b
```

## Step 3: Test Firebase Connection

```bash
cd backend
node test-firebase.js
```

You should see:
```
✅ Firestore connection successful
✅ Firebase Auth connection successful
✅ All Firebase services connected successfully!
🔥 Your backend is ready to use Firebase!
```

## Step 4: Start Your Server

```bash
npm start
```

You should see:
```
🔥 Firebase initialized
✅ Firebase Admin SDK initialized (using service account file)
🚀 Server is running on port 3000
🔥 Firebase enabled
📦 Database: Firestore
```

## Step 5: Update Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules and paste:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOrganizer() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer';
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isOrganizer());
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isOrganizer());
      allow delete: if isOrganizer();
    }
    
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isOrganizer();
    }
    
    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isOrganizer();
    }
    
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

Click **"Publish"**

## How Authentication Works Now

### Mobile App Flow (Recommended)

1. **Mobile app** authenticates user with Firebase Auth
2. **Mobile app** gets Firebase ID token
3. **Mobile app** sends token to backend: `Authorization: Bearer <firebase-id-token>`
4. **Backend** verifies token and returns data

### Example API Call

```javascript
// In your mobile app
const idToken = await firebase.auth().currentUser.getIdToken();

fetch('http://your-api.com/api/events', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

## Testing with Firebase

### Test Token Verification Endpoint

```bash
# First, get a Firebase ID token from your mobile app
# Then test:
curl -X POST http://localhost:3000/api/auth/verify-firebase-token \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your-firebase-id-token-here"}'
```

### Test Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer your-firebase-id-token-here"
```

## What Changed

✅ **Database**: Now uses Firestore when `USE_FIREBASE=true`  
✅ **Authentication**: Supports Firebase ID tokens  
✅ **All Endpoints**: Updated to use database adapter  
✅ **Backward Compatible**: Still works with JWT/PostgreSQL/JSON if Firebase disabled  

## Files Created

- `backend/config/firebase.js` - Firebase configuration
- `backend/db/firestoreAdapter.js` - Firestore database operations
- `backend/middleware/firebaseAuth.js` - Firebase token verification
- `backend/test-firebase.js` - Connection test script
- `backend/README_FIREBASE.md` - Complete documentation

## Files Updated

- `backend/db/adapter.js` - Now supports Firebase
- `backend/routes/auth.js` - Firebase Auth integration
- `backend/index.js` - All endpoints use database adapter
- `backend/.gitignore` - Added Firebase files
- `backend/ENV_EXAMPLE.txt` - Added Firebase config

## Next Steps

1. ✅ Download service account key
2. ✅ Set `USE_FIREBASE=true` in `.env`
3. ✅ Test connection: `node test-firebase.js`
4. ✅ Update Firestore security rules
5. ⏳ Test all API endpoints
6. ⏳ Integrate with mobile app

## Troubleshooting

**"Firebase not initialized" error:**
- Check `firebase-service-account.json` exists
- Verify `USE_FIREBASE=true` in `.env`
- Check file path is correct

**"Permission denied" in Firestore:**
- Update security rules (see Step 5)
- Check user is authenticated
- Verify user role/permissions

**Connection test fails:**
- Verify service account key is valid
- Check Firebase project ID matches
- Ensure Firebase is enabled in console

## Documentation

- **Complete Guide**: See `README_FIREBASE.md`
- **Quick Start**: This file
- **Environment Config**: See `ENV_EXAMPLE.txt`

Your backend is now fully integrated with Firebase! 🎉

