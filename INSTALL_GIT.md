# Installing Git for EAS Build

## Why Git is Needed

EAS Build requires Git to:
- Track your code changes
- Upload your project to Expo's build servers
- Manage build versions

## Install Git for Windows

### Option 1: Git for Windows (Recommended)
1. **Download**: https://git-scm.com/download/win
2. **Run installer** - use default settings
3. **Restart VS Code** (or your terminal)
4. **Verify**: Run `git --version`

### Option 2: GitHub Desktop (Easier)
1. **Download**: https://desktop.github.com
2. Includes Git automatically
3. **Restart VS Code**

## After Installing Git

Once Git is installed, we'll set up your repository and build:

```bash
# Initialize git repo
cd c:/Users/techi/APPs/Event-Mobile-App-main
git init
git add .
git commit -m "Initial commit for EAS build"

# Build development client
cd mobileApp
eas build --profile development --platform android
```

The build will:
- Upload your code to Expo servers
- Build in the cloud (works on Windows!)
- Provide download link for APK (~10-15 min)

## Alternative: Try Standard Expo Go One More Time

While Git is installing, you could try one more thing - update Expo Go app on your phone:
1. Open Google Play Store
2. Update "Expo Go" to latest version
3. Try scanning QR code again

**Install Git and let me know when ready!** 🚀
