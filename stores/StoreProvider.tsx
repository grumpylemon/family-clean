// Store Provider - Zustand integration component
// Provides compatibility layer and initialization for the Zustand store

import React, { useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useFamilyStore } from './familyStore';
import { networkService } from './networkService';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  useEffect(() => {
    // Defer initialization to prevent render conflicts
    const timeoutId = setTimeout(() => {
      console.log('🏪 StoreProvider: Initializing Zustand store');
      
      // Initialize network monitoring
      networkService.init();
      
      // Platform-specific initialization
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected - using localStorage persistence');
      } else {
        console.log('📱 Mobile platform detected - using AsyncStorage persistence');
      }
    }, 0);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      networkService.cleanup();
    };
  }, []);

  return <>{children}</>;
}

// Hook to integrate with existing AuthContext
export function useAuthContextIntegration() {
  // This will be called by the existing AuthContext to sync user state
  const syncUserWithStore = (user: any, loading: boolean, error: string | null) => {
    // Defer store updates to prevent render conflicts
    setTimeout(() => {
      useFamilyStore.setState((state) => ({
        auth: {
          ...state.auth,
          user,
          isAuthenticated: !!user,
          isLoading: loading,
          error
        }
      }));
    }, 0);
  };
  
  return { syncUserWithStore };
}

// Hook to integrate with existing FamilyContext  
export function useFamilyContextIntegration() {
  // This will be called by the existing FamilyContext to sync family state
  const syncFamilyWithStore = (
    family: any, 
    userProfile: any, 
    loading: boolean, 
    error: string | null
  ) => {
    // Update family slice state directly
    useFamilyStore.setState((state) => ({
      family: {
        ...state.family,
        family,
        currentMember: userProfile,
        isLoading: loading,
        error
      }
    }));
  };
  
  return { 
    syncFamilyWithStore,
    updateMemberOptimistically: () => {} // Placeholder for now
  };
}