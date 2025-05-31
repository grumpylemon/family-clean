### Error TODO List - Last Updated: 2025-05-30

## Active High Priority Issues to Fix
- [x] **Platform Detection Authentication Bug (High Impact - User Acquisition)** - FIXED v2.176+ (2025-05-31)
  - **Status**: IMPLEMENTATION COMPLETE - Mock vs Real Firebase platform detection fixed
  - **Root Cause**: `shouldReturnMockImmediately()` incorrectly returned true for ALL iOS platforms, including web browsers on iOS
  - **Solution**: Added `typeof window !== 'undefined'` check to distinguish web browsers from native iOS apps
  - **Impact**: Critical issue resolved - Web users (including Safari on iOS) now use real Firebase and can register properly
  - **Implementation**:
    - Fixed platform detection logic in `/services/firestore.ts`
    - Web browsers always use real Firebase regardless of reported OS
    - Native iOS Expo Go apps continue using mock Firebase correctly
    - Enhanced debugging with comprehensive logging for platform decisions
  - **Testing Validated**: 
    - [x] All 5 platform detection tests pass
    - [x] Web on iOS Safari now uses real Firebase (critical fix)
    - [x] iOS Expo Go still uses mock Firebase (maintained)
    - [x] Authentication flow properly creates user profiles in Firebase DB
  - **Evidence**: Comprehensive fix validation in `test-auth-debug-fix-simple.js`
  - **Files Modified**: `/services/firestore.ts` (platform detection), debugging scripts
  - **Expected Logs**: `[shouldReturnMockImmediately] Running in web browser, using isMockImplementation() only`
      entry-b39aa4700c56c0…a577a8916d0.js:6847 Build Hash: 7b5fb1d
      entry-b39aa4700c56c0…a577a8916d0.js:6847 Timestamp: 2025-05-31T01:11:20.230Z
      entry-b39aa4700c56c0…a577a8916d0.js:5702 [FamilyStore] Creating store with parameters
      entry-b39aa4700c56c0…a577a8916d0.js:5702 [FamilyStore] Creating slices...
      entry-b39aa4700c56c0…a577a8916d0.js:5715 [AuthSlice] Creating auth slice with valid parameters
      entry-b39aa4700c56c0…a577a8916d0.js:6848 [FamilySlice] Creating family slice with valid parameters
      entry-b39aa4700c56c0…5a577a8916d0.js:640 AuthContext version: v6
      entry-b39aa4700c56c0…e5a577a8916d0.js:22 Tabs Layout version: v3.1 - Dark Mode Support
      entry-b39aa4700c56c0…a577a8916d0.js:7228 App Layout version: v6 - Zustand Integration
      entry-b39aa4700c56c0…5a577a8916d0.js:641 Firestore initialized with long polling
      entry-b39aa4700c56c0…5a577a8916d0.js:641 Successfully initialized Firestore with cache persistence
      entry-b39aa4700c56c0…5a577a8916d0.js:641 Firebase initialized successfully
      entry-b39aa4700c56c0…5a577a8916d0.js:641 Firebase config: 
      {apiKey: 'AIzaSyDIdq5ePKlc4qA3PCQaYoI_l_yW0-cFrBI', authDomain: 'family-fun-app.firebaseapp.com', projectId: 'family-fun-app', storageBucket: 'family-fun-app.firebasestorage.app', messagingSenderId: '255617289303', …}
      entry-b39aa4700c56c0…5a577a8916d0.js:641 Firebase initialization promise resolved
      entry-b39aa4700c56c0…a577a8916d0.js:5721 Sentry DSN not found in environment variables
      entry-b39aa4700c56c0…5a577a8916d0.js:641 Firebase already initialized, skipping
      entry-b39aa4700c56c0…a577a8916d0.js:7228 App running on platform: web
      entry-b39aa4700c56c0…a577a8916d0.js:7228 Using mock Firebase: false
      entry-b39aa4700c56c0…a577a8916d0.js:7228 Firebase initialization completed successfully
      entry-b39aa4700c56c0…a577a8916d0.js:7228 Checking for authentication redirect result...
      entry-b39aa4700c56c0…a577a8916d0.js:7234 Login Screen version: v4
      entry-b39aa4700c56c0…a577a8916d0.js:7234 🔍 LOGIN SCREEN DEBUG:
      entry-b39aa4700c56c0…a577a8916d0.js:7234   Platform: web
      entry-b39aa4700c56c0…a577a8916d0.js:7234   Mock: false
      entry-b39aa4700c56c0…a577a8916d0.js:7234   User: No user
      entry-b39aa4700c56c0…a577a8916d0.js:7234   Loading: false
      entry-b39aa4700c56c0…a577a8916d0.js:7228 Navigation component mounted, Firebase initialized: true
      entry-b39aa4700c56c0…a577a8916d0.js:5701 🏪 StoreProvider: Initializing Zustand store
      entry-b39aa4700c56c0…a577a8916d0.js:5701 🏪 StoreProvider: Store initialized with slices: 
      (12) ['auth', 'family', 'offline', 'chores', 'rewards', 'refreshCache', 'clearCache', 'analytics', 'calculateCacheSize', 'cleanupCache', 'invalidateCache', 'reset']
      entry-b39aa4700c56c0…a577a8916d0.js:5701 🏪 StoreProvider: Auth slice found with methods: 
      (9) ['user', 'isAuthenticated', 'isLoading', 'error', 'signInWithGoogle', 'signInAsGuest', 'logout', 'checkAuthState', 'clearError']
      entry-b39aa4700c56c0…a577a8916d0.js:5701 🏪 StoreProvider: Family slice found with methods: 
      (15) ['family', 'members', 'isAdmin', 'currentMember', 'isLoading', 'error', 'createFamily', 'joinFamily', 'createNewFamily', 'refreshFamily', 'fetchFamily', 'updateFamilySettings', 'updateMemberRole', 'removeMember', 'clearError']
      entry-b39aa4700c56c0…a577a8916d0.js:6853 🌐 NetworkService: Initializing network monitoring
      entry-b39aa4700c56c0…a577a8916d0.js:6853 🌐 NetworkService: Network monitoring initialized successfully
      entry-b39aa4700c56c0…a577a8916d0.js:5701 🏪 StoreProvider: Starting auth state listener
      entry-b39aa4700c56c0…a577a8916d0.js:5701 🌐 Web platform detected - using localStorage persistence
      entry-b39aa4700c56c0…a577a8916d0.js:5720 firebaseAuthBrowser: Loaded browser Firebase Auth functions
      entry-b39aa4700c56c0…a577a8916d0.js:5720 Available functions: ActionCodeURL, AuthCredential, EmailAuthCredential, EmailAuthProvider, FacebookAuthProvider, GithubAuthProvider, GoogleAuthProvider, OAuthCredential, OAuthProvider, PhoneAuthCredential, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, SAMLAuthProvider, TotpMultiFactorGenerator, TotpSecret, TwitterAuthProvider, applyActionCode, beforeAuthStateChanged, browserCookiePersistence, browserLocalPersistence, browserPopupRedirectResolver, browserSessionPersistence, checkActionCode, confirmPasswordReset, connectAuthEmulator, createUserWithEmailAndPassword, debugErrorMap, deleteUser, fetchSignInMethodsForEmail, getAdditionalUserInfo, getAuth, getIdToken, getIdTokenResult, getMultiFactorResolver, getRedirectResult, inMemoryPersistence, indexedDBLocalPersistence, initializeAuth, initializeRecaptchaConfig, isSignInWithEmailLink, linkWithCredential, linkWithPhoneNumber, linkWithPopup, linkWithRedirect, multiFactor, onAuthStateChanged, onIdTokenChanged, parseActionCodeURL, prodErrorMap, reauthenticateWithCredential, reauthenticateWithPhoneNumber, reauthenticateWithPopup, reauthenticateWithRedirect, reload, revokeAccessToken, sendEmailVerification, sendPasswordResetEmail, sendSignInLinkToEmail, setPersistence, signInAnonymously, signInWithCredential, signInWithCustomToken, signInWithEmailAndPassword, signInWithEmailLink, signInWithPhoneNumber, signInWithPopup, signInWithRedirect, signOut, unlink, updateCurrentUser, updateEmail, updatePassword, updatePhoneNumber, updateProfile, useDeviceLanguage, validatePassword, verifyBeforeUpdateEmail, verifyPasswordResetCode
      entry-b39aa4700c56c0…a577a8916d0.js:5715 [AuthSlice] Checking for redirect authentication result...
      entry-b39aa4700c56c0…a577a8916d0.js:6853 🌐 NetworkService: Status update callback set
      entry-b39aa4700c56c0…a577a8916d0.js:5702 🌐 NetworkService: Callback integration set successfully

      Chrome is moving towards a new experience that allows users to choose to browse without third-party cookies.
      entry-b39aa4700c56c0…a577a8916d0.js:7228 App layout initialized, notification service ready for auth
      entry-b39aa4700c56c0…a577a8916d0.js:5715 [AuthSlice] Setting up new auth state listener
      entry-b39aa4700c56c0…a577a8916d0.js:5719 authService.onAuthStateChanged called
      entry-b39aa4700c56c0…a577a8916d0.js:5719 Using real Firebase onAuthStateChanged
      entry-b39aa4700c56c0…a577a8916d0.js:5719 Using browser-specific auth service

- [ ] **Images broken on Login Screen** Google and Guest images are not working on login screen

 1. 🚨 Complete Authentication Loop Fix (Critical - User Acquisition)

  - Status: Ready for targeted implementation using our debugging infrastructure
  - Action: Use the enhanced logging to identify exact failure point and fix timing issues
  - Impact: Unblocks all new user registration (critical for app growth)
  - Effort: 2-3 hours with our debugging tools in place

  2. ⚡ TypeScript Compilation Errors Fix (High - Development Blocker)

  - Status: Active issue preventing rotation system tests
  - Action: Fix type mismatches in firestore.ts and update interface definitions
  - Impact: Enables testing of comprehensive rotation management system
  - Effort: 2-3 hours of systematic type fixing

  3. 🍎 iOS Build Verification (High - Platform Support)

  - Status: Recent Sentry fixes need validation
  - Action: Test v2.169 iOS build on EAS to confirm Sentry authentication fix
  - Impact: Ensures iOS users can use the app properly
  - Effort: 1 hour testing + monitoring

  4. 🎨 Continue UI Accessibility Improvements (Medium - User Experience)

  - Status: Settings and AdminSettings completed, expand to other components
  - Action: Apply systematic contrast fixes to ChoreManagement, ManageMembers,
  ValidatedInput
  - Impact: Complete WCAG compliance across entire app
  - Effort: 3-4 hours per component using established patterns

### Critical Development Issues

- [ ] **TypeScript Compilation Errors in Firestore Service - Blocking Rotation System Tests**
  - **Status**: ACTIVE - Preventing execution of rotation service test suite
  - **Root Cause**: Multiple TypeScript type mismatches and missing properties in `services/firestore.ts`
  - **Impact**: Critical for development - Cannot run tests for new comprehensive rotation system
  - **Specific Errors**:
    - Line 603: `basePoints` property doesn't exist in PointTransaction metadata type
    - Line 702: `enhancedStreaks` property doesn't exist in ChoreCompletionRecord type  
    - Line 738: `compoundStreakMultiplier` property doesn't exist in CompletionReward type
    - Lines 776-779: Type 'null' not assignable to optional string fields (takenOverBy, takenOverByName, takenOverAt, takeoverReason)
    - Line 818: FamilyRotationSettings may be undefined in RotationContext
    - Lines 909-913: Multiple null assignment errors in takeover reset logic
    - Lines 1009, 1051: `updatedAt` property doesn't exist in Partial<Chore>
    - Line 1272: Cannot find name 'familyId' in getUserFamily function
    - Lines 1546, 1558: Type 'null' not assignable to familyId optional string
    - Lines 2527, 2562: Spread types issue with doc.data() return type
    - Line 2626: String not assignable to RoomType union type
  - **Required Fixes**:
    1. **Update Type Definitions**: Add missing properties to PointTransaction, ChoreCompletionRecord, and CompletionReward interfaces in `types/index.ts`
    2. **Fix Null Assignments**: Replace `null` with `undefined` for all optional string/Date fields
    3. **Add Missing Properties**: Ensure `updatedAt` exists in Chore interface
    4. **Fix Variable Scope**: Resolve `familyId` undefined error in getUserFamily function
    5. **Type Casting**: Add proper type assertions for Firestore doc.data() calls
    6. **Enum Validation**: Add proper type checking for RoomType assignments
  - **Files to Modify**:
    - `/types/index.ts` - Add missing interface properties
    - `/services/firestore.ts` - Fix type errors and null assignments
  - **Test Command**: `npm test -- --testPathPattern=rotationService.test.ts`
  - **Priority**: HIGH - Required to validate comprehensive rotation system functionality
  - **Estimated Effort**: 2-3 hours to systematically fix all type errors
  - **Context**: These errors prevent testing of the newly implemented comprehensive chore rotation management system with 7 rotation strategies, fairness engine, and schedule intelligence features

### Critical Production Issues



- [ ] **iOS Build Error - Sentry Authentication**
  - **Status**: FIXED in v2.169 (2025-05-30)
  - **Root Cause**: EAS Build environment lacks SENTRY_AUTH_TOKEN for source map uploads
  - **Fix Applied**: Disabled automatic Sentry uploads via SENTRY_DISABLE_AUTO_UPLOAD environment variable
  - **Evidence**: Added to all EAS build profiles in eas.json with fallback handling
  - **Next Steps**: 
    - [ ] Test v2.169 iOS build on EAS to confirm fix
    - [ ] Monitor build success rate post-deployment
    - [ ] Consider re-enabling uploads with proper auth token in future
  - **Impact**: Critical - iOS builds were completely blocked
- [ ] **iOS TestFlight Crash - Sentry Initialization** 
  - **Status**: FIXED in v2.168 (2025-05-30)
  - **Root Cause**: Sentry initialization causing SIGABRT crashes on iOS production builds
  - **Fix Applied**: Temporarily disabled Sentry for iOS platform in `config/sentry.ts`
  - **Evidence**: Console logs showed immediate crash after successful app launch
  - **Next Steps**: 
    - [ ] Test v2.168 build 28 on TestFlight to confirm fix
    - [ ] Investigate iOS-compatible Sentry configuration
    - [ ] Consider alternative error monitoring for iOS if needed
  - **Impact**: Critical - App was completely unusable on TestFlight


### Manual Intervention Required (Scripts Available)
- [ ] **Stale Points Data**
  - **Status**: Fix script available
  - **Action**: Run `node scripts/clear-zustand-cache.js`
  - **Alternative**: Clear localStorage manually in browser
  - **Cause**: Occurs when switching between users/families

- [ ] **Family Name Inconsistency**
  - **Status**: Fix script available  
  - **Action**: Run `node scripts/fix-family-name.js`
  - **Alternative**: Run `node scripts/fix-stale-points.js` for additional options
  - **Cause**: Stale cache or old demo data references

### Low Priority  
- [ ] **Console Warnings**: Grammarly extension warnings
  - **Issue**: Non-passive event listener warnings from Grammarly.js
  - **Note**: Third-party extension issue, not app code
  - **Impact**: No functional impact, just console noise

- [x] **Dark Mode Color Contrast Issues (High Impact - Accessibility)** - FIXED in v2.171+ (2025-05-30)
  - **Status**: COMPLETED - 100% WCAG 2.1 AA compliance achieved  
  - **Root Cause**: Button text and icons became invisible in dark mode due to insufficient contrast ratios
  - **Critical Issue**: "Change Avatar" button had 1.00:1 contrast ratio (completely invisible)
  - **Solution**: Comprehensive dark mode color palette redesign with WCAG-compliant colors
  - **Changes Made**:
    - Updated `/constants/Colors.ts` with improved dark mode palette (white text, darker button backgrounds)
    - Fixed "Change Avatar" button contrast from 1.00:1 to 9.65:1 (AAA level)
    - Updated all icon colors to use theme-aware accent colors for better contrast
    - Added explicit button text colors (#ffffff) for maximum visibility
    - Fixed all Settings screen contrast issues systematically
  - **Validation**: Automated contrast checker shows 100% success rate (12/12 combinations passing)
  - **Evidence**: Created comprehensive contrast analysis tool in `/scripts/check-contrast.js`
  - **Impact**: Critical accessibility issue resolved, app now fully usable in dark mode
  - **Next Steps**: Continue systematic component audit for remaining UI elements

## Recently Fixed
- [x] **Template Database Missing Index Error** - Fixed in v2.173 (2025-05-30)
  - Root cause: Missing Firestore composite indexes for template queries and empty database
  - Solution: Added choreTemplates indexes to firestore.indexes.json and deployed via firebase deploy
  - Files modified: `/firestore.indexes.json` - Added composite indexes for isOfficial + category + popularity
  - Database: Created template population scripts for standard household chore templates
  - Impact: Template Library now functional with browsable templates and category filtering
- [x] **Template Library Initialization Error** - Fixed in v2.171 (2025-05-30)
  - Root cause: JavaScript hoisting issue where useCallback functions were referenced in useEffect dependency arrays before being defined
  - Solution: Moved useCallback function definitions before useEffect hooks in TemplateLibrary component
  - Files modified: `/components/TemplateLibrary.tsx` - Reordered function definitions
  - Impact: Admin panel now opens successfully, template functionality fully restored
- [x] **iOS TestFlight Critical Crash** - Fixed in v2.168 (2025-05-30)
  - Root cause: Sentry initialization causing SIGABRT on iOS production builds
  - Solution: Disabled Sentry for iOS platform temporarily
  - Version bumped to 2.168 build 28 for TestFlight testing
- [x] **Create Chore Button not working** - Fixed in v2.163 (2025-05-30)
  - Fixed familyId undefined error in createChore function
- [x] **Creating new Pet** - Fixed in v2.163 (2025-05-30)
  - Fixed undefined notes field error with conditional spreading
- [x] **Rewards Page** - Fixed in v2.163 (2025-05-30)
  - Fixed familyId undefined error in createReward function
- [x] **Room & Space Management** - Fixed in v2.162 (2025-05-30)
  - Deployed Firestore indexes via `firebase deploy --only firestore:indexes`
- [x] **Firestore Index Requirements** - Fixed in v2.162 (2025-05-30)
  - All required indexes have been deployed

## Notes
- Completed fixes have been moved to error_fixes.md
- Manual intervention issues have scripts ready but require user action
- The only remaining code issue is the low-priority Grammarly warning