# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo app called "Family Compass" - a family chore management application with Firebase integration. The app uses Expo Router for navigation and includes authentication and real-time data synchronization.

## Key Commands

### Development
- `npm start` - Start Expo development server
- `npm run web` - Start web version
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run lint` - Run ESLint

### Deployment Commands
- `npm run export-web` - Build and deploy web (auto-increments version)
- `npm run build-ios` - Build iOS and submit to App Store (auto-increments build number)

### Key Configuration
- Bundle ID: com.grumpylemon.familyfun
- Firebase Project: family-fun-app
- Live Web: https://family-fun-app.web.app

## Architecture & Important Patterns

- Add helpful code comments in all generated code
- Always reference [development_task_list.md](docs/development_task_list.md) for task tracking
- Version numbers auto-increment with deployment commands

### Firebase Integration
The app uses a hybrid Firebase implementation to support both web and mobile platforms:

1. **Configuration** (`config/firebase.ts`):
   - Detects platform and determines whether to use mock or real Firebase
   - iOS uses mock implementation due to Expo Go limitations
   - Web uses real Firebase with IndexedDB persistence
   - Exports `auth`, `safeCollection`, and helper functions
   - Uses dynamic collection references to handle initialization timing

2. **State Management** (Zustand-based Architecture - Updated: 2025-05-29):
   - **Primary Store** (`stores/familyStore.ts`): Centralized Zustand store for all state
   - **Auth Slice** (`stores/authSlice.ts`): Authentication with Firebase integration
   - **Family Slice** (`stores/familySlice.ts`): Family management and member operations
   - **Offline-First Architecture**: Complete offline support with action queuing
   - **Migration Hooks** (`hooks/useZustandHooks.ts`): Drop-in replacements for React Context
   - **Feature Flag**: `USE_ZUSTAND_ONLY` in `app/_layout.tsx` for gradual migration
   - Legacy contexts (`contexts/AuthContext.tsx`, `contexts/FamilyContext.tsx`) maintained for backward compatibility

3. **Firestore Database** (`services/firestore.ts`):
   - Uses Firebase v9 modular API syntax exclusively
   - Implements CRUD operations for chores, families, and users
   - Dynamic collection getters: `getChoresCollection()`, `getFamiliesCollection()`, `getUsersCollection()`
   - Comprehensive family management system with join codes
   - Dates are converted to ISO strings for Firestore compatibility

4. **Offline Capabilities** (Enhanced: 2025-05-29):
   - **Network Detection**: Cross-platform network status monitoring
   - **Action Queue**: Offline operations queued and synced when online
   - **Optimistic Updates**: Instant UI feedback with background sync
   - **Advanced Caching**: Multi-tier cache with LZ compression and priority eviction
   - **Conflict Resolution**: 5 strategies for handling simultaneous edits

### Key Implementation Details

1. **Mock Mode Detection**:
   - Automatically enabled on iOS to avoid Expo Go limitations
   - Can be forced via `EXPO_PUBLIC_USE_MOCK=true` environment variable
   - Mock implementations mirror real Firebase API for seamless switching

2. **Data Models** (`types/index.ts`):
   - `User`: User profile with preferences, stats, XP, levels, achievements
   - `Family`: Group with admin, members, and settings
   - `FamilyMember`: User within a family context with role, permissions, points, streaks
   - `Chore`: Task with title, points, assignee, due date, recurrence, difficulty, lockedUntil
   - `Reward`: Incentives that can be redeemed with points
   - `Achievement`: Milestones and badges for gamification
   - `Badge`: Visual representation of achievements with icons and colors
   - `UserAchievement`: Tracks when achievements were earned
   - `LevelConfig`: Defines XP requirements and titles for each level
   - `CompletionReward`: Reward data returned after completing a chore

3. **Navigation Structure**:
   - Uses Expo Router file-based routing
   - Main layout in `app/_layout.tsx` with StoreProvider wrapping the app
   - Conditional context providers based on `USE_ZUSTAND_ONLY` flag
   - Tab navigation in `app/(tabs)/` with pink-themed styling
   - Login screen at `app/login.tsx` - uses Zustand hooks for authentication
   - Dashboard at `app/(tabs)/dashboard.tsx` - main hub with card-based stats and quick actions
   - Chores screen at `app/(tabs)/chores.tsx` - comprehensive chore management with completion flow
   - Family screen at `app/(tabs)/index.tsx` - family info, member avatars, and management
   - All screens migrated to use `useAuth` and `useFamily` from Zustand hooks

4. **Error Handling**:
   - Comprehensive error handling in all Firebase operations
   - Falls back to mock data on errors for better UX
   - Detailed console logging for debugging

## Platform-Specific Considerations

- **iOS Development (Expo Go)**: Uses mock Firebase due to Expo Go limitations with native modules
- **iOS Production (EAS Build)**: Uses **real Firebase** - standalone app has full Firebase support
- **Web**: Uses real Firebase with IndexedDB persistence
- **Android Development**: Can use real Firebase (has native module support)
- **Android Production (EAS Build)**: Uses real Firebase

### Important: Mock vs Real Firebase Detection

The app automatically detects the environment and chooses the appropriate Firebase implementation:

1. **Mock Firebase Used When**:
   - Running on iOS in Expo Go (`isExpoGo = true`)
   - Environment variable `EXPO_PUBLIC_USE_MOCK=true` is set
   - Firebase initialization fails (fallback)

2. **Real Firebase Used When**:
   - Production builds via EAS Build (`isExpoGo = false`)
   - Web platform (always)
   - Android in development
   - All other cases where mock conditions aren't met

**Key Point**: Production iOS apps built with `eas build --platform ios` use **real Firebase**, not mock!

## State Management with Zustand (Added May 29, 2025)

The app now uses Zustand for offline-first state management with React Context compatibility:

1. **Store Architecture** (`stores/`):
   - `familyStore.ts` - Main store combining all slices with persistence
   - `authSlice.ts` - Authentication state with Firebase integration
   - `familySlice.ts` - Family management state and operations
   - `offlineSlice.ts` - Offline queue, sync status, and network monitoring
   - `choreSlice.ts` - Chore state with offline completion support
   - `rewardSlice.ts` - Reward state with redemption tracking

2. **Offline-First Features**:
   - Automatic action queuing when offline
   - Optimistic UI updates with pending states
   - Intelligent sync with conflict resolution
   - Cross-platform network detection
   - Cached data with expiration policies
   - 50MB cache limit with cleanup

3. **Migration Strategy**:
   - Drop-in replacement hooks: `useAuthZustand`, `useFamilyZustand`
   - Feature flag `USE_ZUSTAND_ONLY` for gradual rollout
   - Maintains exact same API as React Context
   - `StoreProvider.tsx` bridges Context and Zustand

4. **Enhanced Sync System** (`stores/enhancedSyncService.ts`):
   - Real-time conflict detection with Firebase listeners
   - 5 conflict resolution strategies (server_wins, local_wins, merge_changes, etc.)
   - Intelligent field-level merging for complex data
   - Comprehensive sync metrics and analytics

## Important Files

### Core Architecture
- `config/firebase.ts` - Firebase initialization and mock/real switching logic
- `contexts/AuthContext.tsx` - Authentication state management (bridges with Zustand)
- `contexts/FamilyContext.tsx` - Family state management (bridges with Zustand)
- `stores/familyStore.ts` - Main Zustand store with offline-first architecture
- `stores/StoreProvider.tsx` - Integration layer between React Context and Zustand
- `hooks/useAuthZustand.ts` - Drop-in replacement for useAuth hook
- `hooks/useFamilyZustand.ts` - Drop-in replacement for useFamily hook
- `services/firestore.ts` - All database operations (v9 modular syntax)
- `services/gamification.ts` - XP calculation, achievements, and level progression
- `types/index.ts` - TypeScript type definitions with gamification types

### UI Components & Screens
- `components/FamilySetup.tsx` - Family onboarding flow
- `components/ChoreManagement.tsx` - Admin chore CRUD interface with validation and loading states
- `components/FamilySettings.tsx` - Family configuration modal
- `components/CompletionRewardModal.tsx` - Celebration modal for chore completion
- `components/ManageMembers.tsx` - Member management with search/filter and avatars
- `app/_layout.tsx` - Root layout with providers, error boundary, and toast system
- `app/login.tsx` - Pink-themed login screen with guest access
- `app/(tabs)/index.tsx` - Home screen with family dashboard and avatars
- `app/(tabs)/dashboard.tsx` - Modern dashboard with cards and stats
- `app/(tabs)/chores.tsx` - Chore list with completion flow and rewards

### Reusable UI Components (Added May 28, 2025)
- `components/ui/LoadingSpinner.tsx` - Themed loading states with pink styling
- `components/ui/ErrorBoundary.tsx` - Error handling with graceful fallback UI
- `components/ui/Toast.tsx` - Cross-platform notification system
- `components/ui/ConfirmDialog.tsx` - Confirmation dialogs for destructive actions
- `components/ui/ValidatedInput.tsx` - Form inputs with real-time validation
- `components/ui/Avatar.tsx` - Member avatars with photoURL support and status indicators

### Hooks & Utilities
- `hooks/useFormValidation.ts` - Reusable form validation logic with common rules

### Configuration & Documentation
- `docs/firebase_integration.md` - Comprehensive Firebase integration guide
- `docs/development_task_list.md` - Detailed development progress tracking
- `firebase.json` - Firebase Hosting configuration
- `.firebaserc` - Firebase project configuration (family-fun-app)

## Pink Theme Design System (Updated: May 28, 2025)

The app features a beautiful pink/pastel theme inspired by self-care app aesthetics:

1. **Color Palette**:
   - Background: `#fdf2f8` (Soft pink tint)
   - Cards/Surfaces: `#ffffff` (Pure white)
   - Primary Pink: `#be185d` (Rich pink)
   - Secondary Pink: `#f9a8d4` (Light pink)
   - Accent Pink: `#fbcfe8` (Pale pink)
   - Text Primary: `#831843` (Dark pink)
   - Text Secondary: `#9f1239` (Medium pink)
   - Success: `#10b981` (Modern green)
   - Warning: `#f59e0b` (Amber)
   - Error: `#ef4444` (Red)
   - Active/Online: `#10b981` (Green)
   - Inactive/Offline: `#ef4444` (Red)

2. **Typography Hierarchy**:
   - Headers: 32px, weight 700 (bold)
   - Section Titles: 24px, weight 700
   - Body Text: 16px, weight 600
   - Secondary Text: 14px, weight 500-600
   - Labels: 12-14px, weight 600
   - Family: System default with fallback to sans-serif

3. **Component Design**:
   - **Border Radius**: 24px for cards and major components (soft, rounded)
   - **Shadows**: Subtle pink-tinted shadows with 0.04-0.08 opacity
   - **Spacing**: 20-24px padding for cards, consistent gaps
   - **Cards**: White backgrounds with soft pink shadows
   - **Buttons**: Pink gradient effects with proper hover/active states
   - **Input Fields**: White backgrounds with pink borders (#f9a8d4)
   - **Member Avatars**: 40x40 circular images with status indicators
   - **Status Dots**: 12x12 absolute positioned indicators

4. **Navigation & Layout**:
   - Clean white headers with pink accents
   - Tab bar with pink active states (#be185d)
   - Card-based layouts with generous border radius
   - Consistent visual hierarchy with pink color coding
   - Toast notifications for user feedback

5. **Key Design Principles**:
   - **Native Components**: Uses React Native Text/View/Image components
   - **Consistent Theming**: Pink palette applied systematically across all screens
   - **Self-Care Aesthetics**: Soft, calming, and supportive visual language
   - **Visual Feedback**: Celebration modals, toast notifications, and status indicators
   - **Platform Optimization**: Cross-platform toast implementation (ToastAndroid/Alert)

## Gamification System

The app includes a comprehensive gamification system to encourage family participation:

1. **XP & Leveling** (`services/gamification.ts`):
   - 10-level progression system from "Novice Helper" to "Ultimate Family Helper"
   - XP multipliers based on chore difficulty (easy: 0.5x, medium: 1x, hard: 1.5x)
   - Level-up celebrations with visual feedback

2. **Achievements System**:
   - 11 unique achievements covering various milestones
   - "First Steps" - Complete first chore
   - "Helping Hand" - Complete 10 chores
   - "Team Player" - Complete 50 chores
   - "Chore Champion" - Complete 100 chores
   - "Weekend Warrior" - Complete chores on Saturday/Sunday
   - "Perfect Week" - 7-day streak
   - "Dedicated Helper" - 30-day streak
   - "High Scorer" - Earn 500 points total
   - "Point Master" - Earn 1000 points total
   - "Level 5 Hero" - Reach level 5
   - "Max Level Legend" - Reach level 10

3. **Streak System**:
   - Daily streak tracking with bonus XP
   - Streak multipliers: 2x at 7 days, 3x at 30+ days
   - Visual indicators in member profiles

4. **Chore Rotation & Cooldowns**:
   - Automatic chore reassignment after completion
   - Configurable cooldown periods (lockedUntil)
   - Fair distribution among active family members

5. **Completion Rewards** (`components/CompletionRewardModal.tsx`):
   - Beautiful celebration modal with confetti effect
   - Shows points earned, XP gained, new achievements
   - Level-up notifications with progress bars
   - Pink-themed design matching app aesthetics

## Member Management Features

1. **Visual Member Representation**:
   - Profile photos with photoURL support
   - Fallback to initials for members without photos
   - 40x40 circular avatars with proper styling

2. **Activity Status Indicators**:
   - Green dot for active members
   - Red dot for excluded/inactive members
   - Real-time status updates

3. **Search & Filter Functionality**:
   - Search by name or email
   - Filter by status (All/Active/Excluded)
   - Dynamic filtering with immediate results

4. **User Feedback System**:
   - Cross-platform toast notifications
   - Android: Native ToastAndroid
   - iOS/Web: Custom toast UI with animations
   - Success/error messaging for all actions
   - Confirmation dialogs for destructive actions

## UI/UX Enhancement System (Added May 28, 2025)

The app now includes a comprehensive set of reusable UI components for professional user experience:

1. **Loading States & Feedback**:
   - `LoadingSpinner` component with pink theme integration
   - Granular loading states for async operations (save, delete, fetch)
   - Smooth transitions instead of jarring state changes
   - Context-aware loading messages

2. **Error Handling & Resilience**:
   - `ErrorBoundary` component with graceful fallback UI
   - Development-only error details for debugging
   - Beautiful error states that don't break user flow
   - Automatic error recovery mechanisms

3. **Form Validation & Input**:
   - `useFormValidation` hook with common validation rules
   - `ValidatedInput` component with real-time feedback
   - Visual error/success indicators with shake animations
   - Cross-field validation support

4. **User Feedback & Notifications**:
   - `Toast` system with cross-platform support
   - Native integration on Android (ToastAndroid)
   - Custom animated toasts for iOS/Web
   - Action buttons and auto-dismiss functionality

5. **Confirmation & Safety**:
   - `ConfirmDialog` component for destructive actions
   - Platform-specific implementations (native alerts vs custom modals)
   - Consistent pink theme styling
   - Clear action buttons with proper hierarchy

6. **Visual Identity & Avatars**:
   - `Avatar` component with photoURL support
   - Automatic initials generation as fallback
   - Status indicators (active/inactive dots)
   - `AvatarGroup` for multiple user display

7. **Empty States & Guidance**:
   - Encouraging empty states for all lists
   - Clear call-to-action messaging
   - Beautiful icons and consistent styling
   - User guidance for next steps

8. **Search & Filter Patterns**:
   - Real-time search with debouncing
   - Status-based filtering with counts
   - Beautiful search UI with icons
   - Immediate visual feedback

## Development Notes

- The app uses TypeScript with strict mode enabled
- Path alias `@/` maps to the project root
- Uses React Native 0.79.2 and Expo SDK ~53.0.9
- Firebase version 11.8.1 with v9 modular API
- Firebase Project ID: `family-fun-app`
- GitHub Repository: https://github.com/grumpylemon/family-clean
- Uses expo-linear-gradient for gradient effects
- Puppeteer for automated screenshot testing

## Common Issues & Solutions

1. **"collection.doc is not a function"**: Ensure using Firebase v9 syntax:
   - Wrong: `collection().doc(id)`
   - Right: `doc(collection(), id)`

2. **Expo Go Development**: Use web browser for testing real Firebase features
   - Run: `npm start` then press `w`
   - Or visit: http://localhost:8081

3. **Firebase initialization timing**: Collection references use dynamic getters to ensure Firebase is ready