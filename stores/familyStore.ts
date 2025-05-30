// Family Store - Main Zustand Store with Offline-First Architecture
// Combines all slices for complete state management

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Zustand v4 which doesn't use import.meta
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { FamilyStore } from './types';
import { createAuthSlice } from './authSlice';
import { createFamilySlice } from './familySlice';
import { createOfflineSlice } from './offlineSlice';
import { createChoreSlice } from './choreSlice';
import { createRewardSlice } from './rewardSlice';

// Platform-specific storage
const storage = Platform.OS === 'web' 
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => AsyncStorage);

// Create the combined store
export const useFamilyStore = create<FamilyStore>()(
  persist(
    (...args) => ({
      // Combine all slices
      ...createAuthSlice(...args),
      ...createFamilySlice(...args),
      ...createOfflineSlice(...args),
      ...createChoreSlice(...args),
      ...createRewardSlice(...args),
      
      // Additional methods for cache management
      calculateCacheSize: () => {
        try {
          const state = JSON.stringify(args[0]());
          return new TextEncoder().encode(state).length;
        } catch (error) {
          console.error('Failed to calculate cache size:', error);
          return 0;
        }
      },
      
      cleanupCache: () => {
        console.log('Cache cleanup requested');
        // This would be implemented with actual cache cleanup logic
      },
      
      invalidateCache: () => {
        console.log('Cache invalidation requested');
        // This would trigger a full data refresh
      },
      
      reset: () => {
        args[1](() => ({
          ...createAuthSlice(...args),
          ...createFamilySlice(...args),
          ...createOfflineSlice(...args),
          ...createChoreSlice(...args),
          ...createRewardSlice(...args),
        }));
      },
    }),
    {
      name: 'family-store',
      storage,
      // Persist only essential data
      partialize: (state) => ({
        // Auth data (excluding loading states)
        auth: {
          user: state.auth.user,
          isAuthenticated: state.auth.isAuthenticated
        },
        // Cached family data
        family: {
          family: state.family.family,
          members: state.family.members,
          currentMember: state.family.currentMember,
          isAdmin: state.family.isAdmin
        },
        // Offline queue
        offline: {
          pendingActions: state.offline.pendingActions,
          failedActions: state.offline.failedActions,
          lastSyncTime: state.offline.lastSyncTime
        },
        // Cached chore data
        chores: {
          chores: state.chores.chores,
          pendingCompletions: state.chores.pendingCompletions,
          filter: state.chores.filter
        },
        // Cached reward data
        rewards: {
          rewards: state.rewards.rewards,
          redemptionHistory: state.rewards.redemptionHistory
        }
      }),
      // Version for migrations
      version: 1,
      // Skip hydration on SSR
      skipHydration: typeof window === 'undefined',
      // Custom merge function to ensure actions are not lost during hydration
      merge: (persistedState, currentState) => {
        // Deep merge that preserves functions
        const merged = { ...currentState };
        
        // Merge auth slice carefully to preserve actions
        if (persistedState && (persistedState as any).auth) {
          merged.auth = {
            ...currentState.auth, // Keep all functions
            // Only override state values
            user: (persistedState as any).auth.user || currentState.auth.user,
            isAuthenticated: (persistedState as any).auth.isAuthenticated !== undefined 
              ? (persistedState as any).auth.isAuthenticated 
              : currentState.auth.isAuthenticated
          };
        }
        
        // Merge family slice - preserve actions
        if (persistedState && (persistedState as any).family) {
          merged.family = {
            ...currentState.family, // Keep all functions
            // Only override state values
            family: (persistedState as any).family.family || currentState.family.family,
            members: (persistedState as any).family.members || currentState.family.members,
            currentMember: (persistedState as any).family.currentMember || currentState.family.currentMember,
            isAdmin: (persistedState as any).family.isAdmin !== undefined 
              ? (persistedState as any).family.isAdmin 
              : currentState.family.isAdmin
          };
        }
        
        // Merge offline slice - preserve actions
        if (persistedState && (persistedState as any).offline) {
          merged.offline = {
            ...currentState.offline, // Keep all functions
            // Only override state values
            pendingActions: (persistedState as any).offline.pendingActions || currentState.offline.pendingActions,
            failedActions: (persistedState as any).offline.failedActions || currentState.offline.failedActions,
            lastSyncTime: (persistedState as any).offline.lastSyncTime || currentState.offline.lastSyncTime
          };
        }
        
        // Merge chores slice - preserve actions
        if (persistedState && (persistedState as any).chores) {
          merged.chores = {
            ...currentState.chores, // Keep all functions
            // Only override state values
            chores: (persistedState as any).chores.chores || currentState.chores.chores,
            pendingCompletions: (persistedState as any).chores.pendingCompletions || currentState.chores.pendingCompletions,
            filter: (persistedState as any).chores.filter || currentState.chores.filter
          };
        }
        
        // Merge rewards slice - preserve actions
        if (persistedState && (persistedState as any).rewards) {
          merged.rewards = {
            ...currentState.rewards, // Keep all functions
            // Only override state values
            rewards: (persistedState as any).rewards.rewards || currentState.rewards.rewards,
            redemptionHistory: (persistedState as any).rewards.redemptionHistory || currentState.rewards.redemptionHistory
          };
        }
        
        return merged;
      },
    }
  )
);

// Initialize NetworkService with callback-based integration
setTimeout(() => {
  try {
    const { networkService } = require('./networkService');
    
    // Set up callback for network status updates
    networkService.setStatusUpdateCallback((isOnline: boolean) => {
      useFamilyStore.setState((state) => ({
        offline: {
          ...state.offline,
          isOnline,
          networkStatus: isOnline ? 'online' : 'offline'
        }
      }));
    });
    
    console.log('🌐 NetworkService: Callback integration set successfully');
  } catch (error) {
    console.warn('🌐 NetworkService: Failed to set callback integration', error);
  }
}, 100);