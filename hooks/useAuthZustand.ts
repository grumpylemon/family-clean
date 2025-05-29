import React from 'react';
import { useFamilyStore } from '@/stores/familyStore';
import { User } from '@/types';

/**
 * Zustand-based replacement for useAuth hook
 * Provides the same API as the React Context version for seamless migration
 */
export function useAuth() {
  const {
    // Auth state
    user,
    isAuthenticated,
    isLoading: loading,
    error,
    
    // Auth actions
    signInWithGoogle,
    signInAsGuest,
    logout: logoutAction,
    clearError,
    
    // Sync state
    checkAuthState,
  } = useFamilyStore((state) => ({
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
    isLoading: state.auth.isLoading,
    error: state.auth.error,
    signInWithGoogle: state.auth.signInWithGoogle,
    signInAsGuest: state.auth.signInAsGuest,
    logout: state.auth.logout,
    clearError: state.auth.clearError,
    checkAuthState: state.auth.checkAuthState,
  }));

  // Check auth state on mount
  React.useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Maintain backward compatibility with error as a string
  const errorMessage = error ? (typeof error === 'string' ? error : error.message || 'An error occurred') : null;

  // Provide the same API as the React Context version
  return {
    user,
    loading,
    error: errorMessage,
    authLoading: loading, // Alias for compatibility
    signInWithGoogle,
    signInAsGuest,
    logout: logoutAction,
    clearError,
    isAuthenticated,
  };
}

// Type definition for consistency
export type UseAuthReturn = ReturnType<typeof useAuth>;