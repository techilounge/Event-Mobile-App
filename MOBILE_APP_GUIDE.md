# Running Your Mobile App 📱

Your mobile app is now configured to connect to your deployed Railway backend!

## Quick Start

1. **Navigate to mobile app directory:**
   ```bash
   cd mobileApp
   ```

2. **Start the Expo server:**
   ```bash
   npm start
   ```

3. **Run on your device:**
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w` to open in browser

## What's Connected

✅ **Backend API**: `https://event-mobile-app-production.up.railway.app`  
✅ **Firebase Auth**: Configured and ready  
✅ **All API endpoints**: Events, Users, Community, etc.

## Testing the Connection

Once the app loads on your device:

1. Try **creating an account** (Register screen)
2. **Login** with your new account
3. View **Events** list
4. Check **Community** posts
5. View your **Profile**

The app will communicate with your Railway backend for all data!

## Troubleshooting

### "Network Error" or "Unable to connect"
- Verify Railway backend is running (visit URL in browser)
- Check your device has internet connection
- Make sure you're not in development mode (which uses localhost)

### Changes not showing up
- Stop the Expo server (Ctrl+C)
- Run `npm start` again
- Clear app data or reinstall

### Firebase auth issues
- Check Firebase configuration in `firebase.config.js`
- Ensure Firebase project is active

## Build for Production

To create standalone apps for App Store/Play Store:

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Environment Modes

- **Development** (`__DEV__ = true`): Uses `http://localhost:3000`
- **Production** (`__DEV__ = false`): Uses `https://event-mobile-app-production.up.railway.app`

When you run with Expo, it automatically detects the mode!

---

**Your app is ready to use!** 🎉
