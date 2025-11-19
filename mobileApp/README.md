# Event Mobile App

A full-featured mobile application for event management built with React Native, Expo, and Firebase.

## Features

- 🔐 **Firebase Authentication** - Secure user registration and login
- 📅 **Event Management** - Browse, view, and register for events
- 💬 **Community Board** - Connect with other attendees
- 👤 **User Profiles** - Manage your account and preferences
- 🎭 **Role-Based Access** - Different features for Attendees, Organizers, and Sponsors
- 🔄 **Real-time Sync** - Firebase Firestore integration
- 📱 **Cross-Platform** - Works on iOS, Android, and Web

## Tech Stack

- **React Native** + **Expo** - Mobile framework
- **Firebase** - Authentication & Firestore database
- **React Navigation** - Navigation system
- **Axios** - API client
- **AsyncStorage** - Local data persistence

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio
- Expo Go app on your phone (for testing)

## Getting Started

### 1. Install Dependencies

```bash
cd mobileApp
npm install
```

### 2. Configure Firebase

Update `firebase.config.js` with your Firebase project credentials:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

Get these credentials from:
1. Firebase Console → Project Settings → General
2. Scroll down to "Your apps"
3. Select your web app or create one

### 3. Update Backend URL

In `firebase.config.js`, update the backend API URL:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_LOCAL_IP:3000', // For physical device testing
  // Or
  BASE_URL: 'http://localhost:3000', // For simulator/emulator
};
```

**Important**: For physical device testing, use your computer's local IP address (e.g., `http://192.168.1.100:3000`) instead of `localhost`.

### 4. Start the Backend

In a separate terminal:

```bash
cd ../backend
npm start
```

Backend should be running on http://localhost:3000

### 5. Start the Mobile App

```bash
npm start
```

This will open Expo DevTools in your browser.

### 6. Run on Device/Simulator

Choose one:

- **📱 Physical Device**: 
  - Install "Expo Go" from App Store/Play Store
  - Scan the QR code from Expo DevTools
  
- **📱 iOS Simulator** (Mac only):
  - Press `i` in terminal
  - Or click "Run on iOS simulator" in Expo DevTools
  
- **📱 Android Emulator**:
  - Press `a` in terminal
  - Or click "Run on Android emulator" in Expo DevTools
  
- **🌐 Web Browser**:
  - Press `w` in terminal
  - Or click "Run in web browser" in Expo DevTools

## Project Structure

```
mobileApp/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js          # Authentication context & hooks
│   ├── navigation/
│   │   └── RootNavigator.js        # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.js          # Login screen
│   │   ├── RegisterScreen.js       # Registration screen
│   │   ├── EventsScreen.js         # Events listing
│   │   ├── EventDetailsScreen.js   # Event details
│   │   ├── CommunityScreen.js      # Community board
│   │   └── ProfileScreen.js        # User profile
│   └── services/
│       └── api.js                  # API client & services
├── firebase.config.js              # Firebase configuration
├── App.js                          # Main app component
└── app.json                        # Expo configuration
```

## Available Scripts

```bash
# Start development server
npm start

# Start with cleared cache
npm start -- --clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

## Features & Screens

### Authentication
- **Login** - Email/password authentication with Firebase
- **Register** - Create account with role selection (Attendee/Organizer/Sponsor)
- **Password Reset** - Firebase password reset email

### Events
- **Events List** - Browse all available events
- **Event Details** - View complete event information
- **Register for Events** - Sign up for events
- **My Events** - View registered events

### Community
- **Community Board** - View and create posts
- **Connect** - Network with other attendees
- **Share Updates** - Post to community

### Profile
- **View Profile** - See your account information
- **Edit Profile** - Update your details
- **Settings** - Manage app preferences
- **Logout** - Sign out of the app

### Organizer Features (Role-Based)
- **Manage Events** - Create, edit, delete events
- **View Attendees** - See who's registered
- **Send Announcements** - Notify attendees

## API Integration

The app connects to the Express.js backend running on port 3000:

**Endpoints Used:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (JWT fallback)
- `POST /api/auth/verify-firebase-token` - Verify Firebase token
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event details
- `GET /api/community_posts` - Get community posts
- `POST /api/community_posts` - Create post
- `GET /api/auth/me` - Get current user

## Authentication Flow

1. User registers/logs in through Firebase Auth
2. Firebase returns ID token
3. App sends token to backend for verification
4. Backend creates/updates user in Firestore
5. User data stored locally in AsyncStorage
6. Token automatically refreshed on API calls

## Troubleshooting

### "Network request failed"
- Check backend is running on http://localhost:3000
- For physical devices, use your computer's IP address
- Check firewall isn't blocking connections

### "Firebase: Error (auth/network-request-failed)"
- Check internet connection
- Verify Firebase configuration in `firebase.config.js`
- Check Firebase project is active

### "Unable to resolve module"
- Clear cache: `npm start -- --clear`
- Delete node_modules: `rm -rf node_modules && npm install`

### App crashes on startup
- Check all dependencies installed: `npm install`
- Verify React Native Gesture Handler is properly set up
- Check console logs for specific errors

## Testing on Physical Devices

### iOS Device:
1. Install "Expo Go" from App Store
2. Scan QR code from Expo DevTools
3. Update `BASE_URL` to your computer's IP
4. Ensure device and computer on same WiFi

### Android Device:
1. Install "Expo Go" from Play Store
2. Scan QR code or enter URL manually
3. Update `BASE_URL` to your computer's IP
4. Ensure device and computer on same WiFi

## Building for Production

### Generate APK (Android):
```bash
expo build:android
```

### Generate IPA (iOS):
```bash
expo build:ios
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Environment Variables

Create `.env` file for environment-specific configuration:

```env
API_URL=http://localhost:3000
FIREBASE_API_KEY=your_api_key
```

## Next Steps

- [ ] Add offline support with AsyncStorage
- [ ] Implement push notifications
- [ ] Add image upload for events and profiles
- [ ] Implement event search and filtering
- [ ] Add QR code scanning for check-in
- [ ] Implement real-time chat
- [ ] Add payment integration for paid events

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Support

For issues or questions:
- Check [Expo Documentation](https://docs.expo.dev/)
- Check [React Native Firebase](https://rnfirebase.io/)
- Open an issue in the repository

## Version

Current Version: 1.0.0

Last Updated: November 11, 2025
