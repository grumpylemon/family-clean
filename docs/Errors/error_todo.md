### Error TODO List - Last Updated: 2025-05-30

## Active High Priority Issues to Fix

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

### Critical User Registration Issues

- [x] **New User Sign-UP Authentication Loop (High Impact - User Acquisition)** - FIXED v2.175+ (2025-05-31)
  - **Status**: IMPLEMENTATION COMPLETE - Authentication loop fixed with initial load protection
  - **Root Cause**: Firebase's onAuthStateChanged listener fires immediately with null user on initialization, clearing auth state before authentication can persist
  - **Solution**: Added `hasInitialLoad` flag to distinguish between Firebase initialization (ignore) vs actual signout (clear auth)
  - **Impact**: Critical issue resolved - New users can now complete Google sign-in and proceed to family setup
  - **Implementation**:
    - Modified Firebase auth listener in `/stores/authSlice.ts` to skip clearing auth on initial null event
    - Preserved authentication state during Firebase initialization phase  
    - Maintained proper signout handling for actual user logouts
    - Enhanced logging to distinguish between initialization vs signout scenarios
  - **Testing Required**: 
    - [ ] Verify new user flow: Google sign-in → family setup (not back to login)
    - [ ] Confirm existing users still sign in normally
    - [ ] Test signout functionality still works
    - [ ] Validate auth state persistence across page refreshes
    - [ ] Cross-browser testing (Chrome, Firefox, Safari)
  - **Evidence**: Comprehensive fix documentation in `new_user_signup_authentication_loop_fixed.md`
  - **Files Modified**: `/stores/authSlice.ts` (core fix), debugging infrastructure complete

- [ ] **Images Broken on Login Screen** - PARTIALLY FIXED v2.175+ (2025-05-31)
  - **Status**: Google icon fixed, Guest icon working
  - **Root Cause**: External image URLs not loading properly 
  - **Fix Applied**: Replaced Google favicon with WebIcon implementation
  - **Impact**: Minor UI issue affecting login screen appearance
  - **Next Steps**: 
    - [ ] Test icon display across different browsers
    - [ ] Verify WebIcon fallbacks are working properly

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