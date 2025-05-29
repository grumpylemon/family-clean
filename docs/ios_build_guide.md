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

1. **Prebuild Error - File Copy Failed**:
   If you see: `ENOENT: no such file or directory, copyfile '/Users/expo/workingdir/build/ios/GoogleService-Info.plist'`
   
   This happens because Expo prebuild expects the file in the project root during build. Solutions:
   
   **Option A: Use EAS Secrets (Recommended for sensitive files)**:
   ```bash
   # Base64 encode the file
   base64 -i ios/GoogleService-Info.plist | pbcopy
   
   # Set as EAS secret
   eas secret:create --name GOOGLE_SERVICE_INFO_PLIST --value "paste-base64-here" --type file
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
   
   **Option B: Copy file to root during build**:
   Create a file `.easignore` and ensure it doesn't exclude the ios folder.
   
   Then update eas.json with a pre-build hook:
   ```json
   {
     "build": {
       "production": {
         "ios": {
           "buildConfiguration": "Release"
         }
       }
     }
   }
   ```

2. **File not tracked by Git**:
   ```bash
   # Check if file is tracked
   git ls-files | grep GoogleService-Info.plist
   
   # If not listed, add it to git
   git add ios/GoogleService-Info.plist
   git commit -m "Add GoogleService-Info.plist for iOS builds"
   git push
   ```

3. **File in .gitignore**:
   - Check your .gitignore file
   - GoogleService-Info.plist should NOT be ignored for EAS builds
   - Remove any entries that might exclude it

4. **Wrong file path in app.json**:
   - For managed workflow, the file should be at the project root
   - Update app.json: `"googleServicesFile": "./GoogleService-Info.plist"`
   - Copy the file: `cp ios/GoogleService-Info.plist ./`

### "Firebase not initialized" Error
- Ensure `GoogleService-Info.plist` is in the `ios/` directory
- Verify the `googleServicesFile` property is in app.json iOS config
- Rebuild the app after adding the file

### App Stuck in Demo/Mock Mode (TestFlight Issue)
**CRITICAL ISSUE**: iOS TestFlight app showing "Setting up demo mode..." instead of using real Firebase.

This issue persists despite previous fixes. Here's the comprehensive troubleshooting approach:

#### 1. **Environment Variable Issues (Most Likely Cause)**
Check if environment variables are being incorrectly processed:

```bash
# Check your .env file
cat .env | grep EXPO_PUBLIC_USE_MOCK

# The value should be exactly: false (not "false" or undefined)
# If it's anything else, update it:
echo "EXPO_PUBLIC_USE_MOCK=false" >> .env
```

**Critical Fix**: Add explicit environment variable override in app.json:
```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_USE_MOCK": false
    }
  }
}
```

#### 2. **__DEV__ Flag Not Working in Production**
The `__DEV__` flag might not be false in EAS builds. Add this override to firebase.ts:

```javascript
// Force production detection for EAS builds
const isProductionBuild = !__DEV__ || process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_FORCE_PRODUCTION === 'true';

if (isProductionBuild) {
  console.log('FORCING PRODUCTION MODE - REAL FIREBASE');
  return false;
}
```

#### 3. **Firebase Config Validation Failing**
If Firebase config validation fails, it falls back to mock. Check environment variables:

```bash
# Verify all Firebase env vars are set
echo "API_KEY: $EXPO_PUBLIC_FIREBASE_API_KEY"
echo "PROJECT_ID: $EXPO_PUBLIC_FIREBASE_PROJECT_ID" 
echo "APP_ID: $EXPO_PUBLIC_FIREBASE_APP_ID"
```

#### 4. **EAS Environment Variable Override**
Set explicit environment variables in EAS:

```bash
# Force production mode via EAS secret
eas secret:create --name EXPO_PUBLIC_FORCE_PRODUCTION --value "true"
eas secret:create --name EXPO_PUBLIC_USE_MOCK --value "false"
```

Then update eas.json:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FORCE_PRODUCTION": "true",
        "EXPO_PUBLIC_USE_MOCK": "false"
      }
    }
  }
}
```

#### 5. **Constants.appOwnership Detection Issue** 
The expo-constants detection might be failing. Add this debug logging:

```javascript
// In shouldUseMock function, add more logging:
console.log('=== DETAILED ENVIRONMENT DEBUG ===');
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('typeof __DEV__:', typeof __DEV__);
console.log('__DEV__ value:', __DEV__);
console.log('Platform.OS:', Platform.OS);
try {
  const Constants = require('expo-constants').default;
  console.log('Constants.appOwnership:', Constants.appOwnership);
  console.log('Constants.expoVersion:', Constants.expoVersion);
  console.log('Constants.isDevice:', Constants.isDevice);
} catch (e) {
  console.log('Constants error:', e);
}
console.log('================================');
```

#### 6. **Quick Debug Steps**
1. Check console logs in TestFlight app (use remote debugging)
2. Look for the "=== FIREBASE INITIALIZATION DECISION ===" log
3. Verify `Using Mock Firebase: false` appears
4. If `Using Mock Firebase: true`, check which condition is triggering it

#### 7. **Nuclear Option - Hardcode Production Mode**
As a last resort, temporarily hardcode production mode:

```javascript
export const shouldUseMock = (): boolean => {
  // TEMPORARY OVERRIDE FOR TESTFLIGHT DEBUG
  if (Platform.OS === 'ios') {
    console.log('HARDCODED: iOS production build - forcing real Firebase');
    return false;
  }
  // ... rest of logic
};
```

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

## LATEST FIXES APPLIED (Build 11) - TestFlight Demo Mode Issue

### Comprehensive Solution for "Setting up demo mode..." Error

After multiple attempts, we've implemented a comprehensive multi-layered approach:

#### ✅ **Primary Fixes Applied**:

1. **app.json Environment Override**:
   ```json
   "extra": {
     "EXPO_PUBLIC_USE_MOCK": false,
     "EXPO_PUBLIC_FORCE_PRODUCTION": true
   }
   ```

2. **eas.json Production Environment**:
   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_FORCE_PRODUCTION": "true",
       "EXPO_PUBLIC_USE_MOCK": "false",
       "NODE_ENV": "production"
     }
   }
   ```

3. **Enhanced firebase.ts Detection**:
   - Multiple production detection methods
   - Explicit `EXPO_PUBLIC_FORCE_PRODUCTION` override
   - Comprehensive logging for debugging
   - Fallback mechanisms for environment detection

#### ✅ **Verification Steps for Build 11**:

1. **Check Console Logs** in TestFlight app for:
   ```
   === FIREBASE DEBUG: shouldUseMock() ===
   EXPO_PUBLIC_FORCE_PRODUCTION: true
   PRODUCTION MODE FORCED via EXPO_PUBLIC_FORCE_PRODUCTION
   Using Mock Firebase: false
   ```

2. **If Still Demo Mode**, look for:
   - Environment variable values in logs
   - Constants.appOwnership detection results
   - Firebase validation errors

3. **Remote Debugging**: Connect device to debug console to see all logs

#### ✅ **Build Command**:
```bash
eas build --platform ios --profile production --auto-submit
```

This build (11) should finally resolve the TestFlight demo mode issue with the multi-layered approach.

## Next Steps
1. Build with `eas build --platform ios --profile production --auto-submit`
2. Test Build 11 on TestFlight for real Firebase integration
3. Review console logs if still in demo mode
4. Submit to App Store when real Firebase is confirmed working