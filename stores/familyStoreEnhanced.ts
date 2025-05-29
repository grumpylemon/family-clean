// Enhanced Family Store - Zustand Store with Advanced Caching Integration
// Integrates the new cache service for improved performance and offline capabilities

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Zustand with CommonJS fallback for web
const zustand = require('zustand');
const zustandMiddleware = require('zustand/middleware');

const create = zustand.create || zustand.default?.create || zustand;
const { persist, createJSONStorage } = zustandMiddleware;

import { 
  FamilyStore, 
  OfflineAction, 
  NetworkStatus, 
  SyncStatus
} from './types';
import { User, Family, FamilyMember, Chore, Reward } from '@/types';
import { cacheService } from './cacheService';
import { cacheIntegration } from './cacheIntegration';

// Import the existing store to extend it
import { useFamilyStore as useBaseFamilyStore } from './familyStore';

// Enhanced store interface with cache methods
interface EnhancedFamilyStore extends FamilyStore {
  // Cache-aware fetch methods
  fetchFamilyWithCache: (familyId: string) => Promise<void>;
  fetchChoresWithCache: (familyId: string) => Promise<void>;
  fetchRewardsWithCache: (familyId: string) => Promise<void>;
  fetchUserStatsWithCache: (userId: string) => Promise<void>;
  
  // Cache management
  clearAppCache: () => Promise<void>;
  getCacheStats: () => any;
  warmupCache: () => Promise<void>;
}

// Create enhanced store that wraps the base store
export const useFamilyStore = create<EnhancedFamilyStore>()(
  persist(
    (set, get) => ({
      // Spread all existing store properties and methods
      ...useBaseFamilyStore.getState(),
      
      // Enhanced methods with caching
      fetchFamilyWithCache: async (familyId: string) => {
        try {
          // Try to get from cache first
          const cachedResult = await cacheIntegration.getCachedFamily(familyId);
          
          if (cachedResult.success && cachedResult.data) {
            console.log('🗄️ Family data loaded from cache');
            get().setFamily(cachedResult.data);
            
            // If cache is stale, refresh in background
            if (cachedResult.metadata && 
                Date.now() > cachedResult.metadata.expiresAt) {
              console.log('🗄️ Cache is stale, refreshing in background...');
              // Fetch fresh data in background
              // This would call the Firebase service
            }
          } else {
            console.log('🗄️ Cache miss, fetching from network...');
            // Fetch from network
            // const family = await fetchFamilyFromFirebase(familyId);
            // get().setFamily(family);
            // await cacheIntegration.setCachedFamily(familyId, family);
          }
        } catch (error) {
          console.error('🗄️ Error in fetchFamilyWithCache:', error);
        }
      },
      
      fetchChoresWithCache: async (familyId: string) => {
        try {
          // Try cache first
          const cachedResult = await cacheIntegration.getCachedChores(familyId);
          
          if (cachedResult.success && cachedResult.data) {
            console.log('🗄️ Chores loaded from cache');
            get().setChores(cachedResult.data);
            
            // Background refresh if stale
            if (cachedResult.metadata && 
                Date.now() > cachedResult.metadata.expiresAt) {
              console.log('🗄️ Refreshing stale chores cache...');
              // Background fetch
            }
          } else {
            console.log('🗄️ Fetching chores from network...');
            // Network fetch
            // const chores = await fetchChoresFromFirebase(familyId);
            // get().setChores(chores);
            // await cacheIntegration.setCachedChores(familyId, chores);
          }
        } catch (error) {
          console.error('🗄️ Error in fetchChoresWithCache:', error);
        }
      },
      
      fetchRewardsWithCache: async (familyId: string) => {
        try {
          const cachedResult = await cacheIntegration.getCachedRewards(familyId);
          
          if (cachedResult.success && cachedResult.data) {
            console.log('🗄️ Rewards loaded from cache');
            get().setRewards(cachedResult.data);
            
            if (cachedResult.metadata && 
                Date.now() > cachedResult.metadata.expiresAt) {
              console.log('🗄️ Refreshing stale rewards cache...');
              // Background refresh
            }
          } else {
            console.log('🗄️ Fetching rewards from network...');
            // Network fetch
          }
        } catch (error) {
          console.error('🗄️ Error in fetchRewardsWithCache:', error);
        }
      },
      
      fetchUserStatsWithCache: async (userId: string) => {
        try {
          const cachedResult = await cacheIntegration.getCachedUserStats(userId);
          
          if (cachedResult.success && cachedResult.data) {
            console.log('🗄️ User stats loaded from cache');
            // Update user stats in store
            
            if (cachedResult.metadata && 
                Date.now() > cachedResult.metadata.expiresAt) {
              console.log('🗄️ Refreshing stale user stats cache...');
              // Background refresh
            }
          } else {
            console.log('🗄️ Fetching user stats from network...');
            // Network fetch
          }
        } catch (error) {
          console.error('🗄️ Error in fetchUserStatsWithCache:', error);
        }
      },
      
      // Cache management methods
      clearAppCache: async () => {
        console.log('🗄️ Clearing app cache...');
        await cacheService.clear();
        console.log('🗄️ Cache cleared successfully');
      },
      
      getCacheStats: () => {
        return cacheService.getStats();
      },
      
      warmupCache: async () => {
        const state = get();
        const userId = state.user?.uid || null;
        const familyId = state.family?.data.id || null;
        
        await cacheIntegration.warmupCache(userId, familyId);
      },
      
      // Override setChores to also update cache
      setChores: (chores: Chore[]) => {
        const state = get();
        const familyId = state.family?.data.id;
        
        // Call original setChores
        state.setChores(chores);
        
        // Update cache
        if (familyId) {
          cacheIntegration.setCachedChores(familyId, chores);
        }
      },
      
      // Override setFamily to also update cache
      setFamily: (family: Family | null) => {
        const state = get();
        
        // Call original setFamily
        state.setFamily(family);
        
        // Update cache
        if (family) {
          cacheIntegration.setCachedFamily(family.id, family);
        }
      },
      
      // Override setRewards to also update cache
      setRewards: (rewards: Reward[]) => {
        const state = get();
        const familyId = state.family?.data.id;
        
        // Call original setRewards
        state.setRewards(rewards);
        
        // Update cache
        if (familyId) {
          cacheIntegration.setCachedRewards(familyId, rewards);
        }
      },
      
      // Override completeChoreOffline to invalidate cache
      completeChoreOffline: async (choreId: string, completedBy: string) => {
        const state = get();
        
        // Call original method
        await state.completeChoreOffline(choreId, completedBy);
        
        // Invalidate relevant caches
        await cacheIntegration.invalidateCache('CHORE_COMPLETE', { choreId, completedBy });
      }
    }),
    {
      name: 'family-store-enhanced',
      storage,
      version: 2,
      partialize: (state) => ({
        // Persist everything except transient data
        user: state.user,
        family: state.family,
        chores: state.chores,
        rewards: state.rewards,
        pendingActions: state.pendingActions,
        failedActions: state.failedActions,
        lastSyncTime: state.lastSyncTime,
        pendingCompletions: state.pendingCompletions
      })
    }
  )
);

// Initialize cache service on store creation
if (typeof window !== 'undefined') {
  cacheService.init().then(() => {
    console.log('🗄️ Enhanced store with advanced caching initialized');
    
    // Warmup cache if user is logged in
    const state = useFamilyStore.getState();
    if (state.user) {
      state.warmupCache();
    }
  });
}