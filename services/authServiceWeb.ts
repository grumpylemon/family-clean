// Web-specific Firebase Auth Service
// This file imports Firebase Auth functions directly for web platform

import { 
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  Auth,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';

console.log('authServiceWeb loaded - using direct Firebase imports');

// Export wrapped functions for web platform
export const authServiceWeb = {
  // Sign in with Google
  async signInWithGoogle(auth: Auth): Promise<UserCredential> {
    console.log('authServiceWeb.signInWithGoogle called');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      const result = await signInWithPopup(auth, provider);
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
    return await signInAnonymously(auth);
  },

  // Sign out
  async signOut(auth: Auth): Promise<void> {
    console.log('authServiceWeb.signOut called');
    return await signOut(auth);
  },

  // Auth state listener
  onAuthStateChanged(auth: Auth, callback: (user: FirebaseUser | null) => void) {
    console.log('authServiceWeb.onAuthStateChanged called');
    return onAuthStateChanged(auth, callback);
  }
};