# Firebase Auth Setup for Google Sign-In

## Prerequisites

1. **Firebase Console Configuration**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project: `family-fun-app`
   - Navigate to Authentication → Sign-in method
   - Enable **Google** as a sign-in provider
   - Add your domain to the authorized domains:
     - `family-fun-app.web.app` (should be added by default)
     - `family-fun-app.firebaseapp.com` (should be added by default)
     - Any custom domains you're using

2. **OAuth 2.0 Configuration**
   - In the Google provider settings, you'll see the Web SDK configuration
   - The Web client ID should be automatically configured
   - If not, you may need to:
     - Go to [Google Cloud Console](https://console.cloud.google.com)
     - Select your Firebase project
     - Navigate to APIs & Services → Credentials
     - Ensure the OAuth 2.0 Client ID for Web application exists
     - Add authorized JavaScript origins:
       - `https://family-fun-app.web.app`
       - `https://family-fun-app.firebaseapp.com`
     - Add authorized redirect URIs:
       - `https://family-fun-app.firebaseapp.com/__/auth/handler`

## Common Issues

1. **Error: auth/operation-not-allowed**
   - Google sign-in is not enabled in Firebase Console
   - Solution: Enable Google provider in Authentication → Sign-in method

2. **Error: auth/unauthorized-domain**
   - The domain is not whitelisted for OAuth operations
   - Solution: Add your domain to authorized domains in Firebase Console

3. **Error: auth/popup-blocked**
   - Browser is blocking popups
   - Solution: Allow popups for your domain or use signInWithRedirect

4. **Error: auth/invalid-api-key**
   - Firebase configuration is incorrect
   - Solution: Verify your Firebase config in the .env file

## Testing

1. Open your app at https://family-fun-app.web.app
2. Click "Continue with Google"
3. A popup should appear with Google sign-in
4. After successful authentication, you should be redirected to the dashboard

## Current Status (v2.85)

- ✅ Firebase Auth properly configured for web
- ✅ Web-specific auth service created to avoid bundling issues
- ✅ Error handling improved with specific error messages
- ⚠️ Need to verify Google provider is enabled in Firebase Console
- ⚠️ Need to check if domain is properly authorized

## Next Steps

1. Verify Google sign-in is enabled in Firebase Console
2. Check authorized domains configuration
3. Test with actual Google account
4. If popup is blocked, implement signInWithRedirect as fallback