// Direct browser Firebase Auth imports
// This bypasses Metro's module resolution issues

// Import the browser-specific build directly
import { initializeApp, getApps } from 'firebase/app';
import type { Auth, User as FirebaseUser, UserCredential } from 'firebase/auth';

// These imports will only work in a browser environment
let signInWithPopup: any;
let GoogleAuthProvider: any;
let signInAnonymously: any;
let signOut: any;
let onAuthStateChanged: any;
let getAuth: any;

// Dynamic import for browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Use dynamic import to ensure we get the browser version
  import('firebase/auth').then((firebaseAuth) => {
    signInWithPopup = firebaseAuth.signInWithPopup;
    GoogleAuthProvider = firebaseAuth.GoogleAuthProvider;
    signInAnonymously = firebaseAuth.signInAnonymously;
    signOut = firebaseAuth.signOut;
    onAuthStateChanged = firebaseAuth.onAuthStateChanged;
    getAuth = firebaseAuth.getAuth;
    
    console.log('firebaseAuthBrowser: Loaded browser Firebase Auth functions');
    console.log('Available functions:', Object.keys(firebaseAuth).filter(k => typeof (firebaseAuth as any)[k] === 'function').join(', '));
  }).catch(error => {
    console.error('Failed to load Firebase Auth:', error);
  });
}

// Export wrapper that ensures functions are available
export const firebaseAuthBrowser = {
  async waitForAuth(): Promise<void> {
    // Wait for dynamic imports to complete
    let attempts = 0;
    while (!signInWithPopup && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!signInWithPopup) {
      throw new Error('Firebase Auth failed to load after 5 seconds');
    }
  },

  async signInWithGoogle(auth: Auth): Promise<UserCredential> {
    await this.waitForAuth();
    
    if (!signInWithPopup || !GoogleAuthProvider) {
      throw new Error('Firebase Auth not properly loaded');
    }
    
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      // Try popup first
      console.log('Attempting signInWithPopup...');
      return await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn('signInWithPopup failed, trying redirect method:', error.message);
      
      // If popup fails due to CORS or blocking, fall back to redirect
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.message?.includes('Cross-Origin-Opener-Policy') ||
          error.message?.includes('popup')) {
        
        // Load redirect methods
        const { signInWithRedirect, getRedirectResult } = await import('firebase/auth');
        
        // Check if we're returning from a redirect
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
          console.log('Redirect authentication successful');
          return redirectResult;
        }
        
        // Start redirect flow
        console.log('Starting redirect authentication...');
        await signInWithRedirect(auth, provider);
        
        // This will never return as the page redirects
        throw new Error('Redirect initiated');
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  async signInAnonymously(auth: Auth): Promise<UserCredential> {
    await this.waitForAuth();
    
    if (!signInAnonymously) {
      throw new Error('Firebase Auth not properly loaded');
    }
    
    return signInAnonymously(auth);
  },

  async signOut(auth: Auth): Promise<void> {
    await this.waitForAuth();
    
    if (!signOut) {
      throw new Error('Firebase Auth not properly loaded');
    }
    
    return signOut(auth);
  },

  onAuthStateChanged(auth: Auth, callback: (user: FirebaseUser | null) => void) {
    // For auth state changes, we need to handle the async loading
    if (!onAuthStateChanged) {
      console.warn('onAuthStateChanged not yet loaded, setting up delayed listener');
      
      // Set up the listener once Firebase Auth loads
      const checkInterval = setInterval(() => {
        if (onAuthStateChanged) {
          clearInterval(checkInterval);
          console.log('onAuthStateChanged now available, setting up listener');
          onAuthStateChanged(auth, callback);
        }
      }, 100);
      
      // Return a cleanup function
      return () => {
        clearInterval(checkInterval);
      };
    }
    
    return onAuthStateChanged(auth, callback);
  }
};