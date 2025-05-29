# iOS Build Guide for Family Clean

## Overview
This guide explains how to build and deploy the Family Clean app for iOS with real Firebase integration.

## Current Setup
- **Expo Go (Development)**: Uses mock Firebase due to Expo Go limitations
- **Production Builds**: Uses real Firebase for full functionality

## CRITICAL UPDATE (Build 10) - Firebase Production Build Fix

### Issue Discovered
The iOS production builds were stuck in "Demo mode" (mock Firebase) instead of using real Firebase. This issue persisted for builds 5-9.

### Root Causes Identified
1. **Missing GoogleService-Info.plist reference in app.json**: The iOS configuration didn't include the `googleServicesFile` property
2. **Unreliable Expo Go detection**: The app was using an unreliable method to detect if running in Expo Go vs production build
3. **Environment variables not being properly evaluated in production builds**

### Fixes Applied (Build 10)
1. **Added googleServicesFile to app.json**:
   ```json
   "ios": {
     "googleServicesFile": "./ios/GoogleService-Info.plist",
     ...
   }
   ```

2. **Improved Firebase detection logic in firebase.ts**:
   - Changed from using `isEmbeddedLaunch` to `Constants.appOwnership`
   - Added explicit production build detection using `__DEV__` flag
   - Enhanced logging to clearly show Firebase initialization decisions

3. **Key Code Changes**:
   - Production builds (`__DEV__ === false`) now ALWAYS use real Firebase
   - Better Expo Go detection using `expo-constants`
   - Added comprehensive logging for debugging

### Verification Steps
After building with these changes, check the app logs for:
```
=== FIREBASE INITIALIZATION DECISION ===
Using Mock Firebase: false
Build Type: Production
Platform: ios
=======================================
```

If you see `Using Mock Firebase: false`, the app is correctly using real Firebase.

## Prerequisites
1. Apple Developer Account ($99/year)
2. Xcode installed on Mac
3. EAS CLI installed: `npm install -g eas-cli`

## Setup Steps

### 1. Initialize EAS Build
```bash
# Login to Expo account
eas login

# Configure your project for EAS Build
eas build:configure
```

### 2. Create iOS Credentials
```bash
# EAS will guide you through creating certificates
eas credentials
```

### 3. Configure Firebase for iOS

#### Download Firebase Config
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (family-fun-app)
3. Go to Project Settings > General
4. Under "Your apps", click "Add app" > iOS
5. Enter your Bundle ID (from app.json)
6. Download `GoogleService-Info.plist`

#### Add Firebase Config to Project
```bash
# Create ios directory if it doesn't exist
mkdir -p ios

# Move the downloaded file
mv ~/Downloads/GoogleService-Info.plist ios/
```

### 4. Update app.json
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.familyclean",
      "buildNumber": "1.0.0",
      "googleServicesFile": "./ios/GoogleService-Info.plist"
    }
  }
}
```

### 5. Install Firebase SDK
```bash
# Install native Firebase modules
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

## Build Commands

### Development Build (for testing)
```bash
# Creates a build you can install on your device for testing
eas build --platform ios --profile development
```

### Preview Build (for TestFlight)
```bash
# Creates a build for internal testing
eas build --platform ios --profile preview
```

### Production Build (for App Store)
```bash
# Creates a build for App Store submission
eas build --platform ios --profile production

# Or with auto-submit to App Store after build completes
eas build --platform ios --profile production --auto-submit
```

## Testing Workflow

### 1. Local Development (Expo Go)
```bash
npm start
# Scan QR code with Expo Go app
# Uses mock Firebase automatically
```

### 2. Development Build Testing
```bash
# Build development version
eas build --platform ios --profile development

# Install on device via QR code or link
# Uses real Firebase
```

### 3. TestFlight Testing
```bash
# Build preview version
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit -p ios
```

## Environment Configuration

The app automatically detects the environment:
- **Expo Go**: Mock Firebase (automatic)
- **Development/Production builds**: Real Firebase

To force mock mode in any environment:
```bash
# In .env file
EXPO_PUBLIC_USE_MOCK=true
```

## Troubleshooting

### "GoogleService-Info.plist is missing" Build Error
This error occurs when EAS Build cannot find the GoogleService-Info.plist file. Common causes and solutions:

1. **File not tracked by Git**:
   ```bash
   # Check if file is tracked
   git ls-files | grep GoogleService-Info.plist
   
   # If not listed, add it to git
   git add ios/GoogleService-Info.plist
   git commit -m "Add GoogleService-Info.plist for iOS builds"
   git push
   ```

2. **File in .gitignore**:
   - Check your .gitignore file
   - GoogleService-Info.plist should NOT be ignored for EAS builds
   - Remove any entries that might exclude it

3. **Wrong file path in app.json**:
   - Ensure the path is correct: `"googleServicesFile": "./ios/GoogleService-Info.plist"`
   - The path is relative to your project root

4. **Using Environment Variables (Alternative)**:
   If you prefer not to commit the file to git, use EAS environment variables:
   ```bash
   # Base64 encode the file
   base64 -i ios/GoogleService-Info.plist | pbcopy
   
   # Set as EAS secret
   eas secret:create --name GOOGLE_SERVICE_INFO_PLIST --value "paste-base64-here"
   ```
   
   Then update eas.json:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "GOOGLE_SERVICE_INFO_PLIST": "@file:GOOGLE_SERVICE_INFO_PLIST"
         }
       }
     }
   }
   ```

### "Firebase not initialized" Error
- Ensure `GoogleService-Info.plist` is in the `ios/` directory
- Verify the `googleServicesFile` property is in app.json iOS config
- Rebuild the app after adding the file

### App Stuck in Demo/Mock Mode
1. Check the console logs for Firebase initialization decision
2. Verify `__DEV__` is `false` in production builds
3. Ensure `EXPO_PUBLIC_USE_MOCK` is not set to `true` in .env
4. Confirm GoogleService-Info.plist is properly referenced in app.json
5. For EAS builds, ensure you're using production profile: `eas build --platform ios --profile production`

### Authentication Not Working
- Check Firebase Console > Authentication > Sign-in methods
- Enable the providers you need (Google, Anonymous)
- Verify the bundle ID in GoogleService-Info.plist matches app.json

### Firestore Permission Denied
- Check Firestore Security Rules in Firebase Console
- For development, you can use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Build Issues After Changes
- Clear all caches: `npx expo start --clear`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- For EAS builds: `eas build:clear-cache`

### Common Command Typos
- **Wrong**: `as build --platform ios --profile production --auto-submit`
- **Correct**: `eas build --platform ios --profile production --auto-submit`
- Note: The command is `eas` not `as`. EAS stands for Expo Application Services.

## Deployment Checklist
- [ ] Firebase project configured
- [ ] GoogleService-Info.plist added
- [ ] Apple Developer account active
- [ ] Bundle identifier matches Firebase config
- [ ] App icons and splash screens configured
- [ ] Privacy policy URL added (required for App Store)
- [ ] App Store Connect app created

## Next Steps
1. Run `eas build:configure` to set up your project
2. Create your first development build
3. Test with real Firebase
4. Submit to TestFlight for beta testing
5. Submit to App Store when ready