// Web-specific Firebase Auth Service with direct imports
// This approach ensures Firebase auth functions are available after minification

import { 
  getAuth as firebaseGetAuth,
  signInWithPopup as firebaseSignInWithPopup,
  GoogleAuthProvider as FirebaseGoogleAuthProvider,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  Auth,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';

console.log('authServiceWebDirect loaded - using renamed imports to prevent minification issues');

// Verify functions are available
if (typeof firebaseSignInWithPopup !== 'function') {
  console.error('CRITICAL: firebaseSignInWithPopup is not a function after import!');
  console.error('Type:', typeof firebaseSignInWithPopup);
  console.error('Value:', firebaseSignInWithPopup);
}

// Export wrapped functions for web platform
export const authServiceWebDirect = {
  // Sign in with Google
  async signInWithGoogle(auth: Auth): Promise<UserCredential> {
    console.log('authServiceWebDirect.signInWithGoogle called');
    
    // Double-check function exists
    if (typeof firebaseSignInWithPopup !== 'function') {
      throw new Error('firebaseSignInWithPopup is not a function - Firebase auth not properly loaded');
    }
    
    const provider = new FirebaseGoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      const result = await firebaseSignInWithPopup(auth, provider);
      console.log('Sign in successful');
      return result;
    } catch (error: any) {
      console.error('signInWithGoogle error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Common Firebase Auth errors
      if (error?.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for OAuth operations. Please check Firebase console.');
      } else if (error?.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please enable it in Firebase console.');
      } else if (error?.code === 'auth/invalid-api-key') {
        throw new Error('Invalid Firebase API key.');
      }
      
      throw error;
    }
  },

  // Sign in anonymously
  async signInAnonymously(auth: Auth): Promise<UserCredential> {
    console.log('authServiceWebDirect.signInAnonymously called');
    return await firebaseSignInAnonymously(auth);
  },

  // Sign out
  async signOut(auth: Auth): Promise<void> {
    console.log('authServiceWebDirect.signOut called');
    return await firebaseSignOut(auth);
  },

  // Auth state listener
  onAuthStateChanged(auth: Auth, callback: (user: FirebaseUser | null) => void) {
    console.log('authServiceWebDirect.onAuthStateChanged called');
    return firebaseOnAuthStateChanged(auth, callback);
  }
};

// Also export the renamed functions directly
export { 
  firebaseSignInWithPopup,
  FirebaseGoogleAuthProvider,
  firebaseSignInAnonymously,
  firebaseSignOut,
  firebaseOnAuthStateChanged
};