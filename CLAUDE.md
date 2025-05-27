# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo app called "Family Clean" - a family chore management application with Firebase integration. The app uses Expo Router for navigation and includes authentication and real-time data synchronization.

## Key Commands

### Development
- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator  
- `npm run web` - Start web version
- `npm run lint` - Run ESLint
- `npm run clear-cache` - Clear cache and restart Expo

### Building & Testing
- No test commands are currently configured
- Use Expo EAS Build for production builds

### Deployment
- `npx expo export --platform web` - Build web version for deployment
- `firebase deploy --only hosting` - Deploy to Firebase Hosting
- Live at: https://family-fun-app.web.app

## Architecture & Important Patterns

### Firebase Integration
The app uses a hybrid Firebase implementation to support both web and mobile platforms:

1. **Configuration** (`config/firebase.ts`):
   - Detects platform and determines whether to use mock or real Firebase
   - iOS uses mock implementation due to Expo Go limitations
   - Web uses real Firebase with IndexedDB persistence
   - Exports `auth`, `safeCollection`, and helper functions
   - Uses dynamic collection references to handle initialization timing

2. **Authentication** (`contexts/AuthContext.tsx`):
   - Provides auth state management via React Context
   - Supports Google sign-in and anonymous authentication
   - Handles both mock and real Firebase auth seamlessly

3. **Firestore Database** (`services/firestore.ts`):
   - Uses Firebase v9 modular API syntax exclusively
   - Implements CRUD operations for chores, families, and users
   - Dynamic collection getters: `getChoresCollection()`, `getFamiliesCollection()`, `getUsersCollection()`
   - Comprehensive family management system with join codes
   - Dates are converted to ISO strings for Firestore compatibility

4. **Family Management** (`contexts/FamilyContext.tsx`):
   - Global state management for family data
   - Handles family creation, joining, and member management
   - Integrates with user profiles and authentication

### Key Implementation Details

1. **Mock Mode Detection**:
   - Automatically enabled on iOS to avoid Expo Go limitations
   - Can be forced via `EXPO_PUBLIC_USE_MOCK=true` environment variable
   - Mock implementations mirror real Firebase API for seamless switching

2. **Data Models** (`types/index.ts`):
   - `User`: User profile with preferences and stats
   - `Family`: Group with admin, members, and settings
   - `FamilyMember`: User within a family context with role and permissions
   - `Chore`: Task with title, points, assignee, due date, recurrence
   - `Reward`: Incentives that can be redeemed with points
   - `Achievement`: Milestones and badges for gamification

3. **Navigation Structure**:
   - Uses Expo Router file-based routing
   - Main layout in `app/_layout.tsx` 
   - Tab navigation in `app/(tabs)/`
   - Login screen at `app/login.tsx`

4. **Error Handling**:
   - Comprehensive error handling in all Firebase operations
   - Falls back to mock data on errors for better UX
   - Detailed console logging for debugging

## Platform-Specific Considerations

- **iOS**: Always uses mock Firebase due to Expo Go limitations
- **Web**: Uses real Firebase with IndexedDB persistence
- **Android**: Can use real Firebase in development

## Important Files

- `config/firebase.ts` - Firebase initialization and mock/real switching logic
- `contexts/AuthContext.tsx` - Authentication state management
- `contexts/FamilyContext.tsx` - Family state management
- `services/firestore.ts` - All database operations (v9 modular syntax)
- `types/index.ts` - TypeScript type definitions
- `components/FamilySetup.tsx` - Family onboarding flow
- `app/_layout.tsx` - Root layout with providers
- `app/(tabs)/index.tsx` - Home screen with family dashboard
- `docs/firebase_integration.md` - Comprehensive Firebase integration guide
- `firebase.json` - Firebase Hosting configuration
- `.firebaserc` - Firebase project configuration (family-fun-app)

## Development Notes

- The app uses TypeScript with strict mode enabled
- Path alias `@/` maps to the project root
- Uses React Native 0.79.2 and Expo SDK ~53.0.9
- Firebase version 11.8.1 with v9 modular API
- Firebase Project ID: `family-fun-app`
- GitHub Repository: https://github.com/grumpylemon/family-clean

## Common Issues & Solutions

1. **"collection.doc is not a function"**: Ensure using Firebase v9 syntax:
   - Wrong: `collection().doc(id)`
   - Right: `doc(collection(), id)`

2. **Expo Go Development**: Use web browser for testing real Firebase features
   - Run: `npm start` then press `w`
   - Or visit: http://localhost:8081

3. **Firebase initialization timing**: Collection references use dynamic getters to ensure Firebase is ready