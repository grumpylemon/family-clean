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
  console.log('=== STORE PROVIDER COMPONENT MOUNTING ===');
  console.log('Platform.OS:', Platform.OS);
  
  useEffect(() => {
    console.log('=== STORE PROVIDER EFFECT STARTING ===');
    // Check if store was already initialized
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).__storeInitialized) {
      console.log('🏪 StoreProvider: Store already initialized, skipping');
      return;
    }
    
    console.log('🏪 StoreProvider: Marking store as initialized');
    // Mark store as initialized
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      (window as any).__storeInitialized = true;
    }
    
    // Defer initialization to prevent render conflicts
    const timeoutId = setTimeout(() => {
      console.log('🏪 StoreProvider: Initializing Zustand store');
      
      // Verify store is properly initialized
      try {
        const store = useFamilyStore.getState();
        console.log('🏪 StoreProvider: Store initialized with slices:', Object.keys(store));
        
        // Verify auth slice
        if (!store.auth) {
          console.error('🏪 StoreProvider: Auth slice missing!');
          console.log('🏪 StoreProvider: Available keys:', Object.keys(store));
        } else {
          console.log('🏪 StoreProvider: Auth slice found with methods:', Object.keys(store.auth));
        }
        
        // Verify family slice
        if (!store.family) {
          console.error('🏪 StoreProvider: Family slice missing!');
        } else {
          console.log('🏪 StoreProvider: Family slice found with methods:', Object.keys(store.family));
        }
        
        // Initialize network monitoring
        networkService.init();
        
        // Initialize authentication state listener
        if (store.auth && store.auth.checkAuthState) {
          console.log('🏪 StoreProvider: Starting auth state listener');
          store.auth.checkAuthState().catch(error => {
            console.error('🏪 StoreProvider: Error checking auth state:', error);
          });
        } else {
          console.error('🏪 StoreProvider: checkAuthState not found');
        }
      } catch (error) {
        console.error('🏪 StoreProvider: Failed to initialize store:', error);
      }
      
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
      // Reset initialization flags for hot reload
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        (window as any).__storeInitialized = false;
        (window as any).__authUnsubscribe = null;
      }
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