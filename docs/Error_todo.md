### Issues to address that are not working
- [ ] **Room & Space Management**: Add New Room "Create" button is not adding room
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

- [ ] **Icons**: The Nav_Bar icons at the bottom are working great on the webserver, but a lot of the other icons are not, check all icon usage to make sure they use the same code or system as the Nav_Bar row. For example Admin Panel Icons.

### Authentication & Database Issues (Found 2025-05-29)

- [x] **Family ID Issue**: Families were being created with hardcoded 'demo-family-id' instead of unique IDs
  - **Status**: FIXED in v2.108 - Now uses Firestore auto-generated IDs
  - **Fix**: Modified createFamily() in services/firestore.ts to use addDoc()

- [x] **Authentication CORS Loop**: Cross-Origin-Opener-Policy errors causing infinite authentication loops
  - **Status**: FIXED in v2.108 - Added fallback from popup to redirect auth
  - **Fix**: Enhanced firebaseAuthBrowser.ts to handle CORS blocks gracefully

### UI/UX Issues (Found 2025-05-29)

- [ ] **Change Avatar Button**: Not functioning on Settings page - no console logs when clicked
  - **Location**: /settings page, My Profile section
  - **Expected**: Should open file picker or avatar selection dialog

- [ ] **Dark Mode Toggle**: Not working on Settings page
  - **Location**: /settings page, App Preferences section
  - **Expected**: Should toggle between light and dark themes

- [ ] **Admin Panel Loop**: Continuous [useAuth] authData logs in console
  - **Location**: /settings → Admin Panel
  - **Console**: Repetitive useAuth signInWithGoogle logs
  - **Family Name Inconsistency**: Shows "Christian Stoehr's Family" instead of "Porto Vaz - Stoehr"

- [x] **Zustand Admin Panel Crash**: "TypeError: I is not a function" when accessing panel
  - **Status**: FIXED in v2.110 - Was calling non-existent setNetworkStatus()
  - **Location**: Settings → Admin Panel → Zustand Remote Admin
  - **Error**: TypeError: I is not a function at ZustandAdminPanel
  - **Fix**: Changed to use setOnlineStatus(true/false) instead

- [ ] **Rewards Page Access**: Shows "Please join a family to access rewards" despite user being in family
  - **Location**: /rewards page
  - **Issue**: Not recognizing user's family membership

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
