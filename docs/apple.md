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
```Team ID: 87699862N5

Project Credentials Configuration

Project                   @grumpylemon/family-chores
Bundle Identifier         com.grumpylemon.familyclean
                          
App Store Configuration   
                          
Distribution Certificate  
Serial Number             2A396F5F1E92B3B5611D85413CB430BF
Expiration Date           Wed, 27 May 2026 23:26:34 EDT
Apple Team                87699862N5 (Christian Stoehr (Individual))
Updated                   12 seconds ago
                          
Provisioning Profile      
Developer Portal ID       RLLZ7B64UA
Status                    active
Expiration                Wed, 27 May 2026 23:26:34 EDT
Apple Team                87699862N5 (Christian Stoehr (Individual))
Updated                   0 second ago
                          
All credentials are ready to build @grumpylemon/family-chores (com.grumpylemon.familyclean)

Your binary has been successfully uploaded to App Store Connect!
- It is now being processed by Apple - you will receive an email when the processing finishes.
- It usually takes about 5-10 minutes depending on how busy Apple servers are.
- When it's done, you can see your build here: https://appstoreconnect.apple.com/apps/6746467670/testflight/ios


ow to Test Your App on iPhone

  Step 1: Download TestFlight

  1. On your iPhone, go to the App Store
  2. Search for "TestFlight" (it's Apple's official beta testing app)
  3. Download and install TestFlight (it's free)

  Step 2: Wait for Processing

  1. Wait for Apple's email saying "Your build is ready to test" (5-10 minutes)
  2. The email will come to: mailto:chris@grumpylemon.com

  Step 3: Add Yourself as a Tester

  Once you get the email that processing is complete:
  1. Go to https://appstoreconnect.apple.com/apps/6746467670/testflight/ios on your computer
  2. Click on "Internal Testing" in the left sidebar
  3. Create a new Internal Group (e.g., "Developers")
  4. Add your email (mailto:chris@grumpylemon.com) as a tester
  5. Add the build to this group

  Step 4: Accept the Invite on iPhone

  1. Check your email on your iPhone
  2. You'll get an invite from TestFlight
  3. Tap "View in TestFlight" in the email
  4. This will open TestFlight app
  5. Tap "Accept" and then "Install"

  Alternative: Redeem Code

  If you don't get an email:
  1. In App Store Connect, go to your Internal Testing group
  2. You'll see a redemption code
  3. Open TestFlight on your iPhone
  4. Tap "Redeem" and enter the code

  🎯 Quick Summary

  1. Download TestFlight app on your iPhone (from App Store)
  2. Wait for Apple's email (5-10 minutes)
  3. Add yourself as internal tester in App Store Connect
  4. Accept invite in TestFlight app on your iPhone
  5. Install and test your app!


   iOS Build & Deploy Commands:

  1. Build iOS App:

  eas build --platform ios

  2. Submit to App Store (after build completes):

  eas submit --platform ios

  Alternative Build Profiles:

  # Preview build (internal testing)
  eas build --platform ios --profile preview

  # Development build (for Expo Go alternative)
  eas build --platform ios --profile development

  Current Status:

  - ✅ Web deployed: https://family-fun-app.web.app (live with pink