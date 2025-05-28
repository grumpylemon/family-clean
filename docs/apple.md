# Apple Developer Information

## Team Information
- Team ID: 87699862N5
- Apple ID: chris@grumpylemon.com

## App Configuration
- Bundle ID: com.grumpylemon.familyclean
- App Name: Family Clean
- SKU: family-clean-001

## App Store Connect
- App ID: 6746467670

## Important URLs
- Apple Developer Portal: https://developer.apple.com
- App Store Connect: https://appstoreconnect.apple.com
- Certificates, Identifiers & Profiles: https://developer.apple.com/account/resources/

## Build Information
- Current Version: 1.0.0
- Current Build Number: 1

## Notes
- Bundle ID format: reverse domain notation (com.companyname.appname)
- SKU: internal tracking ID, not visible to users
- Bundle ID cannot be changed after app creation

## Quick Reference
- Team ID: 87699862N5
- Bundle ID: com.grumpylemon.familyclean
- App Store Connect ID: 6746467670
- SKU: family-clean-001

## EAS Build Commands
```bash
# Configure credentials
eas credentials

# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest
```