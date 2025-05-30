# Error Fixes Documentation

This document tracks all error fixes implemented in the Family Compass app, including detailed explanations and solutions.

## iOS Build Authentication Error (v2.169)

**Date**: May 30, 2025  
**Error Type**: EAS Build Failure  
**Status**: FIXED

**Issue**: iOS builds failing with "Auth token is required for this request. Please run 'sentry-cli login' and try again!"  
**Root Cause**: EAS Build environment attempting Sentry source map uploads without authentication token  
**Solution**: Disabled automatic Sentry uploads via environment variables in eas.json  

**Technical Details**:
- Added `SENTRY_DISABLE_AUTO_UPLOAD=true` to all EAS build profiles
- Added `SENTRY_ALLOW_FAILURE=true` for production builds as fallback
- Created setup script (`scripts/setup-ios-build.sh`) for environment configuration
- Updated `.env.example` with documentation for new variables

**Files Modified**:
- `/eas.json` - Environment variable configuration for all build profiles
- `/.env.example` - Documentation for Sentry build variables
- `/scripts/setup-ios-build.sh` - Automated setup script
- `/ios/.xcode.env.local` - iOS build environment configuration

**Impact**: Unblocks iOS builds while maintaining runtime error monitoring functionality

**Alternative Solutions**: Future enhancement could add proper SENTRY_AUTH_TOKEN to EAS secrets to re-enable source map uploads for better error debugging.

## Room Management Fix (v2.162)

**Date**: May 30, 2025  
**Error Type**: Firestore Index Error  

### Room & Space Management Create Button
**Issue**: Add New Room "Create" button not working - FirebaseError: The query requires an index  
**Root Cause**: Complex query in `getFamilyRooms()` requires composite index  
**Solution**: Deployed existing Firestore indexes from firestore.indexes.json  
**Command**: `firebase deploy --only firestore:indexes`  
**Result**: Room creation now works properly  

**Technical Details**:
- Query filters by: familyId, isActive, and orders by type then name
- Index was already defined but not deployed to Firebase
- Code has fallback mechanism for graceful degradation

## Manual Intervention Scripts Created

### Stale Points Data Script (scripts/clear-zustand-cache.js)
**Purpose**: Clear persisted Zustand store data  
**Use Case**: When points or other data shows stale values  
**Instructions**: Run `node scripts/clear-zustand-cache.js` for platform-specific guidance  

### Family Name Fix Script (scripts/fix-family-name.js)
**Purpose**: Clear cached family name data  
**Use Case**: When admin panel shows incorrect family name  
**Instructions**: Run `node scripts/fix-family-name.js` for browser console commands  

### Additional Points Fix Script (scripts/fix-stale-points.js)
**Purpose**: Refresh points while staying logged in  
**Options**: Clear cache or force refresh family data  
**Instructions**: Run `node scripts/fix-stale-points.js` for options  

## UI/UX and Functionality Fixes (v2.112-v2.137)

**Date**: May 2025  
**Error Type**: Various UI/UX and functionality issues  

### Change Avatar Button (v2.131)
**Issue**: Button not functioning on Settings page - no console logs when clicked  
**Solution**: Implemented file upload functionality in Settings page  
**Result**: Now properly opens file picker dialog  

### Dark Mode Toggle (v2.131/v2.137)
**Issue**: Toggle not working on Settings page  
**Solution**: Implemented complete dark mode theme system  
**Result**: Toggle now works correctly with full theme support  

### Admin Panel Loop (v2.112)
**Issue**: Continuous [useAuth] authData logs in console  
**Solution**: Removed unnecessary reSign operations in auth loading  
**Result**: No more infinite authentication loops  

### Rewards Page Access (v2.128)
**Issue**: Shows "Please join a family to access rewards" despite user being in family  
**Solution**: Updated family membership detection logic  
**Result**: Now correctly recognizes user's family membership  

### Manage Chores Create Button (v2.128)
**Issue**: FirebaseError - Unsupported field value: undefined for 'recurring' field  
**Solution**: Added default value for 'recurring' field (false if not provided)  
**Result**: Chore creation now works without errors  

### Icon Consistency (v2.128)
**Issue**: Icons not displaying correctly across various components  
**Solution**: Standardized icon implementation using UniversalIcon component  
**Result**: All icons now render consistently with emoji fallbacks

## iOS Build Error: react-native-safe-area-context Codegen Issue (v2.160)

**Date**: January 2025  
**Error Type**: iOS Build Failure  
**Affected Component**: react-native-safe-area-context  

### Error Description

```
node_modules/react-native-safe-area-context/lib/module/specs/NativeSafeAreaView.js: 
Could not find component config for native component
SyntaxError: /Users/expo/workingdir/build/node_modules/react-native-safe-area-context/lib/module/specs/NativeSafeAreaView.js: 
Could not find component config for native component
```

### Root Cause

The error occurs when React Native's codegen system tries to process `react-native-safe-area-context` during the iOS build process. This is a compatibility issue between:
- React Native 0.79.2 with new architecture enabled (`newArchEnabled: true`)
- react-native-safe-area-context 5.4.0
- React Native's babel-plugin-codegen

### Solution Implemented

1. **Created Fix Script** (`scripts/fix-safe-area-ios-build.js`):
   - Patches the problematic spec files to skip codegen processing
   - Creates a dummy component config for compatibility
   - Runs automatically before iOS builds

2. **Updated Metro Config** (`metro.config.js`):
   - Added safe area context specs to the blockList
   - Prevents Metro from processing these files during bundling

3. **Updated Build Scripts** (`package.json`):
   - Added postinstall hook to run fix after npm install
   - Modified build-ios script to run fix before building
   - Ensures the fix is applied in all scenarios

4. **Added EAS Build Hook** (`eas.json`):
   - Added onStart hook for production iOS builds
   - Ensures fix runs in EAS Build environment

### Files Modified

- `/metro.config.js` - Added regex to blockList
- `/babel.config.js` - Added conditional codegen plugin config
- `/scripts/fix-safe-area-ios-build.js` - Created new fix script
- `/package.json` - Added postinstall and updated build-ios scripts
- `/eas.json` - Added build hooks for production

### Testing

1. Run `npm install` to trigger postinstall hook
2. Run `npm run build-ios` to build for iOS
3. The script should patch the files and create component config
4. Build should complete successfully

### Alternative Solutions (if needed)

If the above solution doesn't work:

1. **Downgrade react-native-safe-area-context**:
   ```bash
   npm install react-native-safe-area-context@4.10.9
   ```

2. **Disable New Architecture** (temporary):
   - In `app.json`, set `"newArchEnabled": false`
   - Also update expo-build-properties plugin config

3. **Use patch-package**:
   ```bash
   npm install --save-dev patch-package
   # Apply manual fixes
   npx patch-package react-native-safe-area-context
   ```

### Update: Temporary Fix Applied (v2.161)

Due to persistent issues with react-native-safe-area-context and React Native's new architecture:
- Disabled new architecture in `app.json`
- Updated expo-build-properties plugin configuration
- This is a temporary fix until react-native-safe-area-context is fully compatible

Additional fix:
- Updated iOS deployment target from 13.4 to 15.1 (required by EAS Build)

To re-enable new architecture later:
1. Update `app.json`: `"newArchEnabled": true`
2. Update expo-build-properties plugin: `"newArchEnabled": true`
3. Test iOS build again

### Build Success

After applying the fixes:
1. The codegen error was resolved by disabling new architecture
2. The deployment target was updated to meet EAS requirements
3. Build now proceeds to credential stage successfully

### Prevention

- Always test iOS builds locally before pushing
- Check compatibility when updating React Native or Expo SDK
- Monitor GitHub issues for known incompatibilities

---

## Dashboard and Web Errors Fixed (v2.150-v2.159)

**Date**: January 2025  
**Error Type**: Runtime JavaScript Errors  
**Platform**: Web  

### Issues Fixed

1. **Duplicate Version Display** (v2.151)
   - Removed duplicate version container in dashboard.tsx

2. **useFamilyStore Import Errors** (v2.152-v2.153)
   - Fixed imports in chores.tsx and ChoreTakeoverModal.tsx
   - Changed from `@/stores/hooks` to `@/stores/familyStore`

3. **Pets Page Not Loading** (v2.154)
   - Updated PetManagement to use Zustand hooks
   - Changed from React Context to `useFamily` from Zustand

4. **Font Loading Errors** (v2.157)
   - Replaced direct Ionicons usage with UniversalIcon component
   - UniversalIcon has emoji fallbacks for missing fonts

5. **Settings Page Error** (v2.159)
   - Fixed NotificationSettings component
   - Changed from `useFamilyStore` to `useAuth` hook

### Common Import Patterns

**Correct Imports**:
```typescript
// For raw store access
import { useFamilyStore } from '@/stores/familyStore';

// For hook wrappers
import { useAuth, useFamily } from '@/hooks/useZustandHooks';
```

**Incorrect Imports**:
```typescript
// WRONG - hooks.ts doesn't export useFamilyStore
import { useFamilyStore } from '@/stores/hooks';
```

---

## FamilyId Undefined Errors Fixed (v2.163)

**Date**: May 30, 2025  
**Error Type**: Reference Error  
**Components Affected**: Chore creation, Reward creation  

### Create Chore Button Error
**Issue**: ReferenceError: familyId is not defined  
**Root Cause**: createChore function using undefined variable instead of parameter  
**Solution**: Changed `doc(choreRef, familyId)` to `doc(choreRef, chore.familyId)`  
**Files Modified**: 
- `/services/firestore.ts` - Fixed variable reference
- `/components/ChoreManagement.tsx` - Added null safety checks

### Rewards Page Error  
**Issue**: ReferenceError: familyId is not defined  
**Root Cause**: createReward function using undefined variable  
**Solution**: Changed to use `reward.familyId` from parameter  
**Files Modified**:
- `/services/firestore.ts` - Fixed variable reference  
- `/components/RewardManagement.tsx` - Added loading state

### Additional Improvements
- Added loading UI components when family data isn't ready
- Fixed mock family to always include id field
- Added delay after family creation for state propagation
- Improved error handling throughout family-dependent components

---

## Pet Creation Undefined Notes Error Fixed (v2.163)

**Date**: May 30, 2025  
**Error Type**: Firestore Validation Error  
**Component**: PetManagement  

### Error Details
**Issue**: FirebaseError: Unsupported field value: undefined (found in field notes)  
**Root Cause**: Using `|| undefined` pattern set empty strings to undefined  
**Solution**: Use conditional object spreading to omit empty fields  

### Technical Fix
**Before**: 
```typescript
notes: formData.notes.trim() || undefined
```

**After**:
```typescript
...(formData.notes.trim() && { notes: formData.notes.trim() })
```

**Result**: Optional fields are omitted when empty instead of being set to undefined  
**Applied to**: notes, breed, and age fields in both create and update functions  

---

---

## Font Loading Errors Completely Fixed (v2.168)

**Date**: May 30, 2025  
**Error Type**: Font Loading Error  
**Platform**: Web  

### The Error
**Issue**: Failed to decode downloaded font - OTS parsing error  
**Root Cause**: Browser fails to parse Ionicons.ttf font file from @expo/vector-icons  
**Impact**: Console errors and fallback to default browser fonts  

### Solution Implemented
**Approach**: Migrated all 20 components from direct @expo/vector-icons imports to UniversalIcon  
**Result**: All font errors eliminated through automatic emoji fallbacks  

### Files Migrated
- 14 component files in `components/` directory
- 2 files in `app/(tabs)/` directory  
- 4 UI component files cleaned up
- Total: 20 files fully migrated

### Prevention Measures
- Added ESLint rule to block direct @expo/vector-icons imports
- Created .gitattributes to prevent font file corruption
- Documented migration pattern for future developers

---

## Future Error Prevention Guidelines

1. **Always use UniversalIcon** instead of direct Ionicons imports (enforced by ESLint)
2. **Import hooks from** `@/hooks/useZustandHooks` for auth/family access
3. **Test iOS builds locally** before submitting to EAS
4. **Check package compatibility** when updating dependencies
5. **Document all fixes** in this file for future reference
6. **Use parameter properties** not undefined variables in functions
7. **Add null safety checks** for async loaded data
8. **Use conditional spreading** for optional Firestore fields
9. **Always handle loading states** in components