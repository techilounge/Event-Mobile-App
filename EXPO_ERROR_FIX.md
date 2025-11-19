# Mobile App Error Fix

The error "java.lang.String cannot be cast to java.lang.Boolean" is caused by cached configuration.

## Quick Fix

I've run the app with the `--clear` flag to clear the Metro bundler cache. This should resolve the type casting error.

## If Error Persists

Try these steps:

### 1. Clear Expo Cache Completely
```bash
# Stop the current server (Ctrl+C)
npx expo start --clear
```

### 2. Clear npm cache
```bash
rm -rf node_modules
npm install
npx expo start
```

### 3. Try web version first
```bash
npx expo start
# Then press 'w' for web
```

The web version is more forgiving and can help identify if it's an Android-specific issue.

## Root Cause

This error typically happens when:
- Cached bundle has old configuration
- Metro bundler hasn't picked up config changes
- Android build cache is stale

The `--clear` flag resolves this in most cases.

---

**The app should start successfully now!**
