### Error TODO List - Last Updated: 2025-05-30

## Active High Priority Issues to Fix

- [ ] **Failed to download font** This is a consistant error accross the app
      leaders:1 Failed to decode downloaded font: https://family-fun-app.web.app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.6148e7019854f3bde85b633cb88f3c25.ttf
      leaders:1 OTS parsing error: invalid sfntVersion: 1008813135


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