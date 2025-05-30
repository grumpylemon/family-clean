// Web-specific Firebase Auth Service
// This file imports Firebase Auth functions directly for web platform

// Use namespace import to ensure proper bundling
import * as firebaseAuth from 'firebase/auth';

// Re-export types for convenience
type Auth = firebaseAuth.Auth;
type FirebaseUser = firebaseAuth.User;
type UserCredential = firebaseAuth.UserCredential;

console.log('authServiceWeb loaded - using direct Firebase imports');
console.log('Firebase auth module loaded:', Object.keys(firebaseAuth).filter(k => typeof firebaseAuth[k] === 'function').join(', '));

// Export wrapped functions for web platform
export const authServiceWeb = {
  // Sign in with Google
  async signInWithGoogle(auth: Auth): Promise<UserCredential> {
    console.log('authServiceWeb.signInWithGoogle called');
    
    // Verify functions exist
    if (!firebaseAuth.signInWithPopup || typeof firebaseAuth.signInWithPopup !== 'function') {
      console.error('signInWithPopup not found or not a function');
      console.error('Available auth functions:', Object.keys(firebaseAuth).filter(k => typeof firebaseAuth[k] === 'function'));
      throw new Error('signInWithPopup is not available in firebase/auth module');
    }
    
    const provider = new firebaseAuth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      const result = await firebaseAuth.signInWithPopup(auth, provider);
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
    console.log('authServiceWeb.signInAnonymously called');
    return await firebaseAuth.signInAnonymously(auth);
  },

  // Sign out
  async signOut(auth: Auth): Promise<void> {
    console.log('authServiceWeb.signOut called');
    return await firebaseAuth.signOut(auth);
  },

  // Auth state listener
  onAuthStateChanged(auth: Auth, callback: (user: FirebaseUser | null) => void) {
    console.log('authServiceWeb.onAuthStateChanged called');
    return firebaseAuth.onAuthStateChanged(auth, callback);
  }
};