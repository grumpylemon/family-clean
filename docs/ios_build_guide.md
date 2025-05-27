# iOS Build Guide for Family Clean

## Overview
This guide explains how to build and deploy the Family Clean app for iOS with real Firebase integration.

## Current Setup
- **Expo Go (Development)**: Uses mock Firebase due to Expo Go limitations
- **Production Builds**: Uses real Firebase for full functionality

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

### "Firebase not initialized" Error
- Ensure `GoogleService-Info.plist` is in the `ios/` directory
- Rebuild the app after adding the file

### Authentication Not Working
- Check Firebase Console > Authentication > Sign-in methods
- Enable the providers you need (Google, Anonymous)

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