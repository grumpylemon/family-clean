import { auth, googleProvider, mockUser, shouldUseMock } from '@/config/firebase';
import { GoogleAuthProvider, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Version to confirm updates (v5)
console.log("AuthContext version: v5");

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
  // For iOS, start with a mock user for smoother experience
  const isMockMode = shouldUseMock();
  const initialUser = (isMockMode && Platform.OS === 'ios') ? mockUser as unknown as User : null;
  
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);

  // Set up auth state listener
  useEffect(() => {
    console.log(`Auth initialization, Platform: ${Platform.OS}, Mock mode: ${isMockMode}`);
    
    // For iOS with mock mode, we can skip the auth listener setup
    if (isMockMode && Platform.OS === 'ios') {
      console.log("Using pre-initialized mock user for iOS");
      setLoading(false);
      return () => {};
    }
    
    let unsubscribe = () => {};
    
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
        // Use mock authentication for iOS or when Firebase config is not set
        console.log("Using mock Google sign in");
        // Wait a bit to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set the mock user directly - this works because we're in mock mode
        // In a real app with proper Firebase config, we'd use the proper Firebase auth methods
        setUser(mockUser as unknown as User);
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
        // Use mock authentication
        console.log("Using mock anonymous sign in");
        // Wait a bit to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set the mock user directly with anonymous flag
        const anonymousUser = {
          ...mockUser,
          displayName: 'Guest User',
          isAnonymous: true
        };
        setUser(anonymousUser as unknown as User);
      } else {
        // Try real anonymous auth
        try {
          const result = await signInAnonymously(auth);
          console.log("Anonymous sign in successful", result.user ? "with user" : "but no user returned");
          
          // Add display name if needed
          if (result.user && !result.user.displayName) {
            Object.defineProperty(result.user, 'displayName', {
              value: 'Guest User',
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
      
      if (isMockMode) {
        // Just clear the user state for mock mode
        console.log("Mock logout");
        setUser(null);
      } else {
        // Real Firebase signOut
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