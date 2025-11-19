# Building Custom Expo Development Client

Your app uses Expo SDK 54, which requires a custom development client instead of the standard Expo Go app.

## What We're Building

A **custom development client** is like a personalized version of Expo Go that's specifically built for your app. It includes:
- Your exact SDK version (54)
- Your native dependencies (Firebase, etc.)
- Full compatibility with your codebase

## Steps

### 1. Install Dependencies ✅
```bash
npm install expo-dev-client --legacy-peer-deps
```

### 2. Install EAS CLI (In Progress)
```bash
npm install -g eas-cli
```

### 3. Login to Expo Account
```bash
eas login
```
- Create a free account at expo.dev if you don't have one
- Enter your credentials

### 4. Configure Project
```bash
eas build:configure
```
- This creates `eas.json` (already created)

### 5. Build Development Client
```bash
eas build --profile development --platform android
```

This will:
- Upload your code to Expo's build servers
- Build a custom APK with your dependencies
- Provide a download link when complete (takes ~10-15 minutes)

### 6. Install on Device
- Download the APK from the link provided
- Install on your Android device
- Open the custom dev client

### 7. Connect to Development Server
```bash
npx expo start --dev-client
```
- Scan the QR code with your custom client
- App should load without errors!

## Why This Works

The standard Expo Go app doesn't support:
- Expo SDK 54 (too new)
- Custom native modules
- Firebase native libraries

Your custom client supports ALL of these!

## Cost

**FREE** - Expo provides free builds for development clients.

---

**Once the build completes, you'll have a working app on your device! 🎉**
