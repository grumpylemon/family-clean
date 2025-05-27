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

2. **Authentication** (`contexts/AuthContext.tsx`):
   - Provides auth state management via React Context
   - Supports Google sign-in and anonymous authentication
   - Handles both mock and real Firebase auth seamlessly

3. **Firestore Database** (`services/firestore.ts`):
   - Uses Firebase v9 modular API syntax
   - Implements CRUD operations for chores and families
   - Uses consistent family ID (`demo-family-id`) for persistence
   - Dates are converted to ISO strings for Firestore compatibility

### Key Implementation Details

1. **Mock Mode Detection**:
   - Automatically enabled on iOS to avoid Expo Go limitations
   - Can be forced via `EXPO_PUBLIC_USE_MOCK=true` environment variable
   - Mock implementations mirror real Firebase API for seamless switching

2. **Data Models**:
   - `Chore`: Task with title, points, assignee, due date, etc.
   - `Family`: Group with admin and members
   - `FamilyMember`: User with role, points, and profile info

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
- `services/firestore.ts` - All database operations
- `app/_layout.tsx` - Root layout with providers
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