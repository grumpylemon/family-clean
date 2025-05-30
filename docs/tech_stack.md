# Family Clean - Complete Tech Stack Documentation

Last Updated: May 30, 2025

## Current Technology Stack

### Frontend Framework & UI Libraries

#### Core Framework
- **React Native 0.79.2** - Cross-platform mobile development framework
- **React 19.0.0** - Latest React version for component-based UI
- **Expo SDK ~53.0.9** - Managed workflow with extensive APIs and development tools
- **TypeScript ~5.8.3** - Type-safe JavaScript with strict mode enabled

#### Navigation
- **Expo Router ~5.0.6** - File-based navigation system
- **@react-navigation/bottom-tabs ~6.8.2** - Tab navigation implementation
- **React Navigation Native Stack** - Stack navigation for screens

#### UI Components & Styling
- **expo-linear-gradient** - Beautiful gradient effects (login screen, buttons)
- **@expo/vector-icons** - Comprehensive icon library
- **expo-blur** - Blur effects for overlays
- **expo-haptics** - Haptic feedback for better UX
- **expo-image** - Optimized image loading and caching
- **expo-image-picker** - Native image selection for avatar changes (Added: 2025-05-30)
- **Custom Pink Theme System** - Centralized color constants and themed components
- **WebIcon Component** - Cross-platform icon solution with emoji fallbacks (Enhanced: 2025-05-30)

### State Management

#### Complete Zustand Implementation (Updated: 2025-05-29)
- **Zustand v4.5.7** - Primary state management solution with offline-first architecture
  - Note: Using v4.x due to v5 incompatibility with Metro bundler (see zustand_v5_migration_notes.md)
  - Persistent store with cross-platform storage (localStorage/AsyncStorage)
  - Comprehensive offline action queue system with retry mechanisms
  - Network detection and automatic sync capabilities
  - Type-safe store slices for auth, family, chores, rewards, and offline state
  - **Full Context Migration Completed** - All 27 components migrated from React Context
- **Store Architecture**
  - **Auth Slice** (`stores/authSlice.ts`) - Complete Firebase authentication integration
  - **Family Slice** (`stores/familySlice.ts`) - Full family management functionality
  - **Offline Slice** (`stores/offlineSlice.ts`) - Queue management and sync
  - **Chore Slice** (`stores/choreSlice.ts`) - Chore operations with offline support
  - **Reward Slice** (`stores/rewardSlice.ts`) - Reward management
- **Migration Hooks** (`hooks/useZustandHooks.ts`) 
  - Drop-in replacements for React Context hooks
  - Identical API surface for seamless migration
  - `useAuth()` and `useFamily()` maintain exact same interface
- **React Context API** - Legacy contexts preserved for backward compatibility
  - Feature flag `USE_ZUSTAND_ONLY` in `app/_layout.tsx` controls usage
  - Can be fully removed by setting flag to `true`
- **Optimistic Updates** - Instant UI feedback with background sync

### Backend Services

#### Firebase Platform (v11.8.1)
- **Firestore Database** - NoSQL document database with real-time sync
  - v9 modular API syntax
  - Collections: users, families, chores, rewards, achievements
  - Optimistic updates and offline persistence
- **Firebase Authentication** 
  - Google Sign-In (GoogleAuthProvider)
  - Anonymous/Guest authentication
  - Session persistence
- **Firebase Hosting** - Web deployment platform
  - Live URL: https://family-fun-app.web.app
  - Automatic SSL certificates
  - Global CDN

#### Mock Implementation
- **Custom Mock Firebase** - Development mode for Expo Go
  - Mirrors real Firebase API
  - In-memory data storage
  - Platform auto-detection

### Data Persistence

- **AsyncStorage** - Local key-value storage for React Native
  - Used for theme preferences (dark mode toggle) (Added: 2025-05-30)
  - User settings persistence
- **Firebase Persistence**
  - IndexedDB for web platform
  - In-memory for mock mode
- **Session Management** - Auth state persistence across app restarts
- **Zustand Persistence** - Offline-first state persistence (Added: 2025-05-29)
  - Cross-platform storage abstraction
  - Selective data persistence with partitioning
  - Migration support for schema changes
  - Cache management with TTL and size limits

### Offline Capabilities (NEW: 2025-05-29)

- **Network Detection** - Cross-platform network status monitoring
  - @react-native-community/netinfo for React Native
  - navigator.onLine for web with SSR compatibility
  - Automatic reconnection handling
- **Offline Action Queue** - Sophisticated offline operation management
  - 11 supported action types (chore completion, creation, updates, rewards, etc.)
  - Retry mechanisms with exponential backoff
  - Conflict resolution and error handling
  - Optimistic updates with rollback capabilities
- **Smart Caching** - Intelligent data caching for offline access
  - Family data, chores, rewards, and member information
  - Cache expiration and refresh policies
  - Metadata tracking with versioning
  - 50MB cache size limit with cleanup

### Build & Deployment Tools

#### Expo Application Services (EAS)
- **EAS Build** - Cloud build service for iOS and Android
  - Project ID: `6b63f9ee-7702-4622-a992-d52429573749`
  - Automated provisioning and code signing
  - Environment variable management
- **EAS Submit** - Direct submission to app stores
  - Auto-submit to Apple App Store
  - Google Play Store integration

#### Platform Configurations
- **iOS**
  - Bundle Identifier: `com.grumpylemon.familyfun`
  - Apple Team ID: `87699862N5`
  - App Store Connect ID: `6746467670`
- **Android**
  - Package Name: `com.grumpylemon.familyfun`
  - Adaptive icon support
- **Web**
  - Static export capability
  - PWA-ready configuration
  - Auto-version increment on deployment (v2.132 as of May 30, 2025)

### Development Environment

#### Build Tools
- **Metro Bundler** - JavaScript bundler optimized for React Native
- **Babel** - JavaScript transpilation
- **ESLint** - Code linting with Expo configuration

#### Testing Infrastructure
- **Jest** - Test runner (configured, ready for tests)
- **ts-jest** - TypeScript support for Jest
- **Puppeteer** - Automated screenshot generation
- **Mock modules** - Expo module mocks for testing

#### Developer Experience
- **Path Aliases** - `@/` maps to project root
- **Hot Reload** - Instant feedback during development
- **TypeScript IntelliSense** - Full IDE support

### Third-Party Libraries

#### Essential React Native Libraries
- **react-native-gesture-handler ~2.24.0** - Touch gesture system
- **react-native-reanimated ~3.17.4** - High-performance animations
- **react-native-safe-area-context ~5.4.0** - Safe area handling
- **react-native-screens ~4.10.0** - Native navigation optimization
- **react-native-webview ~13.13.5** - Web content display

#### State Management & Offline Libraries (Added: 2025-05-29)
- **zustand ^4.5.7** - Modern state management with persistence (v4.x for Metro compatibility)
- **@react-native-community/netinfo ^11.4.1** - Network connectivity detection
- **@react-native-async-storage/async-storage 2.1.2** - Cross-platform storage

#### UI Enhancement Libraries
- **@react-native-community/datetimepicker ~8.2.0** - Native date/time pickers
- **expo-image-picker ~15.2.0** - Native image selection (Added: 2025-05-30)
- **Custom UI Components**
  - LoadingSpinner - Themed loading states
  - Toast - Cross-platform notifications
  - ConfirmDialog - Confirmation modals
  - ValidatedInput - Form validation
  - Avatar - User profile images
  - WebIcon - Cross-platform icon component with 100+ emoji fallbacks (Enhanced: 2025-05-30)
  - ThemeContext - Complete dark mode system (Added: v2.137)
- **Theme System**
  - useTheme hook for accessing theme colors
  - useThemedStyles hook for dynamic styling
  - Light/Dark/System mode support
  - Pink-themed color palettes for both modes

### Architecture Patterns

1. **Hybrid Firebase Architecture**
   - Automatic platform detection
   - Seamless mock/real switching
   - Consistent API across all platforms

2. **Service Layer Pattern**
   - Centralized database operations (firestore.ts)
   - Business logic separation (gamification.ts)
   - Clear separation of concerns
   - Platform-specific service implementations

3. **Component-Based Architecture**
   - Reusable UI components
   - Feature-specific modules
   - Composition over inheritance
   - Cross-platform compatibility with WebIcon system

4. **Zustand-Based State Management** (Migrated: 2025-05-29)
   - Centralized store with slices for modularity
   - Offline-first with automatic sync
   - No prop drilling
   - Type-safe with full TypeScript support
   - Persistent state across app restarts

5. **Progressive Enhancement Pattern** (Added: 2025-05-30)
   - Web-first approach with native enhancements
   - Graceful fallbacks (e.g., emoji icons for web)
   - Platform-specific features (e.g., image picker on mobile only)

## Recommendations for Future Enhancements

### State Management Evolution ✅ COMPLETED
1. **Zustand Implementation** (Completed: 2025-05-29)
   - ✅ Migrated from React Context to Zustand
   - ✅ Better TypeScript support implemented
   - ✅ Async state management simplified
   - ✅ Offline-first architecture achieved
   - Next: Add Zustand DevTools for debugging

2. **React Query/TanStack Query**
   - Server state management
   - Automatic caching and invalidation
   - Optimistic updates
   - Background refetching

### Performance Optimizations
1. **React Native New Architecture**
   - Upgrade to Fabric renderer when stable
   - JSI for better native module performance
   - Concurrent features support

2. **Code Splitting & Lazy Loading**
   - Implement route-based code splitting
   - Lazy load heavy components
   - Optimize bundle size

### Testing Infrastructure
1. **React Native Testing Library**
   - Component testing with better APIs
   - Integration with Jest
   - Accessibility testing

2. **Detox or Maestro**
   - E2E testing for critical user flows
   - Cross-platform test scenarios
   - CI/CD integration

### Analytics & Monitoring
1. **Firebase Analytics**
   - User behavior tracking
   - Custom events for chore completion
   - Funnel analysis for onboarding

2. **Sentry or Bugsnag**
   - Real-time error monitoring
   - Performance tracking
   - User session replay

### Push Notifications
1. **Firebase Cloud Messaging (FCM)**
   - Chore reminders
   - Family activity updates
   - Achievement notifications

2. **Expo Notifications**
   - Local notifications
   - Scheduled reminders
   - Badge updates

### Enhanced Features
1. **Real-time Collaboration**
   - Firebase Realtime Database for live updates
   - Presence system for online members
   - Collaborative chore planning

2. **Media Storage**
   - Firebase Storage for profile photos (foundation ready with expo-image-picker)
   - Chore completion photos
   - Family photo sharing

3. **Advanced Gamification**
   - Leaderboards with Firebase
   - Custom achievement badges
   - Family competitions

4. **Dark Mode Implementation** (Completed: v2.137)
   - ✅ Complete theme system with ThemeContext
   - ✅ Pink-themed dark color palette
   - ✅ Light/Dark/System mode support
   - ✅ Theme preference persistence with AsyncStorage
   - ✅ All screens and components support dark mode
   - ✅ Dynamic theme switching without app restart
   - ✅ Platform-aware status bar styling

### Security Enhancements
1. **Firebase Security Rules**
   - Implement granular access control
   - Role-based permissions
   - Data validation rules

2. **App Security**
   - Certificate pinning for API calls
   - Biometric authentication
   - Encrypted local storage

### Platform Expansion
1. **Apple Watch App**
   - Quick chore completion
   - Reminder notifications
   - Activity tracking

2. **Web PWA Enhancement**
   - Offline functionality
   - Install prompts
   - Push notifications

### Development Workflow
1. **Storybook Integration**
   - Component documentation
   - Visual testing
   - Design system management

2. **CI/CD Pipeline**
   - GitHub Actions for automated testing
   - EAS Build triggers
   - Automated version bumping

### Accessibility
1. **React Native Accessibility**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode

2. **Internationalization**
   - react-native-localize
   - Multi-language support
   - RTL layout support

## Migration Considerations

### Immediate Priorities
1. **Add React Query** - Better server state management
2. **Implement Push Notifications** - User engagement
3. **Add Analytics** - Data-driven decisions
4. **Enhance Testing** - Code quality assurance

### Medium-term Goals
1. **Upgrade to Expo SDK 54** - Latest features
2. **Add Zustand DevTools** - Enhanced debugging (Zustand already implemented ✅)
3. **Add Error Monitoring** - Production stability
4. **Create Component Library** - Consistent UI

### Long-term Vision
1. **React Native New Architecture** - Performance boost
2. **Platform Expansion** - Watch, TV apps
3. **Advanced Gamification** - Social features
4. **AI Integration** - Smart chore suggestions

## Conclusion

The current tech stack is excellently architected for a family chore management app, with a solid foundation in React Native, Expo, Firebase, and now Zustand for state management. The hybrid Firebase implementation is particularly clever, allowing seamless development across platforms.

Key strengths:
- Modern React and TypeScript
- Comprehensive Firebase integration
- Beautiful pink theme system
- Excellent separation of concerns
- Cross-platform compatibility
- **Offline-first architecture with Zustand** (NEW)
- **Advanced caching system with compression** (NEW)
- **Complete state management migration** (NEW)

Recent achievements:
- ✅ Full migration from React Context to Zustand (2025-05-29)
- ✅ Offline-first capabilities with action queuing (2025-05-29)
- ✅ Advanced multi-tier caching with LZ compression (2025-05-29)
- ✅ Enhanced sync logic with conflict resolution (2025-05-29)
- ✅ Maintained backward compatibility throughout (2025-05-29)
- ✅ Complete icon consistency with WebIcon component (2025-05-30)
- ✅ Avatar change functionality with expo-image-picker (2025-05-30)
- ✅ Theme preference persistence with AsyncStorage (2025-05-30)

Areas for improvement:
- Testing coverage
- Performance monitoring
- Push notifications
- Zustand DevTools integration

The recommended enhancements would elevate the app from a functional MVP to a production-ready, scalable application with excellent user experience and developer ergonomics.