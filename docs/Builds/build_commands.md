# Build Commands Documentation

This document describes all build scripts and commands for the Family Compass app, including iOS, Android, and web deployments.

## Table of Contents
- [Quick Reference](#quick-reference)
- [Version Numbering System](#version-numbering-system)
- [iOS Build Commands](#ios-build-commands)
- [Web Build Commands](#web-build-commands)
- [Android Build Commands](#android-build-commands)
- [Local Testing Commands](#local-testing-commands)
- [Utility Commands](#utility-commands)
- [Environment Setup](#environment-setup)
- [Troubleshooting](#troubleshooting)

## Quick Reference

| Platform | Auto Build & Deploy | Build Only | Deploy Only | Local Test |
|----------|-------------------|------------|-------------|------------|
| iOS | `npm run build-ios` | `eas build --platform ios` | `eas submit -p ios` | `expo run:ios` |
| Web | `npm run export-web` | `npx expo export --platform web` | `npx firebase deploy --only hosting` | `npm run web` |
| Android | `eas build --platform android --auto-submit` | `eas build --platform android` | `eas submit -p android` | `expo run:android` |

## Version Numbering System

### App Version (constants/Version.ts → APP_VERSION)
- Format: `vMAJOR.MINOR` (e.g., "v2.165")
- Master version number for the entire app
- Manually updated or incremented by `npm run export-web`
- Used for internal tracking and web builds

### iOS Version (app.json → expo.version) **[Auto-Synced]**
- Format: `MAJOR.MINOR` (e.g., "2.165")
- **Automatically synced** from `constants/Version.ts` when running `npm run build-ios`
- Displayed in TestFlight as "Version 2.165 (build number)"
- No manual updates needed - always matches app version

### iOS Build Number (app.json → expo.ios.buildNumber)
- Format: Integer string (e.g., "24")
- Automatically incremented by `npm run build-ios`
- Required by App Store Connect - must be unique for each upload
- Example: "24" → "25" → "26"

### Version Sync Process
When running `npm run build-ios`:
1. **Version Sync**: `constants/Version.ts` (v2.165) → `app.json` (2.165)
2. **Build Increment**: iOS build number increases (24 → 25)
3. **Result**: TestFlight shows "Version 2.165 (25)"

### Android Version Code
- Currently manual - update in `app.json` → `expo.android.versionCode`
- Must be incremented for each Play Store upload

## iOS Build Commands

### 1. Auto Build & Submit to App Store
```bash
npm run build-ios
```

**Steps performed:**
1. **Version Sync**: Syncs `app.json` version from `constants/Version.ts`
2. **Build Increment**: Auto-increments iOS build number in app.json
3. **Pre-build Validation**: Runs comprehensive checks
4. **EAS Build**: Executes `eas build --platform ios --auto-submit`
5. **Cloud Build**: Builds on EAS servers
6. **Auto Submit**: Automatically submits to App Store Connect for TestFlight

**When to use:** Production releases to TestFlight/App Store

### 2. Build Only (No Submit)
```bash
eas build --platform ios
```

**Steps performed:**
1. Builds iOS app on EAS servers
2. Downloads .ipa file
3. Does NOT submit to App Store

**When to use:** Testing builds or manual submission

### 3. Submit Existing Build
```bash
eas submit -p ios --latest
# or with specific build ID:
eas submit -p ios --id=<build-id>
```

**When to use:** Submitting a previously built .ipa to App Store

### 4. Local iOS Testing
```bash
npm run ios
# or
expo run:ios
```

**Steps performed:**
1. Builds app locally using Xcode
2. Runs on iOS Simulator
3. Uses development build with Expo Go features

**When to use:** Development and testing

## Web Build Commands

### 1. Auto Build & Deploy to Firebase Hosting
```bash
npm run export-web
```

**Steps performed by `increment-version.js`:**
1. Auto-increments version in app.json
2. Runs `npx expo export --platform web --output-dir dist`
3. Builds optimized production bundle
4. Deploys to Firebase Hosting
5. Shows deployment URL: https://family-fun-app.web.app

**When to use:** Production web deployments

### 2. Build Only (No Deploy)
```bash
npx expo export --platform web --output-dir dist
```

**Steps performed:**
1. Creates production web bundle in `dist/` folder
2. Optimizes assets and code
3. Does NOT deploy

**When to use:** Testing build output before deployment

### 3. Deploy Only (Existing Build)
```bash
npx firebase deploy --only hosting
```

**Prerequisites:** Must have built files in `dist/` folder

**When to use:** Re-deploying existing build

### 4. Local Web Testing
```bash
npm run web
# or
npm start -- --web
```

**Steps performed:**
1. Starts development server
2. Opens in browser at http://localhost:8081
3. Hot reloading enabled

**When to use:** Web development and testing

## Android Build Commands

### 1. Auto Build & Submit to Play Store
```bash
eas build --platform android --auto-submit
```

**Steps performed:**
1. Builds Android app on EAS servers
2. Creates .aab file (Android App Bundle)
3. Automatically submits to Google Play Console

**When to use:** Production releases

### 2. Build Only
```bash
eas build --platform android
```

**When to use:** Testing builds or manual submission

### 3. Build APK for Direct Installation
```bash
eas build --platform android --profile preview
```

**Note:** Requires "preview" profile in eas.json

**When to use:** Testing on physical devices without Play Store

### 4. Local Android Testing
```bash
npm run android
# or
expo run:android
```

**Prerequisites:** Android Studio and emulator/device

**When to use:** Development and testing

## Local Testing Commands

### Pre-Build Validation
```bash
node scripts/pre-eas-build-check.js
```

**Checks performed:**
- Node/npm/expo/eas versions
- Package version compatibility
- Babel configuration
- Metro bundler test
- iOS configuration
- Environment variables
- expo export:embed simulation

### Test Metro Bundler
```bash
node scripts/test-metro-bundle.js
```

**When to use:** Debugging bundling issues

### Test iOS Build Locally
```bash
node scripts/test-ios-build-local.js
```

**Comprehensive iOS build testing**

## Utility Commands

### Clear Cache
```bash
npm run clear-cache
```
Removes node_modules cache and starts with clean cache

### Fix Dependencies
```bash
npx expo install --check
```
Fixes version mismatches for Expo SDK

### Run Linter
```bash
npm run lint
```
Checks code quality

### Version Sync Only
```bash
node scripts/sync-versions.js
```
Syncs `app.json` version with `constants/Version.ts` without building

### Increment Build Number Only
```bash
node scripts/increment-ios-build.js
```
Syncs version AND increments iOS build number without building

## Environment Setup

### Required Environment Variables
Create `.env` file with:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### EAS Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure
```

### Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if needed)
firebase init
```

## Troubleshooting

### iOS Build Failures

1. **"Cannot read properties of null" error**
   - Run `node scripts/fix-safe-area-ios-build.js`
   - Already automated in `npm run build-ios`

2. **Package version mismatches**
   - Run `npx expo install --check`
   - Accept suggested versions

3. **Build number already used**
   - Run `node scripts/increment-ios-build.js` to increment build number
   - This also syncs the version from `constants/Version.ts`

### Web Build Issues

1. **Firebase deployment fails**
   - Check `firebase login`
   - Verify project in `.firebaserc`
   - Check hosting config in `firebase.json`

2. **Bundle size too large**
   - Check for unused dependencies
   - Enable code splitting

### General Issues

1. **Path alias (@/) errors**
   - Currently using relative imports
   - Metro config needs adjustment for aliases

2. **Environment variables missing**
   - Check `.env` file exists
   - Verify all EXPO_PUBLIC_ variables set
   - For EAS: use `eas secret:create`

## Build Monitoring

- **EAS Builds**: https://expo.dev/accounts/grumpylemon/projects/family-chores/builds
- **Firebase Console**: https://console.firebase.google.com/project/family-fun-app
- **App Store Connect**: https://appstoreconnect.apple.com

## Best Practices

1. **Always run pre-build validation** before expensive EAS builds
2. **Test locally first** using `expo run:ios` or `expo run:android`
3. **Check version numbers** before building to avoid conflicts
4. **Monitor build logs** for warnings and errors
5. **Use preview builds** for testing before production
6. **Keep dependencies updated** with `npx expo install --check`

## Cost Optimization

1. **Use local validation** to catch errors before EAS
2. **Share builds** instead of building for each tester
3. **Use build cache** - don't clear unless necessary
4. **Cancel failed builds early** when you spot errors
5. **Use preview profile** for testing (smaller builds)