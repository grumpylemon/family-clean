// Family Store - Main Zustand Store with Offline-First Architecture
// Combines all slices for complete state management

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use dynamic imports to handle different module systems
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
    }
  )
);