# Google Authentication with Firebase - Family Compass App

## Overview
This document contains all the critical information about implementing and maintaining Google Authentication with Firebase in the Family Compass app. This has been a challenging integration due to bundling issues between Expo/Metro and Firebase Auth.

## Key Versions
- **Firebase SDK**: 11.8.1
- **Expo SDK**: ~53.0.9
- **React Native**: 0.79.2
- **Working Versions**: v2.99+ (after fixing bundling issues)

## The Core Issue
After integrating Zustand for state management, Metro bundler started loading the React Native version of Firebase Auth for web builds. The React Native version doesn't include browser-specific methods like `signInWithPopup`, causing "signInWithPopup is not a function" errors.

## Firebase Console Configuration

### Authentication Settings Required
1. **Sign-in Providers**:
   - Google: ENABLED 
   - Anonymous: ENABLED 
   
2. **Authorized Domains** (Firebase Console > Authentication > Settings):
   - `localhost` (Default)
   - `family-fun-app.firebaseapp.com` (Default)
   - `family-fun-app.web.app` (Default)
   - Add any custom domains here

3. **OAuth Consent Screen** (Google Cloud Console):
   - Must be configured with app name, support email, etc.
   - Required for production OAuth flow

## Architecture Solution

### 1. Platform-Specific Auth Service (`services/authService.ts`)
```typescript
// Routes to different implementations based on platform
if (Platform.OS === 'web') {
  const { firebaseAuthBrowser } = await import('./firebaseAuthBrowser');
  return await firebaseAuthBrowser.signInWithGoogle(auth);
}
```

### 2. Browser-Specific Dynamic Loading (`services/firebaseAuthBrowser.ts`)
The key solution that fixed the bundling issue:
```typescript
// Dynamic import for browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  import('firebase/auth').then((firebaseAuth) => {
    signInWithPopup = firebaseAuth.signInWithPopup;
    GoogleAuthProvider = firebaseAuth.GoogleAuthProvider;
    // ... other functions
  });
}
```

### 3. Async Loading Handler
Critical for handling the timing of dynamic imports:
```typescript
async waitForAuth(): Promise<void> {
  let attempts = 0;
  while (!signInWithPopup && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  if (!signInWithPopup) {
    throw new Error('Firebase Auth failed to load after 5 seconds');
  }
}
```

### 4. Auth State Listener Fix
Handles async loading for `onAuthStateChanged`:
```typescript
onAuthStateChanged(auth: Auth, callback: (user: FirebaseUser | null) => void) {
  if (!onAuthStateChanged) {
    const checkInterval = setInterval(() => {
      if (onAuthStateChanged) {
        clearInterval(checkInterval);
        onAuthStateChanged(auth, callback);
      }
    }, 100);
    return () => clearInterval(checkInterval);
  }
  return onAuthStateChanged(auth, callback);
}
```

## Metro Configuration Issues

### Metro Config (`metro.config.js`)
```javascript
// Disable package exports for Firebase compatibility
config.resolver.unstable_enablePackageExports = false;

// Force browser version for web builds
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

// Custom resolver attempts (note: this didn't fully work)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'firebase/auth') {
    // Attempt to force browser version
  }
};
```

### Webpack Config (`webpack.config.js`)
```javascript
// Force browser version of Firebase Auth
alias: {
  'firebase/auth$': require.resolve('firebase/auth/dist/index.esm.js'),
  '@firebase/auth': require.resolve('@firebase/auth/dist/index.esm.js')
}
```

## Firebase Initialization

### Key Firebase Config (`config/firebase.ts`)
```typescript
// Platform detection for auth initialization
const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';

if (isWeb) {
  // Use standard getAuth for web
  return getAuth(app);
} else {
  // Use initializeAuth with AsyncStorage for React Native
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}
```

## Firestore Connection Fix

### Long Polling Configuration (v2.100)
Fixes Firestore 400 Bad Request errors:
```typescript
const { initializeFirestore } = await import('firebase/firestore');
_firestoreDb = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
  useFetchStreams: false
});
```

## Common Errors and Solutions

### 1. "signInWithPopup is not a function"
**Cause**: Metro loading React Native version of Firebase Auth
**Solution**: Use dynamic imports in `firebaseAuthBrowser.ts`

### 2. "TypeError: u is not a function" (minified)
**Cause**: Function being minified and lost during bundling
**Solution**: 
- Add to webpack terser reserved list
- Fix Zustand store merge function to preserve actions

### 3. "WebChannelConnection RPC 'Listen' stream transport errored"
**Cause**: Firestore connection issues
**Solution**: Enable long polling with `experimentalForceLongPolling: true`

### 4. Stuck on "Setting up demo mode..."
**Cause**: App incorrectly detecting it should use mock Firebase
**Solution**: Fix `shouldUseMock()` logic in `config/firebase.ts`

## Testing Authentication

### Manual Test Script
Located at: `scripts/manual-test-v299.html`
- Opens app in new tab
- Provides clear test instructions
- Shows expected results

### Puppeteer Test Scripts
- `scripts/test-v298.js` - Tests dynamic loading
- `scripts/test-firebase-functions.js` - Detailed function availability test

## Important Files

### Core Authentication Files
- `/services/authService.ts` - Main auth service router
- `/services/firebaseAuthBrowser.ts` - Browser-specific implementation
- `/config/firebase.ts` - Firebase initialization and configuration
- `/stores/authSlice.ts` - Zustand auth state management
- `/contexts/AuthContext.tsx` - React Context wrapper (bridges to Zustand)

### UI Components
- `/app/login.tsx` - Login screen with Google sign-in button
- `/hooks/useAuth.ts` - Main auth hook used by components

## Deployment Notes

### Version History
- **v2.85-v2.97**: Various attempts to fix bundling issues
- **v2.98**: Implemented dynamic loading approach
- **v2.99**: Fixed auth state listener async loading
- **v2.100**: Added Firestore long polling fix
- **v2.101**: Fixed existing user profile loading on Google sign-in
- **v2.108**: Fixed CORS issues with popup fallback to redirect authentication

### CORS Fix (v2.108)
When `signInWithPopup` fails due to Cross-Origin-Opener-Policy:
```typescript
try {
  return await signInWithPopup(auth, provider);
} catch (error: any) {
  if (error.message?.includes('Cross-Origin-Opener-Policy')) {
    // Fallback to redirect
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult) return redirectResult;
    
    await signInWithRedirect(auth, provider);
    throw new Error('Redirect initiated');
  }
  throw error;
}
```

### Build Commands
```bash
# Clear cache before building (important!)
npm run clear-cache

# Build and deploy web
npm run export-web
```

## User Profile & Family Loading

### Important: Existing User Sign-In (v2.101)
When a user signs in with Google, the auth slice now properly checks for existing user profiles:

```typescript
// First try to get existing user profile
let user: User | null = await getUserProfile(firebaseUser.uid);

if (!user) {
  // Create new user only if profile doesn't exist
  user = { /* new user data */ };
  await createOrUpdateUserProfile(user.uid, user);
} else {
  // Update existing user's metadata
  user.lastActiveDate = new Date().toISOString();
  user.displayName = firebaseUser.displayName || user.displayName;
  user.photoURL = firebaseUser.photoURL || user.photoURL;
  await createOrUpdateUserProfile(user.uid, user);
}
```

This ensures that:
1. Existing users retain their `familyId` and other data
2. The FamilyContext loads the family data when user has a `familyId`
3. Dashboard properly shows family content instead of FamilySetup

## Future Considerations

1. **Metro Bundler**: The warnings about "Could not resolve browser entry for firebase/auth" can be ignored - they're from the custom resolver, but our dynamic loading bypasses this.

2. **Alternative Approach**: Consider using Firebase Auth CDN for web builds:
   ```html
   <script src="https://www.gstatic.com/firebasejs/11.8.1/firebase-auth-compat.js"></script>
   ```

3. **Monitoring**: Keep an eye on Firebase SDK updates that might fix the bundling issues natively.

4. **Testing**: Always test auth in both development and production builds, as behavior can differ.

## Security Reminders

1. Never commit Firebase API keys to public repos (use environment variables)
2. Always configure authorized domains in Firebase Console
3. Set up proper Firestore security rules
4. Enable only necessary authentication providers
5. Configure OAuth consent screen for production apps

---

*Last Updated: May 29, 2025*
*Last Working Version: v2.108*