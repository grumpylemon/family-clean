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
let authLoadPromise: Promise<void> | null = null;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Use dynamic import to ensure we get the browser version
  authLoadPromise = import('firebase/auth').then((firebaseAuth) => {
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
    // Re-throw to ensure promise rejection is handled
    throw error;
  });
  
  // Handle any unhandled promise rejections
  authLoadPromise.catch(error => {
    console.error('Unhandled Firebase Auth loading error:', error);
  });
}

// Export wrapper that ensures functions are available
export const firebaseAuthBrowser = {
  async waitForAuth(): Promise<void> {
    // If we have a promise, wait for it to complete
    if (authLoadPromise) {
      try {
        await authLoadPromise;
      } catch (error) {
        console.error('Firebase Auth loading failed:', error);
        throw new Error('Firebase Auth failed to load');
      }
    }
    
    // Additional safety check
    if (!signInWithPopup) {
      // Wait for dynamic imports to complete
      let attempts = 0;
      while (!signInWithPopup && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (!signInWithPopup) {
        throw new Error('Firebase Auth failed to load after 5 seconds');
      }
    }
  },

  async signInWithGoogle(auth: Auth): Promise<UserCredential> {
    await this.waitForAuth();
    
    if (!GoogleAuthProvider) {
      throw new Error('Firebase Auth not properly loaded');
    }
    
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    // Try popup first, fall back to redirect on failure
    // This provides better UX for desktop users
    try {
      console.log('Attempting Google sign in with popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Popup authentication successful');
      return result;
    } catch (popupError: any) {
      console.log('Popup failed, trying redirect...', popupError?.code);
      
      // If popup was blocked or failed, use redirect as fallback
      const { signInWithRedirect, getRedirectResult } = await import('firebase/auth');
      
      try {
        // First check if we're returning from a redirect
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult) {
          console.log('Redirect authentication successful');
          return redirectResult;
        }
      } catch (error) {
        // Ignore redirect check errors
      }
      
      console.log('Starting Google authentication with redirect...');
      await signInWithRedirect(auth, provider);
      
      // This will never return as the page redirects
      throw new Error('Redirect initiated');
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
      // Silently wait for auth to load - this is normal during initialization
      
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