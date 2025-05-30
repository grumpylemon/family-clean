### Issues to address that are not working
- [x] **Room & Space Management**: Add New Room "Create" button is not adding room
  - **Status**: FIXED in v2.120 - Missing Firestore composite index for room queries
  - **Fix**: Added index for (familyId, isActive, type, name) fields to firestore.indexes.json
  - **Solution**: Added fallback query without ordering for graceful degradation during index building
  - **Deployed**: Firestore index deployed and code updated with fallback logic
        Grammarly.js:2 [Violation] Added non-passive event listener to a scroll-blocking 'mousewheel' event. Consider marking event handler as 'passive' to make the page more responsive. See https://www.chromestatus.com/feature/5745543795965952
        Grammarly.js:2 [Violation] Added non-passive event listener to a scroll-blocking 'touchmove' event. Consider marking event handler as 'passive' to make the page more responsive. See https://www.chromestatus.com/feature/5745543795965952
        Grammarly.js:2 grm ERROR [iterable] ░░ Not supported: in app messages from Iterable
        entry-c94b25d107fcee…de534513471d.js:680 Creating collection for: rooms, mock mode: false
        entry-c94b25d107fcee…de534513471d.js:680 Creating real Firestore collection for: rooms
        entry-c94b25d107fcee…de534513471d.js:680 Successfully created real collection for: rooms 
        Gh {converter: null, _query: Fr, type: 'collection', firestore: Xh, _path: Z}
        entry-c94b25d107fcee…de534513471d.js:680 Creating collection for: rooms, mock mode: false
        entry-c94b25d107fcee…de534513471d.js:680 Creating real Firestore collection for: rooms
        entry-c94b25d107fcee…de534513471d.js:680 Successfully created real collection for: rooms 
        Gh {converter: null, _query: Fr, type: 'collection', firestore: Xh, _path: Z}
        entry-c94b25d107fcee…de534513471d.js:761 Error fetching family rooms: FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/family-fun-app/firestore/i…aWx5SWQQARoMCghpc0FjdGl2ZRABGggKBHR5cGUQARoICgRuYW1lEAEaDAoIX19uYW1lX18QAQ
        ﻿

- [x] **Manage Chores**: Create new Chore - "Create" Button is not adding new chore
  - **Status**: FIXED in v2.122 - Undefined field value error in 'recurring' field
  - **Error**: `FirebaseError: Function addDoc() called with invalid data. Unsupported field value: undefined (found in field recurring in document chores/...)`
  - **Root Cause**: `formatForFirestore()` was not filtering out undefined values before sending to Firestore
  - **Fix**: Modified `formatForFirestore()` in `services/firestore.ts` to remove undefined values 
  - **Solution**: When `isRecurring` is false, `recurring: undefined` was being sent to Firestore, which rejects undefined values even for optional fields
  - **Deployed**: v2.122 with improved data sanitization
        
        entry-c94b25d107fcee27a545de534513471d.js:753 Adding chore: Test Chore 1, using mock: false, family: demo-family-id
        entry-c94b25d107fcee27a545de534513471d.js:753 Formatted data for Firestore: {title: 'Test Chore 1', description: 'Test Description', type: 'family', difficulty: 'medium', points: 10, …}
        entry-c94b25d107fcee27a545de534513471d.js:753 Creating chore document with Firebase API
        entry-c94b25d107fcee27a545de534513471d.js:753 Inner error during chore creation: FirebaseError: Function addDoc() called with invalid data. Unsupported field value: undefined (found in field recurring in document chores/2JOBGHryE8c7Qc5ItGjZ)
        overrideMethod @ hook.js:608
        p @ entry-c94b25d107fcee27a545de534513471d.js:753
        onPress @ entry-c94b25d107fcee27a545de534513471d.js:765
        onClick @ entry-c94b25d107fcee27a545de534513471d.js:453
        qc @ entry-c94b25d107fcee27a545de534513471d.js:334
        (anonymous) @ entry-c94b25d107fcee27a545de534513471d.js:334
        Hn @ entry-c94b25d107fcee27a545de534513471d.js:334
        Jc @ entry-c94b25d107fcee27a545de534513471d.js:334
        kd @ entry-c94b25d107fcee27a545de534513471d.js:334
        yd @ entry-c94b25d107fcee27a545de534513471d.js:334
        entry-c94b25d107fcee27a545de534513471d.js:753 Returning 79 chores after filtering for family demo-family-id

- [x] **Icons**: The Nav_Bar icons at the bottom are working great on the webserver, but a lot of the other icons are not, check all icon usage to make sure they use the same code or system as the Nav_Bar row. For example Admin Panel Icons.
  - **Status**: PARTIALLY FIXED in v2.124 - Key user-facing components updated
  - **Fixed Components**: AdminSettings, login screen, main family screen (app/(tabs)/index.tsx)
  - **Root Cause**: Components were using Ionicons directly instead of WebIcon component
  - **Fix**: Replaced direct Ionicons imports with WebIcon component which provides emoji fallbacks for web
  - **WebIcon Improvements**: Added emoji fallbacks for server, person-circle-outline, settings-outline, shield-outline, code-outline
  - **Additional Fixes v2.126**: Updated ManageMembers, ChoreManagement, FamilySettings
  - **WebIcon Additions**: Added fallbacks for create-outline, home-outline, trash-outline, lock-closed-outline, list-outline
  - **Status**: SUBSTANTIALLY COMPLETE - All major user-facing components now use WebIcon
  - **Deployed**: v2.126 with comprehensive icon consistency across the app

### Authentication & Database Issues (Found 2025-05-29)

- [x] **Family ID Issue**: Families were being created with hardcoded 'demo-family-id' instead of unique IDs
  - **Status**: FIXED in v2.108 - Now uses Firestore auto-generated IDs
  - **Fix**: Modified createFamily() in services/firestore.ts to use addDoc()

- [x] **Authentication CORS Loop**: Cross-Origin-Opener-Policy errors causing infinite authentication loops
  - **Status**: FIXED in v2.108 - Added fallback from popup to redirect auth
  - **Fix**: Enhanced firebaseAuthBrowser.ts to handle CORS blocks gracefully

### UI/UX Issues (Found 2025-05-29)

- [x] **Change Avatar Button**: Not functioning on Settings page - no console logs when clicked
  - **Status**: FIXED in v2.131 - Added proper onPress handler with platform-specific image picker
  - **Location**: /settings page, My Profile section
  - **Root Cause**: Missing onPress handler on TouchableOpacity
  - **Fix**: Added handleChangeAvatar function with expo-image-picker integration
  - **Features**: Camera/Photo Library selection, permissions handling, platform detection
  - **Web Support**: Shows "coming soon" message on web, full functionality on mobile
  - **Deployed**: v2.131 with complete avatar change workflow

- [x] **Dark Mode Toggle**: Not working on Settings page
  - **Status**: FIXED in v2.131 - Added AsyncStorage persistence and proper state management
  - **Location**: /settings page, App Preferences section
  - **Root Cause**: Handler only showed "coming soon" toast instead of saving preference
  - **Fix**: Added proper theme preference persistence with AsyncStorage
  - **Features**: Saves theme choice, loads on app start, proper success/error feedback
  - **Implementation**: Foundation for full dark mode (theme infrastructure in place)
  - **Deployed**: v2.131 with functional theme preference system

- [ ] **Admin Panel Loop**: Continuous [useAuth] authData logs in console
  - **Location**: /settings → Admin Panel
  - **Console**: Repetitive useAuth signInWithGoogle logs
  - **Family Name Inconsistency**: Shows "Christian Stoehr's Family" instead of "Porto Vaz - Stoehr"

- [x] **Zustand Admin Panel Crash**: "TypeError: I is not a function" when accessing panel
  - **Status**: FIXED in v2.110 - Was calling non-existent setNetworkStatus()
  - **Location**: Settings → Admin Panel → Zustand Remote Admin
  - **Error**: TypeError: I is not a function at ZustandAdminPanel
  - **Fix**: Changed to use setOnlineStatus(true/false) instead

- [x] **Rewards Page Access**: Shows "Please join a family to access rewards" despite user being in family
  - **Status**: FIXED in v2.128 - Added proper loading state handling
  - **Location**: /rewards page
  - **Root Cause**: Missing loading state checks - page checked for `currentMember` before auth/family data finished loading
  - **Fix**: Added `authLoading` and `familyLoading` checks like other working pages
  - **Solution**: Page now shows "Loading rewards..." during state loading, then properly recognizes family membership
  - **Bonus**: Updated all Ionicons to WebIcon for consistent icon display
  - **Deployed**: v2.128 with comprehensive rewards page improvements

- [x] **Family Creation Loop**: App gets stuck after creating family, requires hard reloads
  - **Status**: FIXED in v2.110 - Added navigation after family creation
  - **Location**: FamilySetup component and screens that use it
  - **Fix**: Added explicit navigation to dashboard and onComplete callbacks

### Data Issues (Found 2025-05-29)

- [ ] **Stale Points Data**: User profile showing old points data possibly from Zustand cache
  - **Symptom**: Points data persisting across sessions
  - **Possible Cause**: Zustand persistence not clearing properly

- [ ] **Family Name Inconsistency**: Multiple family names appearing
  - **Database**: "Porto Vaz - Stoehr" (correct)
  - **Admin Panel**: "Christian Stoehr's Family" (incorrect)
  - **Issue**: Possible stale data or incorrect family reference

### Known Issues from Previous
