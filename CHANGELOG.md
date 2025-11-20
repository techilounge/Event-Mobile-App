# Changelog

All notable changes to the Event Mobile App project.

---

## [2025-11-20] - Backend 502 Error Debugging Session

### 🐛 Critical Issue: Backend 502 Error During Authentication

**Problem Statement:**
Mobile app successfully authenticates with Firebase client SDK, but when attempting to verify the Firebase ID token with the backend's `/api/auth/verify-firebase-token` endpoint, the backend returns a **502 "Application failed to respond"** error. Server starts successfully but crashes/hangs during request processing.

### 🔍 Investigation Steps Performed

**1. React Version Mismatch (RESOLVED ✅)**
- **Issue**: `jest-expo` dev dependency was pulling React 19.1.1, but project needed 19.1.0
- **Fix**: Added npm `overrides` to force React 19.1.0 across all dependencies
- **Files Modified**: `mobileApp/package.json`

**2. Mobile App Network Configuration (RESOLVED ✅)**
- **Issue**: Mobile app was trying to connect to `localhost` instead of Railway backend
- **Fix**: Updated `API_CONFIG.BASE_URL` to always use `https://event-mobile-app-production.up.railway.app`
- **Files Modified**: `mobileApp/firebase.config.js`

**3. Railway Build Failures (RESOLVED ✅)**
- **Issue #1**: "Dockerfile does not exist" error
  - **Fix**: Removed `backend/railway.json` to allow auto-detection
- **Issue #2**: "Cannot find module 'swagger-ui-express'" crash
  - **Fix**: Moved `swagger-ui-express` and `swagger-jsdoc` from devDependencies to dependencies
- **Files Modified**: `backend/railway.json` (deleted), `backend/package.json`

**4. Firebase Admin SDK Initialization Crash (PARTIALLY RESOLVED ⚠️)**
- **Issue**: Server would crash immediately on startup if Firebase configuration was invalid
- **Fix**: Implemented lazy loading pattern for Firebase Admin SDK
  - Modified `backend/middleware/firebaseAuth.js` to access `firebaseConfig.auth` lazily
  - Modified `backend/db/firestoreAdapter.js` to access `firebaseConfig.db` lazily
  - Removed top-level `initializeFirebase()` call from `backend/index.js`
- **Files Modified**: 
  - `backend/config/firebase.js`
  - `backend/middleware/firebaseAuth.js`
  - `backend/db/firestoreAdapter.js`
  - `backend/routes/auth.js`
  - `backend/index.js`

**5. Silent Process Crashes (IN PROGRESS 🔄)**
- **Issue**: Server starts successfully, shows startup logs, but then silently crashes/hangs without any error logs when processing authentication requests. No heartbeat logs appear.
- **Suspected Root Causes**:
  1. Firebase Admin SDK v13 native module (gRPC) crash
  2. Invalid Firebase environment variable format (especially `FIREBASE_PRIVATE_KEY`)
  3. Container process being killed by Railway's health check
- **Fixes Attempted**:
  - **Added global crash handlers**: `process.on('uncaughtException')`, `process.on('unhandledRejection')` to catch silent crashes
  - **Added heartbeat logging**: `setInterval` every 5 seconds to monitor process liveness
  - **Added debug logging**: Extensive console.log statements in auth route
  - **Downgraded firebase-admin**: Changed from `^13.6.0` to `^11.11.1` (known stable version)
  - **Removed firebase client SDK**: Removed unnecessary `firebase` package from backend
  - **Changed host binding**: Added explicit `0.0.0.0` binding to `app.listen()`
  - **Added test endpoint**: `/api/test-firebase` to test Firebase connectivity in isolation
  - **Disabled Firebase temporarily**: Set `USE_FIREBASE=false` in Railway variables to isolate the issue

**6. npm Build Failures on Railway (IN PROGRESS 🔄)**
- **Issue**: `npm ci --only=production` failing due to package-lock.json mismatch
- **Root Cause**: Repeated edits to `package.json` without regenerating `package-lock.json`
- **Fixes Attempted**:
  - Regenerated `package-lock.json` locally with `npm install`
  - Changed Dockerfile from `npm ci --only=production` to `npm install --production` for more flexible dependency resolution
- **Current Status**: Deployment building (48+ minutes as of last check)
- **Files Modified**: 
  - `backend/package.json`
  - `backend/package-lock.json`
  - `backend/Dockerfile`

### 🔧 Code Changes Summary

**Backend Files Modified:**
- `backend/package.json` - Downgraded firebase-admin to v11, removed firebase client SDK, moved swagger to dependencies
- `backend/package-lock.json` - Regenerated multiple times
- `backend/Dockerfile` - Changed `npm ci` to `npm install`
- `backend/railway.json` - **DELETED**
- `backend/config/firebase.js` - Removed top-level initialization, implemented lazy getters
- `backend/middleware/firebaseAuth.js` - Lazy load firebaseConfig.auth
- `backend/db/firestoreAdapter.js` - Lazy load firebaseConfig.db
- `backend/routes/auth.js` - Lazy load firebaseConfig.auth, added debug logging
- `backend/index.js` - Added heartbeat logging, global crash handlers, `/api/test-firebase` endpoint, explicit `0.0.0.0` binding

**Mobile App Files Modified:**
- `mobileApp/package.json` - Downgraded React to 19.1.0, added overrides
- `mobileApp/firebase.config.js` - Updated API_CONFIG to always use Railway URL

### 🚦 Current Status (As of 2025-11-20 12:28 PM CST)

**Backend Deployment:**
- **Status**: Building (in progress for 48+ minutes)
- **Last Known State**: Build started after Dockerfile npm command change
- **Railway Dashboard**: Shows "Building the image..." with "Limited Access" banner

**Environment Configuration:**
- `USE_FIREBASE` = `false` (temporarily disabled to isolate crash)
- `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID` = Set in Railway variables (format may be incorrect)

**Known Issues:**
1. ❌ Backend 502 error during authentication (root cause unknown)
2. ⚠️ Server starts but doesn't show heartbeat logs (suggests crash/hang)
3. ⚠️ No error logs captured (even with global handlers)
4. ⚠️ Firebase environment variables may have incorrect newline format
5. 🔄 Current build may still fail or crash

### 🎯 Next Steps for Handoff

**IMMEDIATE: Wait for Current Deployment to Complete**
1. Check Railway deployment status
2. If "Active":
   - Check "Deploy Logs" tab for `💓 Heartbeat` messages appearing every 5 seconds
   - If heartbeats present, server is alive → proceed to step 3
   - If no heartbeats, server crashed →go to "If Server Crashes" section
3. Test `/` endpoint: `https://event-mobile-app-production.up.railway.app/`
   - Should return JSON: `{"message":"Backend server is running!", "firebase":"disabled", ...}`
4. Test `/api/test-firebase` endpoint (will return error since USE_FIREBASE=false, but should not crash)

**If Server Stays Alive (Heartbeats Present):**
1. The issue is confirmed to be Firebase-related
2. Re-enable Firebase:
   - Go to Railway → Variables
   - Change `USE_FIREBASE` from `false` to `true`
   - **CRITICAL**: Verify `FIREBASE_PRIVATE_KEY` format:
     - Must have literal `\n` for newlines (not actual newlines)
     - Example: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...==\n-----END PRIVATE KEY-----\n"`
   - Redeploy
3. If it crashes again with Firebase enabled:
   - Check logs for "❌ UNCAUGHT EXCEPTION" or Firebase-related errors
   - The error message will tell you exactly what's wrong
   - Common issues:
     - `FIREBASE_PRIVATE_KEY` has actual newlines instead of `\n`
     - `FIREBASE_PROJECT_ID` incorrect
     - Service account doesn't have correct permissions
4. Once Firebase is working:
   - Test mobile app login
   - Should succeed with user creation in Firestore
   - Email: `gulfkid1@gmail.com` (already exists in Firebase Auth)

**If Server Crashes (No Heartbeats):**
1. Issue is NOT Firebase-specific
2. Check "Deploy Logs" for:
   - "❌ UNCAUGHT EXCEPTION" messages
   - OOM (Out of Memory) errors
   - Container restart messages
3. Try these fallback solutions:
   - Increase Railway memory limit (if available)
   - Further simplify `backend/index.js` (remove middleware one by one)
   - Check if Railway has platform-wide outage
   - Consider alternative deployment (Render, Fly.io)

**If Build Fails:**
1. Check "Build Logs" for npm/Docker errors
2. Likely causes:
   - `package-lock.json` still out of sync
   - Missing dependency
   - Docker image pull failure
3. Solutions:
   - Manually delete `package-lock.json` from Git, let Railway generate it
   - Simplify Dockerfile further (remove `--production` flag)
   - Use different base image (node:18-slim instead of node:18-alpine)

### 📋 Critical Environment Variables on Railway

**Required for Firebase:**
- `USE_FIREBASE` = `true` (currently `false` for testing)
- `FIREBASE_PROJECT_ID` = (your Firebase project ID)
- `FIREBASE_CLIENT_EMAIL` = (from service account JSON)
- `FIREBASE_PRIVATE_KEY` = (from service account JSON - **MUST use `\n` for newlines**)

**Other Important Variables:**
- `PORT` = `8080` (Railway auto-sets this)
- `NODE_ENV` = `production` (Railway auto-sets this)
- `JWT_SECRET` = (for non-Firebase auth, if needed)

### 🔗 Important Links

- **Railway Backend**: https://event-mobile-app-production.up.railway.app
- **GitHub Repo**: https://github.com/techilounge/Event-Mobile-App
- **EAS Project**: https://expo.dev/accounts/techilounge/projects/event-mobile-app
- **Custom Dev Client APK**: https://expo.dev/accounts/techilounge/projects/event-mobile-app/builds/6cdb575b-5c2e-4805-afb8-ab6d17534f01

### 📊 Debugging Tools Added

**In `backend/index.js`:**
- `💓 Heartbeat` logging every 5 seconds (shows RSS and Heap memory)
- `⚡ INCOMING REQUEST` logging for every HTTP request
- `❌ UNCAUGHT EXCEPTION` handler
- `❌ UNHANDLED REJECTION` handler
- `/api/test-firebase` endpoint to test Firebase connectivity

**Look for these logs:**
- `💓 Heartbeat - RSS: XXMBMB - Heap: XXMB` → Server is alive
- `⚡ INCOMING REQUEST: POST /api/auth/verify-firebase-token` → Request reached server
- `🔍 Attempting to verify Firebase ID token...` → Auth route executing
- `✅ firebaseConfig.auth accessed successfully` → Firebase initialized OK
- `✅ Token verified. UID: xxx` → Firebase token verification succeeded
- `❌ UNCAUGHT EXCEPTION: ...` → Fatal crash caught

### 🧪 Manual Testing Commands

**Test Backend Health:**
```bash
curl https://event-mobile-app-production.up.railway.app/
```

** Test Firebase (when re-enabled):**
```bash
# Should return 400 since no Firebase
curl https://event-mobile-app-production.up.railway.app/api/test-firebase

# Should return 401 with invalid token
curl -X POST https://event-mobile-app-production.up.railway.app/api/auth/verify-firebase-token \
  -H "Content-Type: application/json" \
  -d '{"idToken":"invalid"}'
```

**Mobile App Testing:**
```bash
cd mobileApp
npx expo start --dev-client --tunnel
# Scan QR code, try to sign in with gulfkid1@gmail.com
# Check Metro logs for 502 error or success
```

---

## [2025-11-19] - Git Setup & Custom Development Client Build

### ✅ Git Repository Setup

**Completed:**
- ✅ Git installed and verified (version 2.52.0.windows.1)
- ✅ Created comprehensive `.gitignore` for Node.js, Expo, and React Native projects
- ✅ Initialized local Git repository
- ✅ Made initial commit with full project codebase
- ✅ Connected to existing GitHub repository: https://github.com/techilounge/Event-Mobile-App
- ✅ Resolved merge conflicts and pushed code to GitHub
- ✅ All project code now version-controlled and backed up

**Git Commits:**
```
bd76e11 - Initial commit: Event Mobile App with Railway backend deployment
b77f13d - Fix: Update React to 19.2.0 to resolve peer dependency conflict
bac3e35 - Update package-lock.json for React 19.2.0
```

### ✅ Custom Expo Development Client - Build Process

**Build Attempts:**

**Attempt 1** - Failed ❌
- **Error**: `npm ci` exited with non-zero code
- **Root Cause**: Peer dependency conflict - `react-test-renderer@19.2.0` requires `react@^19.2.0`, but project had `react@19.1.1`
- **Fix Applied**: Updated React version in `package.json`

**Attempt 2** - Failed ❌
- **Error**: `package-lock.json` out of sync with `package.json`
- **Root Cause**: Lock file still referenced `react@19.1.1`, missing `react-dom@19.2.0` and `webpack@5.103.0`
- **Fix Applied**: Regenerated `package-lock.json` with `npm install`

**Attempt 3** - Success ✅
- **Result**: Build completed successfully on EAS Build servers
- **Dependencies**: Added 47 packages,changed 1 package, audited 990 packages
- **Security**: 0 vulnerabilities found
- **Build Time**: ~12 minutes
- **Build ID**: `6cdb575b-5c2e-4805-afb8-ab6d17534f01`

### 📱 Custom Development Client APK

**Download Link:**
https://expo.dev/accounts/techilounge/projects/event-mobile-app/builds/6cdb575b-5c2e-4805-afb8-ab6d17534f01

**Build Details:**
- Platform: Android
- Build Type: APK (development)
- Build Profile: `development` (with development client enabled)
- Distribution: Internal
- Size: ~50-60 MB (estimated)

**Features:**
- ✅ Includes all native dependencies (React Navigation, Firebase, AsyncStorage, etc.)
- ✅ Supports Expo SDK 54.0.25
- ✅ Compatible with React Native 0.81.5 and React 19.1.0
- ✅ Pre-configured to connect to Railway backend
- ✅ Eliminates Expo Go compatibility issues

---

## [2025-11-18] - Production Deployment & Infrastructure

### ✅ Backend - Deployed to Production

**Railway Deployment:**
- ✅ Successfully deployed to `https://event-mobile-app-production.up.railway.app`
- ✅ Docker containerization configured (`Dockerfile`, `.dockerignore`)
- ✅ Production environment variables template (`.env.production`)

**Production Features:**
- JWT authentication working
- Firebase integration configured
- Rate limiting enabled
- Input validation with express-validator
- Multi-database support (PostgreSQL/Firestore/JSON)
- CORS configured
- Health check endpoint live

### ✅ API Documentation

**Added:**
- Swagger/OpenAPI documentation at `/api-docs`
- `backend/config/swagger.js` - Swagger configuration
- Interactive API testing via Swagger UI
- Complete endpoint documentation

### ✅ Testing Infrastructure

**Backend Tests:**
- Jest configuration
- `backend/tests/health.test.js` - Health check tests
- Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Status**: All tests passing ✅

**Mobile App Tests:**
- Jest + Expo configuration (`jest.config.js`, `jest.setup.js`)
- `mobileApp/__tests__/App.test.js` - Smoke test
- `mobileApp/__tests__/utils.test.js` - Utility tests
- `mobileApp/__tests__/config.test.js` - Configuration tests
- **Status**: 11/11 tests passing ✅

### 📝 Documentation Added

**Deployment Guides:**
- `RAILWAY_DEPLOYMENT.md` - Step-by-step Railway deployment guide
- `RAILWAY_TROUBLESHOOTING.md` - Common deployment issues and fixes
- `DEPLOYMENT.md` - Main deployment guide with multiple platform options

**Development Guides:**
- `MOBILE_APP_GUIDE.md` - How to run mobile app with deployed backend
- `EXPO_ERROR_FIX.md` - Troubleshooting Expo errors
- `EXPO_DEV_CLIENT_GUIDE.md` - Building custom development client
- `HOW_TO_RUN_DEV_CLIENT.md` - Guide for running the custom dev client correctly

---

## Project Links

- **Backend API**: https://event-mobile-app-production.up.railway.app
- **API Docs**: https://event-mobile-app-production.up.railway.app/api-docs
- **EAS Project**: https://expo.dev/accounts/techilounge/projects/event-mobile-app
- **GitHub Repo**: https://github.com/techilounge/Event-Mobile-App
- **Railway Dashboard**: https://railway.app
