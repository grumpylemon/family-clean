# Family Clean - Complete Tech Stack Documentation

Last Updated: May 28, 2025

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
- **Custom Pink Theme System** - Centralized color constants and themed components

### State Management

#### Current Implementation
- **React Context API** - Global state management without external dependencies
  - `AuthContext` - Authentication state and user management
  - `FamilyContext` - Family data, members, and settings
- **Local Component State** - useState hooks for UI state
- **Custom Hooks** - Reusable logic patterns (useFormValidation, useThemeColor, etc.)

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
- **Firebase Persistence**
  - IndexedDB for web platform
  - In-memory for mock mode
- **Session Management** - Auth state persistence across app restarts

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
  - Bundle Identifier: `com.grumpylemon.familyclean`
  - Apple Team ID: `87699862N5`
  - App Store Connect ID: `6746467670`
- **Android**
  - Package Name: `com.grumpylemon.familyfun`
  - Adaptive icon support
- **Web**
  - Static export capability
  - PWA-ready configuration

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
- **react-native-gesture-handler ~2.21.2** - Touch gesture system
- **react-native-reanimated ~4.2.0** - High-performance animations
- **react-native-safe-area-context ~5.0.0** - Safe area handling
- **react-native-screens ~4.4.0** - Native navigation optimization
- **react-native-webview ~14.0.4** - Web content display

#### UI Enhancement Libraries
- **@react-native-community/datetimepicker ~8.2.0** - Native date/time pickers
- **Custom UI Components**
  - LoadingSpinner - Themed loading states
  - Toast - Cross-platform notifications
  - ConfirmDialog - Confirmation modals
  - ValidatedInput - Form validation
  - Avatar - User profile images

### Architecture Patterns

1. **Hybrid Firebase Architecture**
   - Automatic platform detection
   - Seamless mock/real switching
   - Consistent API across all platforms

2. **Service Layer Pattern**
   - Centralized database operations (firestore.ts)
   - Business logic separation (gamification.ts)
   - Clear separation of concerns

3. **Component-Based Architecture**
   - Reusable UI components
   - Feature-specific modules
   - Composition over inheritance

4. **Context-Based State Management**
   - Global contexts for shared state
   - Local state for component data
   - No prop drilling

## Recommendations for Future Enhancements

### State Management Evolution
1. **Consider Zustand or Valtio**
   - Lighter than Redux but more powerful than Context
   - Better TypeScript support
   - Easier async state management
   - DevTools integration

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
   - Firebase Storage for profile photos
   - Chore completion photos
   - Family photo sharing

3. **Advanced Gamification**
   - Leaderboards with Firebase
   - Custom achievement badges
   - Family competitions

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
2. **Implement Zustand** - Better state management
3. **Add Error Monitoring** - Production stability
4. **Create Component Library** - Consistent UI

### Long-term Vision
1. **React Native New Architecture** - Performance boost
2. **Platform Expansion** - Watch, TV apps
3. **Advanced Gamification** - Social features
4. **AI Integration** - Smart chore suggestions

## Conclusion

The current tech stack is well-architected for a family chore management app, with a solid foundation in React Native, Expo, and Firebase. The hybrid Firebase implementation is particularly clever, allowing seamless development across platforms.

Key strengths:
- Modern React and TypeScript
- Comprehensive Firebase integration
- Beautiful pink theme system
- Good separation of concerns
- Cross-platform compatibility

Areas for improvement:
- Testing coverage
- Performance monitoring
- Push notifications
- Advanced state management

The recommended enhancements would elevate the app from a functional MVP to a production-ready, scalable application with excellent user experience and developer ergonomics.