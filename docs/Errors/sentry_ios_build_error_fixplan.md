# Sentry iOS Build Error Fix Plan

**Date**: May 30, 2025  
**Error Type**: iOS Build Authentication Error  
**Priority**: High  

## 1.0 The Error

**Error Message**: `Auth token is required for this request. Please run 'sentry-cli login' and try again!`

**Context**: The iOS build fails during the "Bundle React Native code and images" phase when sentry-cli attempts to upload source maps. The error occurs because EAS Build environment doesn't have access to the Sentry authentication token needed for source map uploads.

**Technical Details**:
- Error occurs in Build Phase: PhaseScriptExecution Bundle React Native code and images
- sentry-cli is configured to upload source maps during iOS builds
- Environment variable SENTRY_AUTH_TOKEN is not available in EAS Build
- The error prevents the iOS archive from completing successfully

## 1.1 Issues it causes

1. **Critical Build Failure**: iOS builds cannot complete, blocking TestFlight submissions
2. **Development Velocity**: Team cannot release iOS updates or fixes
3. **Production Impact**: Critical bugs cannot be deployed to iOS users
4. **CI/CD Pipeline**: Automated builds fail, requiring manual intervention
5. **Error Monitoring Gap**: No source maps means less useful error reports for iOS
6. **Time Loss**: Each failed build wastes ~20-30 minutes of EAS Build time

## 1.2 Logic breakdown

### Authentication Requirements
- Sentry CLI requires SENTRY_AUTH_TOKEN environment variable for uploads
- Token must have project:releases and project:write permissions
- Token is organization-specific and project-specific
- EAS Build runs in isolated environment without local credentials

### Build Process Flow
1. React Native bundler runs metro bundling
2. Source maps are generated during bundling
3. Sentry upload script attempts to run
4. sentry-cli tries to authenticate with Sentry API
5. **FAILURE POINT**: No auth token available
6. Build process terminates with error

### Edge Cases
- Development builds work fine (source maps not uploaded)
- Web builds work (different upload mechanism)
- Android builds may also be affected (same configuration)
- Local iOS builds work if developer has sentry-cli logged in

### Permission Checks
- SENTRY_AUTH_TOKEN must be valid and not expired
- Token must have correct organization permissions
- Project must exist and be accessible
- Rate limiting considerations for API calls

### Compatibility Issues
- Sentry CLI version compatibility with React Native
- EAS Build environment constraints
- Expo workflow limitations
- iOS-specific bundle upload requirements

## 1.3 Ripple map

### Files Requiring Changes
- `/ios/sentry.properties` - Sentry configuration
- `/eas.json` - Environment variable configuration
- `/app.json` or `/app.config.js` - Build hooks
- `/config/sentry.ts` - Runtime configuration
- `/package.json` - Scripts and dependencies
- `/.env.example` - Document required environment variables

### Build Configuration
- EAS Build secrets management
- Environment variable propagation
- Build hooks and scripts
- Source map generation settings

### CI/CD Integration
- GitHub Actions (if used)
- EAS Build environment
- Secret management systems
- Build artifact handling

### Testing Requirements
- Build verification on EAS
- Local build testing
- Error monitoring validation
- Source map verification

### Documentation Updates
- Build setup instructions
- Environment configuration guide
- Troubleshooting documentation
- Developer onboarding

## 1.4 UX & Engagement uplift

### Immediate User Impact
- **None** - This is a build-time error, not runtime
- Users on TestFlight will continue using current version
- No direct UX changes required

### Developer Experience
- **Improved**: Successful builds enable faster iteration
- **Monitoring**: Better error tracking with source maps
- **Confidence**: Reliable build process reduces deployment stress

### Long-term Benefits
- **Error Quality**: Source maps provide better error debugging
- **Development Speed**: Faster release cycles
- **User Experience**: Faster bug fixes due to better error tracking

## 1.5 Documents and Instructions

### Official Documentation
1. **Sentry CLI Configuration**: https://docs.sentry.io/product/cli/configuration/
2. **EAS Build Secrets**: https://docs.expo.dev/build/environment-variables/
3. **React Native Sentry**: https://docs.sentry.io/platforms/react-native/
4. **Source Maps**: https://docs.sentry.io/platforms/react-native/sourcemaps/

### Project-Specific Documents
1. **Error Monitoring Feature**: `/docs/Features/Error_Monitoring_Sentry_feature.md`
2. **iOS Build Guide**: `/docs/ios_build_guide.md`
3. **Tech Stack**: `/docs/tech_stack.md`
4. **Build Commands**: `/docs/Builds/build_commands.md`

### Environment Setup
1. Sentry project: https://sentry.io/organizations/family-compass/projects/family-compass-app/
2. EAS Build dashboard: https://expo.dev/accounts/[username]/projects/family-clean/builds

## 1.6 Fixes checklist

✅ **Authentication Fix**
- [ ] SENTRY_AUTH_TOKEN added to EAS Build secrets
- [ ] Token has correct permissions (project:releases, project:write)
- [ ] Token is valid and not expired

✅ **Build Configuration**
- [ ] EAS build completes iOS archive successfully
- [ ] Source maps are uploaded to Sentry (optional but preferred)
- [ ] Build artifacts are generated correctly

✅ **Fallback Options**
- [ ] Graceful degradation if Sentry upload fails
- [ ] Environment variable for disabling uploads (SENTRY_DISABLE_AUTO_UPLOAD)
- [ ] Alternative: disable source map uploads entirely

✅ **Testing Verification**
- [ ] Local iOS build works
- [ ] EAS Build iOS completes successfully
- [ ] TestFlight build installs and runs
- [ ] No build-time errors in logs

## 1.7 Detailed to-do task list

- [x] **Part A: Immediate Fix - Disable Source Map Uploads** (COMPLETED 2025-05-30)
  - [x] Add SENTRY_DISABLE_AUTO_UPLOAD=true to EAS Build environment
  - [x] Add SENTRY_ALLOW_FAILURE=true for additional safety
  - [x] Update all build profiles (development, preview, production)
  - [x] Document temporary workaround in .env.example

- [ ] **Part B: Proper Authentication Setup** (FUTURE ENHANCEMENT)
  - [ ] Generate new Sentry auth token with correct permissions
  - [ ] Add SENTRY_AUTH_TOKEN to EAS Build secrets
  - [ ] Update ios/sentry.properties if needed
  - [ ] Test token validity locally

- [x] **Part C: Build Configuration** (COMPLETED 2025-05-30)
  - [x] Configure environment variables in eas.json
  - [x] Add fallback handling for missing tokens (SENTRY_ALLOW_FAILURE)
  - [x] Create setup script (scripts/setup-ios-build.sh)
  - [x] Update iOS environment configuration (.xcode.env.local)

- [ ] **Part D: Alternative Solutions** (FUTURE RESEARCH)
  - [ ] Research metro.config.js source map options
  - [ ] Consider post-build upload scripts
  - [ ] Evaluate sentry-expo vs direct sentry integration
  - [ ] Document multiple approaches

- [ ] **Part E: Testing & Validation** (NEXT STEPS)
  - [ ] Run local iOS build with Xcode
  - [ ] Submit EAS Build for iOS
  - [ ] Verify build logs for successful completion
  - [ ] Test on TestFlight
  - [ ] Validate error monitoring still works

- [x] **Part F: Documentation** (COMPLETED 2025-05-30)
  - [x] Update build setup instructions (.env.example)
  - [x] Document environment variable requirements
  - [x] Create troubleshooting guide (sentry_ios_build_error_fixed.md)
  - [x] Update error_fixes.md documentation

## 1.8 Future issues or incompatabilities

### Version Compatibility
- **Sentry CLI Updates**: New versions may change authentication flow
- **EAS Build Changes**: Environment variable handling may change
- **React Native Updates**: Source map generation may change
- **Expo SDK Updates**: Build process modifications

### Security Considerations
- **Token Rotation**: Auth tokens may need periodic renewal
- **Permission Changes**: Sentry permissions may be modified
- **Organization Changes**: Team access may affect token validity
- **Rate Limiting**: API usage limits may be exceeded

### Build Environment
- **EAS Build Updates**: Platform changes may affect environment
- **Node.js Versions**: CLI compatibility with different Node versions
- **Dependency Conflicts**: Other tools may conflict with sentry-cli
- **Build Time Limits**: Upload time may exceed build timeouts

### Monitoring & Alerts
- **Failed Uploads**: Silent failures may reduce error monitoring quality
- **Disk Space**: Source maps may consume significant storage
- **Network Issues**: Upload failures during build process
- **API Deprecation**: Sentry API changes may break integration

## 1.9 Admin Panel Options

### Error Monitoring Dashboard
1. **Build Status Indicator**
   - Show iOS build health status
   - Display last successful build timestamp
   - Alert for consecutive build failures

2. **Source Map Status**
   - Indicate if source maps are being uploaded
   - Show last successful upload
   - Display upload error count

3. **Sentry Integration Health**
   - Connection status to Sentry API
   - Authentication token validity
   - Upload queue size and status

### Configuration Controls
1. **Source Map Upload Toggle**
   - Enable/disable automatic uploads
   - Fallback to local uploads
   - Emergency disable switch

2. **Build Environment Display**
   - Show current environment variables (masked)
   - Display EAS Build configuration
   - Show last build logs (filtered)

3. **Debug Tools**
   - Test Sentry token validity
   - Manual source map upload
   - Build process health check

### Alerts & Notifications
1. **Build Failure Alerts**
   - Email notifications for build failures
   - Slack integration for team notifications
   - Dashboard warning indicators

2. **Monitoring Metrics**
   - Build success rate over time
   - Source map upload success rate
   - Error monitoring coverage percentage

---

**Next Steps**: Begin with Part A (immediate fix) to unblock iOS builds, then proceed with proper authentication setup.