# How to Run the App with Custom Dev Client

## The Confusion: Two Different Servers

Your Event Mobile App uses **TWO separate servers**:

1. **Metro Dev Server** (Local on your computer)
   - Serves the React Native JavaScript code
   - Runs on your local network (e.g., `192.168.x.x:8081`)
   - This is what you connect to with the custom dev client

2. **Railway Backend API** (Production)
   - Your Node.js/Express API server
   - Runs at `https://event-mobile-app-production.up.railway.app`
   - The app makes API calls to this (already configured in your code)

## ✅ Correct Steps to Run the App

### Step 1: Start the Metro Dev Server (on your computer)

Open a terminal in the `mobileApp` folder:

```bash
cd mobileApp
npx expo start --dev-client
```

You should see output like:
```
Metro waiting on exp://192.168.1.100:8081
› Press s │ switch to Expo Go
```

### Step 2: Connect Your Android Device

**Option A: Scan QR Code**
1. Make sure your Android device is on the **same Wi-Fi network** as your computer
2. Open the custom dev client app you installed (it should have your app icon)
3. Tap "Scan QR Code" or "Enter URL manually"
4. Scan the QR code displayed in the terminal
5. The app will connect and load

**Option B: USB Connection (if QR code doesn't work)**
1. Connect your Android device via USB
2. Enable USB debugging on your device
3. Run: `adb reverse tcp:8081 tcp:8081`
4. Then manually enter URL in the app: `http://localhost:8081`

### Step 3: App Loads and Connects to Backend

Once connected to Metro:
- The app loads the JavaScript code from your local Metro server
- The app makes API calls to your Railway backend (already configured)
- You can see your app running!

## 🚫 What NOT to Do

**DON'T** try to connect to `https://event-mobile-app-production.up.railway.app` in the custom dev client. That's your API backend, not the Metro dev server.

## Troubleshooting

### Error: "Unable to load script"
**Cause**: Can't connect to Metro dev server  
**Fix**: 
- Make sure Metro is running (`npx expo start --dev-client`)
- Your device and computer are on the same Wi-Fi
- Try USB connection with `adb reverse`

### Error: "Network request failed" (when calling API)
**Cause**: Railway backend is down or unreachable  
**Fix**: Check if backend is running at https://event-mobile-app-production.up.railway.app

### Can't scan QR code
**Fix**: 
1. Enable USB debugging on your device
2. Connect via USB
3. Run: `adb reverse tcp:8081 tcp:8081`
4. Manually enter: `http://localhost:8081`

## Quick Reference

```bash
# Start dev server
cd mobileApp
npx expo start --dev-client

# If USB connected
adb reverse tcp:8081 tcp:8081

# Check if backend is up
curl https://event-mobile-app-production.up.railway.app
```

## Summary

1. **Run Metro dev server** on your computer: `npx expo start --dev-client`
2. **Connect your custom dev client app** to Metro (via QR code or USB)
3. **App automatically uses Railway backend** for API calls (already configured)

That's it! The Railway URL is for API calls, not for connecting the dev client.
