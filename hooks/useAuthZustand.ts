import { useEffect } from 'react';
import { useFamilyStore } from '@/stores/familyStore';
import { User } from '@/types';
import { shallow } from 'zustand/shallow';

/**
 * Zustand-based replacement for useAuth hook
 * Provides the same API as the React Context version for seamless migration
 */
export function useAuth() {
  // Use a single selector with shallow comparison to prevent unnecessary re-renders
  // and ensure function references are stable
  const authData = useFamilyStore(
    (state) => {
      // Defensive check for state existence
      if (!state) {
        console.error('[useAuth] Store state is undefined');
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          signInWithGoogle: () => Promise.resolve(),
          signInAsGuest: () => Promise.resolve(),
          logout: () => Promise.resolve(),
          clearError: () => {},
        };
      }
      
      // Defensive check for auth slice
      if (!state.auth) {
        console.error('[useAuth] Auth slice not found in store:', Object.keys(state));
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          signInWithGoogle: () => Promise.resolve(),
          signInAsGuest: () => Promise.resolve(),
          logout: () => Promise.resolve(),
          clearError: () => {},
        };
      }
      
      return {
        user: state.auth.user,
        isAuthenticated: state.auth.isAuthenticated,
        isLoading: state.auth.isLoading,
        error: state.auth.error,
        signInWithGoogle: state.auth.signInWithGoogle || (() => {
          console.error('[useAuth] signInWithGoogle is undefined');
          return Promise.resolve();
        }),
        signInAsGuest: state.auth.signInAsGuest || (() => {
          console.error('[useAuth] signInAsGuest is undefined');
          return Promise.resolve();
        }),
        logout: state.auth.logout || (() => {
          console.error('[useAuth] logout is undefined');
          return Promise.resolve();
        }),
        clearError: state.auth.clearError || (() => {
          console.error('[useAuth] clearError is undefined');
        }),
      };
    },
    shallow
  );

  // Debug logging only in development to prevent infinite renders
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log('[useAuth] authData:', authData);
      console.log('[useAuth] signInWithGoogle type:', typeof authData.signInWithGoogle);
      
      // Additional debugging for production
      if (typeof authData.signInWithGoogle === 'undefined') {
        console.error('[useAuth] ERROR: signInWithGoogle is undefined!');
        console.log('[useAuth] Full store state:', useFamilyStore.getState());
        console.log('[useAuth] Auth slice:', useFamilyStore.getState().auth);
      }
    }
  }, [authData.signInWithGoogle]); // Only log when the function reference changes

  // Note: checkAuthState is handled by AuthContext, not here
  // This prevents circular updates between context and store

  // Maintain backward compatibility with error as a string
  const errorMessage = authData.error 
    ? (typeof authData.error === 'string' ? authData.error : authData.error.message || 'An error occurred') 
    : null;

  // Provide the same API as the React Context version
  // Use direct store access as fallback if functions are undefined
  const signInWithGoogle = authData.signInWithGoogle || useFamilyStore.getState().auth.signInWithGoogle;
  const signInAsGuest = authData.signInAsGuest || useFamilyStore.getState().auth.signInAsGuest;
  
  return {
    user: authData.user,
    loading: authData.isLoading,
    error: errorMessage,
    authLoading: authData.isLoading, // Alias for compatibility
    signInWithGoogle,
    signInAsGuest,
    logout: authData.logout,
    clearError: authData.clearError,
    isAuthenticated: authData.isAuthenticated,
  };
}

// Type definition for consistency
export type UseAuthReturn = ReturnType<typeof useAuth>;