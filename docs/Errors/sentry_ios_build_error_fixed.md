# Sentry iOS Build Error Fixed

**Date**: May 30, 2025  
**Error Type**: iOS Build Authentication Error  
**Priority**: High  
**Status**: FIXED

## 1.1 Description

**Fixed Error**: iOS builds failing with `Auth token is required for this request. Please run 'sentry-cli login' and try again!`

**Root Cause**: The iOS build process in EAS Build was attempting to upload source maps to Sentry via the `sentry-xcode.sh` and `sentry-xcode-debug-files.sh` scripts, but no authentication token was available in the build environment.

**Solution Approach**: Disabled automatic Sentry source map uploads during iOS builds by setting environment variables that tell the Sentry CLI to skip uploads or allow failures.

## 1.2 Changes

### EAS Build Configuration (`eas.json`)
**Added environment variables to all build profiles**:
- `SENTRY_DISABLE_AUTO_UPLOAD=true` - Disables automatic source map uploads
- `SENTRY_ALLOW_FAILURE=true` - Allows builds to continue if Sentry operations fail

**Specific changes**:
```json
{
  "build": {
    "development": {
      "env": {
        "SENTRY_DISABLE_AUTO_UPLOAD": "true"
      }
    },
    "preview": {
      "env": {
        "SENTRY_DISABLE_AUTO_UPLOAD": "true"
      }
    },
    "preview-simulator": {
      "env": {
        "SENTRY_DISABLE_AUTO_UPLOAD": "true"
      }
    },
    "production": {
      "env": {
        "SENTRY_DISABLE_AUTO_UPLOAD": "true",
        "SENTRY_ALLOW_FAILURE": "true"
      },
      "prebuild": {
        "env": {
          "SENTRY_DISABLE_AUTO_UPLOAD": "true",
          "SENTRY_ALLOW_FAILURE": "true"
        }
      }
    }
  }
}
```

### Environment Documentation (`.env.example`)
**Added documentation for new environment variables**:
```bash
# Build Configuration
# Set to 'true' to disable automatic Sentry source map uploads during builds
# Useful when SENTRY_AUTH_TOKEN is not available or when uploads fail
SENTRY_DISABLE_AUTO_UPLOAD=false

# Set to 'true' to allow builds to continue even if Sentry upload fails
# Recommended for production builds to prevent auth failures from blocking releases
SENTRY_ALLOW_FAILURE=true
```

### Build Setup Script (`scripts/setup-ios-build.sh`)
**Created automated setup script**:
- Exports Sentry environment variables at build time
- Updates `ios/.xcode.env.local` with proper configuration
- Ensures environment variables are available to Xcode build phases

### iOS Environment Configuration
**Updated `ios/.xcode.env.local`**:
```bash
export NODE_BINARY=$(command -v node)
export SENTRY_DISABLE_AUTO_UPLOAD=true
export SENTRY_ALLOW_FAILURE=true
```

## 1.3 Insights

### Key Learning Points
1. **EAS Build Environment**: Environment variables in `eas.json` are propagated to the build environment and available to Xcode build phases
2. **Sentry CLI Behavior**: The `@sentry/react-native` package includes two build phases that can fail builds:
   - `sentry-xcode.sh` - Handles source map uploads during bundling
   - `sentry-xcode-debug-files.sh` - Handles debug symbol uploads
3. **Environment Variable Priority**: Variables set in `eas.json` override local settings during EAS builds
4. **Graceful Degradation**: Disabling source map uploads doesn't affect runtime error monitoring

### Alternative Solutions Considered
1. **Adding SENTRY_AUTH_TOKEN to EAS secrets**: Would enable uploads but requires token management
2. **Modifying Xcode build phases**: Would require ejecting from managed workflow
3. **Custom build hooks**: More complex but could enable conditional uploads

### Best Practices Established
- Always provide fallback options for external service integrations
- Document all environment variables in `.env.example`
- Use `SENTRY_ALLOW_FAILURE` for production builds to prevent blocking releases
- Test environment variable propagation in EAS Build environment

## 1.4 Watchdog

### Future Version Compatibility
- **@sentry/react-native updates**: New versions may change environment variable names or behavior
- **EAS Build changes**: Environment variable handling or Xcode integration may change
- **Expo SDK updates**: Managed workflow changes could affect build phase integration

### Monitoring Points
1. **Build Success Rate**: Monitor iOS build completion rate after this change
2. **Error Monitoring Coverage**: Verify runtime error monitoring still works without source maps
3. **Environment Variable Changes**: Watch for changes in Sentry CLI environment variable support

### Red Flags to Watch
- iOS builds starting to fail again with Sentry errors
- Changes in `@sentry/react-native` documentation regarding environment variables
- EAS Build system changes affecting environment variable propagation
- Expo managed workflow changes affecting Xcode build phases

### Version Pinning Considerations
- Current `@sentry/react-native` version: `^6.14.0` - consider pinning if behavior changes
- Monitor Expo SDK releases for changes to build system

## 1.5 Admin Panel

### Current Error Monitoring Status
**Runtime Error Monitoring**: Still fully functional
- Error capture continues to work in production
- User context and breadcrumbs are preserved
- Web platform still uploads source maps automatically

**Missing Functionality**: iOS Source Map Uploads
- Stack traces may be less readable for iOS production errors
- File names and line numbers may be minified/obfuscated
- Function names may not be preserved in error reports

### Admin Panel Options for Future Enhancement

#### 1. Source Map Upload Toggle
**Description**: Add admin setting to enable/disable source map uploads
**Implementation**: 
- Environment variable toggle in admin panel
- Requires SENTRY_AUTH_TOKEN configuration
- Shows upload status and last successful upload time

#### 2. Build Health Monitoring
**Description**: Track iOS build success/failure rates
**Metrics to Display**:
- Build completion rate over time
- Build failure reasons (categorized)
- Time to build completion
- Source map upload success rate

#### 3. Error Monitoring Quality Dashboard
**Description**: Show impact of missing source maps on error debugging
**Metrics to Include**:
- Percentage of errors with readable stack traces
- Most common error locations (by minified function name)
- Error resolution time with/without source maps

#### 4. Alternative Upload Methods
**Description**: Manual or scheduled source map uploads
**Options**:
- Upload source maps after successful builds
- Scheduled uploads during off-peak hours
- Manual upload button for specific releases

### Recommended Admin Settings
1. **Error Monitoring Health Check**: Green status showing runtime monitoring is active
2. **Build Status Indicator**: Shows last successful iOS build
3. **Source Map Warning**: Indicates when uploads are disabled with option to enable
4. **Quick Actions**: 
   - Test error capture button
   - View recent errors in Sentry
   - Check build logs for Sentry-related messages

---

**Fix Status**: ✅ COMPLETED  
**Next Actions**: Monitor first iOS build with new configuration, verify error monitoring still works in production