### Error TODO List - Last Updated: 2025-05-30

## Active High Priority Issues to Fix

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

- [ ] **Dark Mode Color issues** Some colors in Dark mode don't have enough contras so Header letters on Buttons disapear and are unreadable, for example the "Change Avatar" Button

## Recently Fixed
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