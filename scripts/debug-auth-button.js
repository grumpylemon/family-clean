#!/usr/bin/env node

/**
 * Debug script to test Google sign-in button functionality
 * This script will help identify where the authentication flow is breaking
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Authentication Button Debug Script');
console.log('=====================================\n');

// 1. Check if the login component has the button properly configured
console.log('1. Checking login component button configuration...');
const loginPath = path.join(__dirname, '../app/login.tsx');
if (fs.existsSync(loginPath)) {
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  
  // Check for button configuration
  const hasGoogleButton = loginContent.includes('handleGoogleSignIn');
  const hasOnPress = loginContent.includes('onPress={handleGoogleSignIn}');
  const hasDisabled = loginContent.includes('disabled={loading}');
  
  console.log('   ✓ handleGoogleSignIn function defined:', hasGoogleButton);
  console.log('   ✓ onPress handler connected:', hasOnPress);
  console.log('   ✓ Button disabled check:', hasDisabled);
  
  // Look for any obvious issues
  if (loginContent.includes('onPress={handleGoogleSignIn}') && loginContent.includes('disabled={loading}')) {
    console.log('   ✅ Button appears properly configured');
  } else {
    console.log('   ❌ Button configuration issue detected');
  }
} else {
  console.log('   ❌ Login component not found');
}

// 2. Check if the auth slice has the signInWithGoogle method
console.log('\n2. Checking auth slice signInWithGoogle method...');
const authSlicePath = path.join(__dirname, '../stores/authSlice.ts');
if (fs.existsSync(authSlicePath)) {
  const authSliceContent = fs.readFileSync(authSlicePath, 'utf8');
  
  const hasSignInMethod = authSliceContent.includes('signInWithGoogle: async');
  const hasConsoleLog = authSliceContent.includes('[AuthSlice] signInWithGoogle called');
  const hasAuthService = authSliceContent.includes('authService.signInWithGoogle');
  
  console.log('   ✓ signInWithGoogle method defined:', hasSignInMethod);
  console.log('   ✓ Debug logging present:', hasConsoleLog);
  console.log('   ✓ Uses authService:', hasAuthService);
  
  if (hasSignInMethod && hasConsoleLog && hasAuthService) {
    console.log('   ✅ Auth slice appears properly configured');
  } else {
    console.log('   ❌ Auth slice configuration issue detected');
  }
} else {
  console.log('   ❌ Auth slice not found');
}

// 3. Check if the authService has the Google sign-in implementation
console.log('\n3. Checking authService Google sign-in implementation...');
const authServicePath = path.join(__dirname, '../services/authService.ts');
if (fs.existsSync(authServicePath)) {
  const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
  
  const hasSignInMethod = authServiceContent.includes('async signInWithGoogle(auth: Auth)');
  const hasConsoleLog = authServiceContent.includes('authService.signInWithGoogle called');
  const hasBrowserCheck = authServiceContent.includes('Platform.OS === \'web\'');
  const hasFirebaseAuth = authServiceContent.includes('firebaseAuthBrowser');
  
  console.log('   ✓ signInWithGoogle method defined:', hasSignInMethod);
  console.log('   ✓ Debug logging present:', hasConsoleLog);
  console.log('   ✓ Platform check for web:', hasBrowserCheck);
  console.log('   ✓ Uses browser auth service:', hasFirebaseAuth);
  
  if (hasSignInMethod && hasConsoleLog && hasBrowserCheck && hasFirebaseAuth) {
    console.log('   ✅ AuthService appears properly configured');
  } else {
    console.log('   ❌ AuthService configuration issue detected');
  }
} else {
  console.log('   ❌ AuthService not found');
}

// 4. Check if the browser auth service exists and is configured
console.log('\n4. Checking firebaseAuthBrowser implementation...');
const browserAuthPath = path.join(__dirname, '../services/firebaseAuthBrowser.ts');
if (fs.existsSync(browserAuthPath)) {
  const browserAuthContent = fs.readFileSync(browserAuthPath, 'utf8');
  
  const hasSignInMethod = browserAuthContent.includes('async signInWithGoogle(auth: Auth)');
  const hasPopupAttempt = browserAuthContent.includes('signInWithPopup(auth, provider)');
  const hasRedirectFallback = browserAuthContent.includes('signInWithRedirect');
  const hasConsoleLog = browserAuthContent.includes('Attempting Google sign in with popup');
  
  console.log('   ✓ signInWithGoogle method defined:', hasSignInMethod);
  console.log('   ✓ Popup attempt present:', hasPopupAttempt);
  console.log('   ✓ Redirect fallback present:', hasRedirectFallback);
  console.log('   ✓ Debug logging present:', hasConsoleLog);
  
  if (hasSignInMethod && hasPopupAttempt && hasRedirectFallback && hasConsoleLog) {
    console.log('   ✅ Browser auth service appears properly configured');
  } else {
    console.log('   ❌ Browser auth service configuration issue detected');
  }
} else {
  console.log('   ❌ Browser auth service not found');
}

// 5. Check if the useAuth hook is properly wired
console.log('\n5. Checking useAuth hook implementation...');
const useAuthPath = path.join(__dirname, '../hooks/useAuthZustand.ts');
if (fs.existsSync(useAuthPath)) {
  const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
  
  const hasSignInMethod = useAuthContent.includes('signInWithGoogle');
  const hasStoreFallback = useAuthContent.includes('useFamilyStore.getState().auth.signInWithGoogle');
  const hasDefensiveCheck = useAuthContent.includes('signInWithGoogle is undefined');
  
  console.log('   ✓ signInWithGoogle method exposed:', hasSignInMethod);
  console.log('   ✓ Store fallback present:', hasStoreFallback);
  console.log('   ✓ Defensive error checking:', hasDefensiveCheck);
  
  if (hasSignInMethod && hasStoreFallback && hasDefensiveCheck) {
    console.log('   ✅ useAuth hook appears properly configured');
  } else {
    console.log('   ❌ useAuth hook configuration issue detected');
  }
} else {
  console.log('   ❌ useAuth hook not found');
}

// 6. Suggest debugging steps
console.log('\n🔧 Debugging Recommendations:');
console.log('=============================');
console.log('1. Add console.log at the START of handleGoogleSignIn in login.tsx');
console.log('2. Add console.log to check if signInWithGoogle function exists');
console.log('3. Check browser console for JavaScript errors');
console.log('4. Verify TouchableOpacity is not being intercepted by parent views');
console.log('5. Test with both guest sign-in to see if button handlers work');
console.log('6. Check if loading state is preventing button clicks');

// 7. Generate a test patch
console.log('\n📝 Creating debug patch for login component...');
const debugPatch = `
// Add this to the handleGoogleSignIn function in login.tsx:
const handleGoogleSignIn = async () => {
  console.log('🔥 BUTTON CLICKED - handleGoogleSignIn called');
  console.log('🔥 signInWithGoogle function:', typeof signInWithGoogle);
  console.log('🔥 loading state:', loading);
  console.log('🔥 user state:', user);
  
  try {
    console.log('🔥 About to call signInWithGoogle...');
    await signInWithGoogle();
    console.log('🔥 signInWithGoogle completed');
  } catch (err) {
    console.error('🔥 signInWithGoogle error:', err);
  }
};
`;

const debugPatchPath = path.join(__dirname, '../debug-login-patch.txt');
fs.writeFileSync(debugPatchPath, debugPatch);
console.log('   ✅ Debug patch saved to:', debugPatchPath);

console.log('\n✨ Debug script completed!');
console.log('Next steps:');
console.log('1. Apply the debug patch to see where the flow breaks');
console.log('2. Check browser console for the 🔥 debug messages');
console.log('3. If no 🔥 messages appear, the button click is not registering');