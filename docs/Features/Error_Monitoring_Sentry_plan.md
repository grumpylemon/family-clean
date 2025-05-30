# Error Monitoring Sentry Integration Plan

## 1.0 The Goal
Integrate Sentry for comprehensive production error tracking and monitoring in the Family Compass app. This will enable real-time error detection, debugging, and resolution across web, iOS, and Android platforms, ensuring app stability and improving user experience.

## 1.1 Feature List
1. **Automatic Error Capture**: Automatically catch and report JavaScript errors, unhandled promise rejections, and React component errors
   - **User Value**: Improved app stability with fewer crashes and better error recovery
   
2. **Detailed Error Context**: Capture user context, device info, and breadcrumbs leading to errors
   - **User Value**: Faster bug fixes and more stable app experience
   
3. **Performance Monitoring**: Track app performance metrics and slow operations
   - **User Value**: Smoother app performance and faster load times
   
4. **Release Tracking**: Monitor error rates across different app versions
   - **User Value**: More stable releases with fewer regression bugs
   
5. **User Feedback Widget**: Allow users to report issues with screenshots
   - **User Value**: Direct communication channel for reporting problems
   
6. **Offline Error Queue**: Store errors offline and send when connection restored
   - **User Value**: No lost error reports even when offline

## 1.2 Logic Breakdown
1. **Error Capture Rules**:
   - Capture all unhandled JavaScript errors
   - Capture unhandled promise rejections
   - Capture React ErrorBoundary errors
   - Filter out expected errors (network timeouts, user cancellations)
   - Sanitize sensitive data (passwords, auth tokens)
   
2. **Environment-Specific Logic**:
   - Production only - disable in development/mock mode
   - Different DSN for web vs native platforms
   - Source map upload for readable stack traces
   - Release/version tracking from constants/Version.ts
   
3. **User Context**:
   - Attach authenticated user ID (not email for privacy)
   - Include family ID for multi-tenant debugging
   - Track user role (admin/member)
   - Include device/browser information
   
4. **Performance Thresholds**:
   - Alert on error rate > 1% of sessions
   - Track slow navigation > 3 seconds
   - Monitor API response times
   - Track bundle size impact

## 1.3 Ripple Map
### Files to Modify:
1. **package.json**: Add Sentry dependencies
   - @sentry/react-native for mobile
   - @sentry/react for web
   - @sentry/integrations for additional features

2. **app/_layout.tsx**: Initialize Sentry at app start
   - Add Sentry.init() before app renders
   - Wrap app with Sentry.ErrorBoundary
   - Configure based on platform and environment

3. **components/ui/ErrorBoundary.tsx**: Integrate with Sentry
   - Send errors to Sentry in componentDidCatch
   - Add user feedback option
   - Include error ID for support

4. **config/sentry.ts** (NEW): Centralized Sentry configuration
   - Platform-specific initialization
   - Environment detection
   - DSN management
   - Filtering rules

5. **stores/enhancedSyncService.ts**: Add error tracking
   - Track sync failures
   - Monitor conflict resolution errors
   - Performance tracking for sync operations

6. **services/firestore.ts**: Add operation tracking
   - Track failed Firebase operations
   - Monitor query performance
   - Capture permission errors

7. **metro.config.js**: Configure source maps
   - Enable source map generation
   - Configure Sentry Metro plugin

8. **app.json**: Add Sentry configuration
   - Add Sentry plugin for EAS builds
   - Configure native SDKs

9. **.gitignore**: Exclude Sentry files
   - Add .sentryclirc
   - Exclude source maps

10. **eas.json**: Configure build hooks
    - Upload source maps post-build
    - Set release versions

### New Files:
1. **config/sentry.ts**: Sentry initialization and configuration
2. **.sentryclirc**: Sentry CLI configuration (git-ignored)
3. **scripts/upload-sourcemaps.js**: Source map upload script

### Tests to Add/Update:
1. **__tests__/errorBoundary.test.ts**: Test Sentry integration
2. **__tests__/sentryConfig.test.ts**: Test configuration logic
3. **__tests__/errorFiltering.test.ts**: Test error filtering rules

## 1.4 UX & Engagement Uplift
1. **Improved Stability**: Fewer crashes mean happier users who stay engaged
2. **Faster Bug Resolution**: Quick fixes for issues users actually experience
3. **Proactive Monitoring**: Fix bugs before users report them
4. **User Feedback Loop**: Users can report issues with context
5. **Performance Insights**: Identify and fix slow experiences
6. **Reduced Friction**: Fewer errors = smoother user journey
7. **Trust Building**: Professional error handling increases user confidence

## 1.5 Data-Model Deltas
### New Environment Variables:
```typescript
// .env
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx
```

### Updated Types:
```typescript
// types/index.ts
export interface ErrorMetadata {
  errorId: string;
  timestamp: string;
  userId?: string;
  familyId?: string;
  version: string;
  platform: 'web' | 'ios' | 'android';
  environment: 'production' | 'staging' | 'development';
}

// config/sentry.ts types
export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  debug: boolean;
  tracesSampleRate: number;
  attachStacktrace: boolean;
  beforeSend?: (event: any) => any;
}
```

## 1.6 Acceptance Checklist
- [ ] Sentry captures all unhandled errors in production
- [ ] Error reports include user context and breadcrumbs
- [ ] Sensitive data is filtered from error reports
- [ ] Source maps work for readable stack traces
- [ ] Performance monitoring tracks key user flows
- [ ] Offline errors are queued and sent when online
- [ ] Error boundary shows user-friendly message with error ID
- [ ] Admin panel shows error rate metrics
- [ ] No performance impact on app startup
- [ ] Works on all platforms (web, iOS, Android)
- [ ] Development/mock mode doesn't send to Sentry
- [ ] Release tracking shows version-specific error rates

## 1.7 Detailed To-Do Task List
- [ ] **Sentry Integration Setup**
  - [X] Create Sentry account and project
  - [ ] Install Sentry dependencies
  - [ ] Create config/sentry.ts with initialization logic
  - [ ] Add environment variables to .env
  - [ ] Update .gitignore for Sentry files
  
- [ ] **Core Integration**
  - [ ] Initialize Sentry in app/_layout.tsx
  - [ ] Update ErrorBoundary to send errors to Sentry
  - [ ] Add Sentry error boundary wrapper
  - [ ] Configure platform-specific settings
  - [ ] Add user context tracking
  
- [ ] **Error Filtering & Privacy**
  - [ ] Implement beforeSend filter for sensitive data
  - [ ] Filter out expected errors (network, auth)
  - [ ] Add data scrubbing rules
  - [ ] Test privacy compliance
  
- [ ] **Performance Monitoring**
  - [ ] Enable performance tracking
  - [ ] Add custom transactions for key flows
  - [ ] Monitor API response times
  - [ ] Track navigation performance
  
- [ ] **Source Maps & Releases**
  - [ ] Configure Metro for source maps
  - [ ] Create upload script
  - [ ] Add EAS build hooks
  - [ ] Test source map resolution
  
- [ ] **Testing**
  - [ ] Add unit tests for Sentry config
  - [ ] Test error capture flow
  - [ ] Verify offline queue
  - [ ] Test on all platforms
  
- [ ] **Admin Features**
  - [ ] Add error metrics to admin panel
  - [ ] Create error rate dashboard
  - [ ] Add Sentry project link
  - [ ] Document support workflow

## 1.8 Future Integration Options
1. **Advanced Error Analytics**
   - Custom dashboards for error trends
   - Automated error grouping rules
   - AI-powered error analysis
   
2. **User Session Replay**
   - Record user sessions leading to errors
   - Visual debugging with replay
   - Privacy-compliant recording
   
3. **Alerting & Automation**
   - Slack/Discord integration for alerts
   - Automated ticket creation
   - Custom alert rules per error type
   
4. **Performance Optimization**
   - Code splitting analysis
   - Bundle size monitoring
   - Memory leak detection
   
5. **A/B Testing Integration**
   - Track errors by feature flags
   - Compare error rates across experiments
   - Roll back problematic features

## 1.9 Admin Panel Options
1. **Error Monitoring Dashboard**
   - Current error rate percentage
   - Errors in last 24 hours
   - Top 5 errors by occurrence
   - Link to Sentry dashboard
   
2. **Configuration Options**
   - Toggle error reporting on/off
   - Set error sampling rate
   - Configure user feedback widget
   - Manage filtered error types
   
3. **Debug Tools**
   - Trigger test error
   - View last captured error
   - Check Sentry connection status
   - Export error logs
   
4. **Privacy Controls**
   - Configure data scrubbing rules
   - Manage PII filtering
   - Set retention policies
   - User consent management

## 2.0 Potential Errors
1. **Configuration Issues**
   - Missing or invalid DSN
   - Wrong environment detection
   - Source map upload failures
   
2. **Platform Compatibility**
   - Native module conflicts with Expo Go
   - Different SDK versions for web/native
   - Metro bundler configuration issues
   
3. **Performance Impact**
   - Increased bundle size
   - Slower app initialization
   - Memory usage from breadcrumbs
   
4. **Privacy Concerns**
   - Accidental PII leakage
   - GDPR compliance issues
   - User consent requirements
   
5. **Network & Offline**
   - Failed error submissions
   - Queue overflow when offline
   - Rate limiting from Sentry
   
6. **Development Friction**
   - False positives in development
   - Noisy error reports
   - Debugging with Sentry enabled