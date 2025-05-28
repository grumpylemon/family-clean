import { auth, googleProvider, shouldUseMock } from '@/config/firebase';
import { GoogleAuthProvider, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Version to confirm updates (v6)
console.log("AuthContext version: v6");

// Define the shape of the auth context
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  logout: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps app and provides auth context
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start with no user and let the auth state listener handle initialization
  const isMockMode = shouldUseMock();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up auth state listener
  useEffect(() => {
    console.log(`Auth initialization, Platform: ${Platform.OS}, Mock mode: ${isMockMode}`);
    
    let unsubscribe = () => {};
    
    if (isMockMode) {
      // For mock mode, auto-sign in as guest after a short delay
      console.log("Setting up mock auth state listener - auto-signing in as guest");
      
      const autoSignIn = async () => {
        try {
          // Auto-sign in as guest in mock mode
          await signInAsGuest();
        } catch (error) {
          console.error("Auto-sign in failed in mock mode:", error);
          setLoading(false);
        }
      };
      
      // Auto-sign in after a short delay
      const timer = setTimeout(autoSignIn, 500);
      
      // Return cleanup function
      return () => clearTimeout(timer);
    }
    
    try {
      console.log("Setting up auth state listener");
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
        setUser(currentUser);
        setLoading(false);
      });
    } catch (err) {
      console.error("Error setting up auth state listener:", err);
      setLoading(false);
    }

    // Clean up subscription
    return unsubscribe;
  }, [isMockMode]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Attempting Google sign in on ${Platform.OS}, mock mode: ${isMockMode}`);
      
      if (isMockMode) {
        // Create a mock user for Google sign in
        console.log("Using mock Google sign in");
        const mockUser = {
          uid: 'google-user-123',
          email: 'user@gmail.com',
          displayName: 'Google User',
          photoURL: 'https://via.placeholder.com/150',
          emailVerified: true,
          isAnonymous: false,
          providerId: 'google.com',
          refreshToken: 'mock-refresh-token',
          accessToken: 'mock-access-token',
          metadata: {},
          providerData: [],
          tenantId: null
        } as unknown as User;
        
        setUser(mockUser);
        console.log("Mock Google sign in completed with mock user");
      } else {
        // For web with valid Firebase config
        try {
          const result = await signInWithPopup(auth, googleProvider as GoogleAuthProvider);
          console.log("Google sign in successful", result.user ? "with user" : "but no user returned");
        } catch (authError) {
          console.error("Error during Google sign in:", authError);
          throw authError;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Google sign in error:', err);
      
      if (errorMessage.includes('api-key-not-valid')) {
        setError('Firebase API key is not valid. Please update your Firebase configuration.');
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        setError('Firebase authentication failed. Please check your Firebase configuration.');
      } else {
        setError(`Sign in failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in anonymously
  const signInAsGuest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Signing in as guest, mock mode:", isMockMode);
      
      if (isMockMode) {
        // Create a mock guest user
        console.log("Using mock anonymous sign in");
        const mockGuestUser = {
          uid: 'guest-admin-user',
          email: 'guest@familyclean.app',
          displayName: 'John Smith',
          photoURL: null,
          emailVerified: false,
          isAnonymous: true,
          providerId: 'anonymous',
          refreshToken: 'mock-refresh-token',
          accessToken: 'mock-access-token',
          metadata: {},
          providerData: [],
          tenantId: null
        } as unknown as User;
        
        setUser(mockGuestUser);
        console.log("Mock anonymous sign in completed with John Smith test user");
      } else {
        // Try real anonymous auth
        try {
          const result = await signInAnonymously(auth);
          console.log("Anonymous sign in successful", result.user ? "with user" : "but no user returned");
          
          // Add display name if needed
          if (result.user && !result.user.displayName) {
            Object.defineProperty(result.user, 'displayName', {
              value: 'Guest Admin',
              writable: true
            });
          }
        } catch (authError) {
          console.error("Error during anonymous sign in:", authError);
          throw authError;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Anonymous sign in error:', err);
      
      if (errorMessage.includes('api-key-not-valid')) {
        setError('Firebase API key is not valid. Please update your Firebase configuration.');
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        setError('Firebase authentication failed. Please check your Firebase configuration.');
      } else {
        setError(`Guest sign in failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Signing out...");
      
      if (isMockMode) {
        // For mock mode, just clear the user state
        console.log("Mock sign out");
        setUser(null);
      } else {
        // Use Firebase signOut for real mode
        await signOut(auth);
      }
      
    } catch (err) {
      setError(`Sign out failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 