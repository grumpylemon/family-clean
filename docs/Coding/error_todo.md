### Error TODO List - Last Updated: 2025-05-30

## Active Issues to Fix

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

## Recently Fixed
- [x] **Room & Space Management** - Fixed in v2.162 (2025-05-30)
  - Deployed Firestore indexes via `firebase deploy --only firestore:indexes`
- [x] **Firestore Index Requirements** - Fixed in v2.162 (2025-05-30)
  - All required indexes have been deployed

## Notes
- Completed fixes have been moved to error_fixes.md
- Manual intervention issues have scripts ready but require user action
- The only remaining code issue is the low-priority Grammarly warning