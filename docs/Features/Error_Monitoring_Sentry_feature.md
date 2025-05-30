# Error Monitoring with Sentry

## 1.1 Description
The Family Compass app now includes comprehensive error monitoring powered by Sentry. This integration provides real-time error tracking, performance monitoring, and user feedback collection across all platforms (web, iOS, and Android). The system automatically captures errors, provides detailed debugging context, and helps maintain app stability for all family members.

## 1.2 Features
### Core Error Tracking
- **Automatic Error Capture**: All JavaScript errors, unhandled promise rejections, and React component crashes are automatically captured
- **Detailed Error Context**: Each error includes user information, device details, and a breadcrumb trail of actions leading to the error
- **Smart Filtering**: Common non-critical errors (like network timeouts) are filtered to reduce noise
- **Privacy Protection**: All sensitive data (passwords, tokens, personal information) is automatically scrubbed from error reports

### Performance Monitoring
- **Transaction Tracking**: Monitor how long key operations take (page loads, API calls, etc.)
- **Performance Metrics**: Track Web Vitals and Core Web Vitals for optimal user experience
- **Slow Operation Alerts**: Get notified when operations exceed performance thresholds
- **Resource Monitoring**: Track bundle sizes and load times

### User Experience
- **Friendly Error Messages**: Users see helpful error messages with unique error IDs for support
- **Offline Support**: Errors are queued when offline and sent when connection is restored
- **User Feedback**: Users can optionally provide feedback when errors occur
- **Transparent Communication**: Error IDs help support teams quickly identify and resolve issues

### Platform-Specific Features
- **Web**: Full source map support for readable stack traces
- **iOS/Android**: Native crash reporting and ANR (Application Not Responding) detection
- **Cross-Platform**: Unified error tracking across all platforms with platform-specific context

## 1.3 Use Cases
### For Users
1. **Better Stability**: Fewer crashes and errors mean a more reliable chore management experience
2. **Faster Fixes**: Bugs are identified and fixed quickly, often before users report them
3. **Support Communication**: Error IDs make it easy to report issues to support
4. **Improved Performance**: Slow operations are identified and optimized

### For Developers
1. **Real-Time Monitoring**: See errors as they happen in production
2. **Debugging Context**: Full stack traces, user actions, and device information
3. **Version Tracking**: Compare error rates across releases
4. **Performance Insights**: Identify bottlenecks and optimize critical paths

### For Administrators
1. **Health Monitoring**: Track app stability metrics in the admin panel
2. **User Impact**: See how many users are affected by specific errors
3. **Release Quality**: Monitor error rates after new deployments
4. **Proactive Support**: Address issues before users complain

## 1.4 Instructions
### For End Users
When an error occurs:
1. You'll see a friendly error message with options to retry or go back
2. Note the error ID if you need to contact support
3. Optionally provide feedback about what you were doing
4. The app will try to recover automatically when possible

### For Developers
#### Viewing Errors
1. Log into Sentry dashboard at sentry.io
2. Select the family-fun-app project
3. View real-time error feed in Issues tab
4. Click any error for full debugging details

#### Testing Error Capture
```javascript
// Trigger a test error (development only)
throw new Error('Test error from Family Compass');

// Test async error
Promise.reject(new Error('Test async error'));

// Test React component error
<ThrowError /> // Component that throws in render
```

#### Custom Error Logging
```javascript
import * as Sentry from '@sentry/react-native';

// Log custom error with context
Sentry.captureException(error, {
  contexts: {
    chore: {
      id: choreId,
      title: choreTitle
    }
  },
  tags: {
    section: 'chore_completion'
  }
});

// Add breadcrumb for debugging
Sentry.addBreadcrumb({
  message: 'User completed chore',
  category: 'user_action',
  data: { choreId, points }
});
```

#### Performance Monitoring
```javascript
// Track custom transaction
const transaction = Sentry.startTransaction({
  name: 'chore_list_load',
  op: 'navigation'
});

// ... perform operation ...

transaction.finish();
```

### Error Filtering
Errors are automatically filtered based on:
- Network errors during offline mode
- Expected Firebase auth errors
- User cancellation actions
- Development/localhost errors

## 1.5 Admin Panel
### Accessing Error Monitoring
1. Navigate to Settings → Admin Panel
2. Select "Error Monitoring" section
3. View real-time error metrics

### Available Metrics
- **Error Rate**: Percentage of sessions with errors
- **24-Hour Count**: Total errors in last 24 hours
- **Top Errors**: Most frequent errors with occurrence count
- **Affected Users**: Number of unique users experiencing errors
- **Platform Breakdown**: Errors by platform (web/iOS/Android)

### Configuration Options
1. **Error Reporting Toggle**
   - Enable/disable error reporting
   - Useful for debugging or privacy concerns

2. **Sampling Rate**
   - Control percentage of errors captured
   - Range: 0% (disabled) to 100% (all errors)
   - Default: 100% in production

3. **User Feedback Widget**
   - Enable/disable user feedback on errors
   - Customize feedback form fields
   - Set auto-dismiss timeout

4. **Privacy Settings**
   - Configure PII scrubbing rules
   - Set data retention period
   - Manage user consent preferences

### Debug Tools
1. **Test Error Button**
   - Triggers a test error to verify setup
   - Shows error ID for verification

2. **Connection Status**
   - Shows Sentry connection health
   - Displays last successful upload
   - Queue size for offline errors

3. **View in Sentry**
   - Direct link to Sentry dashboard
   - Pre-filtered to show app errors
   - Requires Sentry account access

## 1.6 Road Map
### Phase 1 (Current)
- ✅ Basic error capture and reporting
- ✅ User context and breadcrumbs
- ✅ Platform-specific configuration
- ✅ Admin panel integration

### Phase 2 (Next Quarter)
- Session replay for visual debugging
- Enhanced performance monitoring
- Custom alert rules
- Error trend analysis

### Phase 3 (Future)
- AI-powered error grouping
- Predictive error detection
- Automated fix suggestions
- Integration with CI/CD pipeline

### Expansion Opportunities
1. **Advanced Analytics**
   - Error impact scoring
   - User journey analysis
   - Cohort-based error tracking

2. **Automation**
   - Auto-create GitHub issues
   - Slack/Discord notifications
   - Automated rollback triggers

3. **User Experience**
   - In-app error status page
   - Proactive error notifications
   - Self-service debugging tools

4. **Performance**
   - Real User Monitoring (RUM)
   - Synthetic monitoring
   - Load testing integration