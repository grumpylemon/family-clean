# iOS EAS Build Checklist

This checklist helps prevent failed builds and saves time/money by catching issues locally before sending to EAS Build.

## 🚀 Quick Start

```bash
# Run this before every EAS build:
npm run build-ios
```

This command now automatically:
1. Fixes react-native-safe-area-context for iOS
2. Increments build number
3. Runs comprehensive pre-build validation
4. Only proceeds to EAS if all checks pass

## 🧪 Manual Testing Commands

### 1. Full Pre-Build Validation
```bash
node scripts/pre-eas-build-check.js
```

### 2. Detailed iOS Build Test
```bash
node scripts/test-ios-build-local.js
```

### 3. Quick Metro Bundle Test
```bash
npx react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --bundle-output /tmp/test.jsbundle
```

## ✅ Pre-Build Checklist

### Dependencies
- [ ] Run `npm install` to ensure all packages are installed
- [ ] Run `npx expo install --check` to fix version mismatches
- [ ] Verify `react-native-svg` is version 15.11.2 (Expo SDK 53 requirement)

### Configuration
- [ ] `app.json` has `ios.bundleIdentifier` set
- [ ] `app.json` has `ios.buildNumber` (auto-incremented)
- [ ] `eas.json` exists with production profile
- [ ] `GoogleService-Info.plist` is in project root or ios/ folder

### Environment
- [ ] Firebase environment variables are set in EAS secrets or `.env`
- [ ] `EXPO_PUBLIC_USE_MOCK` is NOT set to true for production

### Code Quality
- [ ] `babel.config.js` doesn't have problematic codegen configuration
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`

### Build Testing
- [ ] Metro bundler can create production bundle
- [ ] `expo export:embed` succeeds for iOS
- [ ] No "Cannot read properties of null" errors

## 🐛 Common Issues & Fixes

### 1. Babel Plugin Codegen Error
**Error**: `Cannot read properties of null (reading 'loc')`

**Fix**: Remove `@react-native/babel-plugin-codegen` from babel.config.js or ensure it's configured correctly.

### 2. Package Version Mismatches
**Error**: expo doctor warnings about package versions

**Fix**: Run `npx expo install --check` and accept updates

### 3. Missing Environment Variables
**Error**: Firebase initialization fails

**Fix**: 
- Add variables to EAS secrets: `eas secret:create`
- Or add to `eas.json` build profile env section

### 4. Build Number Already Used
**Error**: App Store Connect rejects build

**Fix**: Build number auto-increments, but if needed manually update in app.json

## 📊 Cost-Saving Tips

1. **Always run pre-build validation** - catches 90% of issues locally
2. **Use build cache** - don't clear cache unless necessary
3. **Test on simulator first** - use `expo run:ios` for local testing
4. **Monitor build logs** - cancel builds early if you see errors

## 🔧 Advanced Debugging

### Check What EAS Will Bundle
```bash
# This simulates what EAS does
npx expo export:embed --platform ios --dev false --output /tmp/test
```

### Inspect Metro Resolution
```bash
# See what Metro is bundling
npx react-native bundle --platform ios --dev false --verbose
```

### Test Specific Babel Transforms
```bash
# Test babel on a specific file
npx babel node_modules/react-native/src/private/specs_DEPRECATED/components/ActivityIndicatorViewNativeComponent.js
```

## 📝 Version History

- v2.163: Added comprehensive pre-build validation
- v2.162: Fixed babel-plugin-codegen issues
- v2.161: Fixed react-native-svg version mismatch

## 🆘 Still Having Issues?

1. Check the [EAS Build logs](https://expo.dev/accounts/grumpylemon/projects/family-chores/builds)
2. Run `eas build --clear-cache` (last resort - costs more)
3. Check React Native 0.79.2 [known issues](https://github.com/react-native-community/releases/issues)
4. File an issue with full error logs