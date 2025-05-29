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
  const initializeStore = useFamilyStore(state => state.calculateCacheSize);

  useEffect(() => {
    console.log('🏪 StoreProvider: Initializing Zustand store');
    
    // Initialize network monitoring
    networkService.init();
    
    // Calculate initial cache size
    initializeStore();
    
    // Platform-specific initialization
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform detected - using localStorage persistence');
    } else {
      console.log('📱 Mobile platform detected - using AsyncStorage persistence');
    }
    
    // Cleanup on unmount
    return () => {
      networkService.cleanup();
    };
  }, [initializeStore]);

  return <>{children}</>;
}

// Hook to integrate with existing AuthContext
export function useAuthContextIntegration() {
  const { setUser, setLoading, setError } = useFamilyStore();
  
  // This will be called by the existing AuthContext to sync user state
  const syncUserWithStore = (user: any, loading: boolean, error: string | null) => {
    setUser(user);
    setLoading(loading);
    setError(error);
  };
  
  return { syncUserWithStore };
}

// Hook to integrate with existing FamilyContext  
export function useFamilyContextIntegration() {
  const { 
    setFamily, 
    setUserProfile, 
    setLoading, 
    setError,
    updateMemberOptimistically 
  } = useFamilyStore();
  
  // This will be called by the existing FamilyContext to sync family state
  const syncFamilyWithStore = (
    family: any, 
    userProfile: any, 
    loading: boolean, 
    error: string | null
  ) => {
    setFamily(family);
    setUserProfile(userProfile);
    setLoading(loading);
    setError(error);
  };
  
  return { 
    syncFamilyWithStore,
    updateMemberOptimistically 
  };
}