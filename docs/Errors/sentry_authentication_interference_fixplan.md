# Sentry Authentication Interference - Fix Plan

**Date**: May 31, 2025  
**Error Type**: Authentication State Interference  
**Priority**: High  
**Status**: Analysis Complete - Ready for Implementation

## 1.0 The Error

**Primary Issue**: Users successfully authenticate with Google but are immediately redirected back to the login screen, creating an authentication loop despite our previous Firebase listener fix.

**Root Cause Analysis**: Based on console logs and the Sentry integration timeline, the issue appears to be caused by Sentry's user context management interfering with the authentication state flow. When `setUserContext()` and `clearUserContext()` are called during authentication, they may be triggering side effects that clear the authentication state.

**Evidence from Logs**:
- Firebase authentication succeeds: `[AuthSlice] Auth state change triggered: {hasUser: false, userEmail: undefined, hasInitialLoad: false}`
- Sentry context clearing occurs: `clearUserContext()` is called multiple times
- Authentication state gets cleared despite our initial load protection

**Sentry Integration Issues Identified**:
1. Sentry's `setUser()` and `clearUserContext()` calls may be interfering with Firebase auth state
2. Breadcrumb tracking may be capturing authentication events and affecting state
3. User context synchronization between Sentry and Firebase may be causing conflicts

## 1.1 Issues it causes

**Critical User Impact**:
- New users cannot complete registration flow
- Existing users may experience intermittent login loops
- Authentication appears successful but immediately fails
- Poor user experience leading to abandonment

**Technical Impact**:
- Authentication state becomes unreliable
- Sentry error tracking may capture false authentication failures
- Multiple authentication attempts create unnecessary Firebase calls
- Store persistence becomes unreliable during auth transitions

**Business Impact**:
- User acquisition completely blocked
- Customer support issues increase
- App store ratings affected by broken core functionality
- Revenue impact from inability to onboard new users

## 1.2 Logic breakdown

**Authentication Flow Logic**:
1. User clicks Google sign-in
2. Firebase authentication popup/redirect succeeds
3. `signInWithGoogle()` creates/updates user profile
4. `setUserContext()` called to track user in Sentry
5. **INTERFERENCE POINT**: Sentry context operations may trigger auth state changes
6. `clearUserContext()` gets called unexpectedly
7. Authentication state cleared despite successful login
8. User redirected back to login screen

**Edge Cases**:
- Multiple rapid authentication attempts
- Browser tab switching during auth flow  
- Network interruptions during Sentry context setting
- Sentry initialization timing conflicts with auth listener
- Platform-specific Sentry behavior differences (web vs mobile)

**Permission Checks**:
- Firebase authentication permissions (working correctly)
- Sentry DSN and environment configuration
- Browser popup permissions for OAuth flow
- Cross-origin request permissions for Sentry reporting

**Compatibility Issues**:
- Sentry React SDK vs React Native SDK behavior differences
- Firebase Auth SDK integration with Sentry user tracking
- Zustand store persistence during Sentry context changes
- Browser security policies affecting cross-service integration

## 1.3 Ripple map

**Core Files Requiring Changes**:
- `/stores/authSlice.ts` - Remove or conditional Sentry integration
- `/config/sentry.ts` - Add authentication-safe context management
- `/app/login.tsx` - Enhanced debugging for Sentry interference

**Authentication Flow Files**:
- `/hooks/useAuthZustand.ts` - Monitor Sentry context effects
- `/services/authService.ts` - Isolate Sentry calls from auth logic
- `/contexts/AuthContext.tsx` - Legacy context may need Sentry isolation

**Sentry Integration Files**:
- `/config/sentry.ts` - Core Sentry configuration and helpers
- All files calling `setUserContext()` and `clearUserContext()`
- Error boundary components using Sentry capture

**Testing Files**:
- `/scripts/test-auth-debug.js` - Enhanced Sentry monitoring
- New test script for Sentry-auth interaction testing
- Jest tests for isolated authentication without Sentry

**Configuration Files**:
- `/.env.example` - New Sentry debugging flags
- `/app.json` - Potential Sentry plugin configuration
- `/package.json` - Sentry dependency management

## 1.4 UX & Engagement uplift

**User Experience Improvements**:
- Immediate access to app after successful authentication
- Clear loading states during authentication process
- Error messages if authentication fails (not loops)
- Progress indicators showing authentication steps

**UI Changes Required**:
- Loading spinner during auth state resolution
- Clear error messages for authentication failures
- "Retry" button for failed authentication attempts
- Visual feedback during Google OAuth flow

**Engagement Features**:
- Welcome message after successful first-time login
- Progress tracking for family setup completion
- Guided onboarding flow after authentication
- Success confirmation before family setup

## 1.5 Documents and Instructions

**Sentry Documentation**:
- [Sentry React SDK User Context](https://docs.sentry.io/platforms/javascript/enriching-events/identify-user/)
- [Sentry React Native Integration](https://docs.sentry.io/platforms/react-native/)
- [Sentry Error Filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/)

**Firebase Auth Documentation**:
- [Firebase Auth State Management](https://firebase.google.com/docs/auth/web/manage-users)
- [Firebase Auth with External Services](https://firebase.google.com/docs/auth/web/custom-auth)

**Integration Patterns**:
- [Authentication + Monitoring Best Practices](https://docs.sentry.io/product/sentry-basics/integrate-frontend/javascript/)
- [Error Monitoring During Authentication](https://docs.sentry.io/platforms/javascript/guides/react/configuration/filtering/)

**Related Error Documentation**:
- `docs/Errors/sentry_ios_build_error_fixed.md` - Previous Sentry integration issues
- `docs/Errors/new_user_signup_authentication_loop_fixed.md` - Previous auth loop fix

## 1.6 Fixes checklist

**Authentication Flow**:
- [ ] User can sign in with Google without authentication loops
- [ ] Existing users can sign in normally without issues
- [ ] New users proceed to family setup after authentication
- [ ] Authentication state persists across page refreshes
- [ ] Signout functionality works correctly

**Sentry Integration**:
- [ ] Error monitoring continues to work during authentication
- [ ] User context is set correctly after successful authentication
- [ ] Authentication errors are captured but don't interfere with flow
- [ ] No false authentication failures reported to Sentry

**Cross-Platform**:
- [ ] Web authentication works in all major browsers
- [ ] Mobile authentication works on iOS and Android
- [ ] No platform-specific authentication loops
- [ ] Consistent behavior across web and mobile

**Error Handling**:
- [ ] Authentication failures show appropriate error messages
- [ ] Network errors don't cause authentication loops
- [ ] Sentry errors don't affect authentication state
- [ ] Graceful fallback when Sentry is unavailable

## 1.7 Detailed to-do task list

- [ ] **Phase 1: Sentry Authentication Isolation**
  - [ ] Create authentication-safe Sentry context management
  - [ ] Add delayed Sentry user context setting after auth completion
  - [ ] Implement Sentry context queue to prevent interference
  - [ ] Add feature flag to disable Sentry during authentication

- [ ] **Phase 2: Enhanced Debugging**
  - [ ] Add Sentry operation logging to auth debug script
  - [ ] Create isolated authentication test without Sentry
  - [ ] Enhanced console logging for Sentry context changes
  - [ ] Monitor timing between auth success and Sentry calls

- [ ] **Phase 3: Authentication Flow Hardening**
  - [ ] Add authentication state locking during Sentry operations
  - [ ] Implement retry logic for authentication with Sentry failures
  - [ ] Create auth completion verification before Sentry integration
  - [ ] Add timeout protection for Sentry context operations

- [ ] **Phase 4: Testing & Validation**
  - [ ] Test new user registration flow 10 times consecutively
  - [ ] Test existing user sign-in with various browsers
  - [ ] Test authentication with Sentry disabled
  - [ ] Test authentication with simulated Sentry errors
  - [ ] Cross-platform authentication testing

- [ ] **Phase 5: Error Monitoring Hardening**
  - [ ] Filter authentication-related errors from Sentry reporting
  - [ ] Add authentication flow breadcrumbs without state interference
  - [ ] Implement safe error capture during authentication
  - [ ] Create authentication-specific error context

## 1.8 Future issues or incompatibilities

**Sentry SDK Updates**:
- Changes in user context management behavior
- New authentication-related integrations
- Performance monitoring changes affecting auth flow
- Browser security policy changes affecting Sentry integration

**Firebase Auth Changes**:
- Changes in onAuthStateChanged behavior
- New authentication methods requiring Sentry integration
- Firebase Analytics integration with Sentry
- Authentication state persistence changes

**Browser Compatibility**:
- Third-party cookie restrictions affecting Sentry
- CORS policy changes affecting cross-service integration
- Browser popup blocker changes affecting OAuth flow
- Privacy mode effects on authentication + monitoring

**React Native Updates**:
- Platform-specific Sentry behavior changes
- Navigation library changes affecting auth flow
- State management library updates affecting integration
- Metro bundler changes affecting Sentry initialization

## 1.9 Admin Panel Options

**Authentication Monitoring Dashboard**:
- Real-time authentication success/failure rates
- Sentry integration status during authentication
- Authentication loop detection alerts
- User context synchronization status

**Sentry Integration Controls**:
- Toggle Sentry during authentication (emergency disable)
- Authentication error filter configuration
- Sentry context timing adjustment controls
- Manual user context sync triggers

**Debug Tools**:
- Authentication flow step-by-step monitor
- Sentry operation timeline during auth
- Authentication state change logs
- Cross-service integration health checks

**Emergency Controls**:
- Disable Sentry for authentication emergencies
- Force authentication state reset
- Manual user context clearing
- Authentication bypass for testing

**Monitoring Alerts**:
- Authentication loop detection threshold
- Sentry error rate spike alerts
- Authentication failure rate monitoring
- User context synchronization failure alerts

---

**Next Steps**: Implement Phase 1 - Sentry Authentication Isolation with delayed context setting to prevent interference with Firebase authentication flow.