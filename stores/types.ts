// Zustand Store Types for Family Clean App
// Enhanced offline-first architecture with Zustand

import { User, Family, FamilyMember, Chore, Reward, RewardRedemption } from '@/types';
import { AuthSlice } from './authSlice';
import { FamilySlice } from './familySlice';

// Network connectivity states
export type NetworkStatus = 'online' | 'offline' | 'syncing';

// Offline action types for queuing operations when offline
export type OfflineActionType = 
  | 'COMPLETE_CHORE'
  | 'CREATE_CHORE' 
  | 'UPDATE_CHORE'
  | 'DELETE_CHORE'
  | 'REDEEM_REWARD'
  | 'UPDATE_MEMBER'
  | 'UPDATE_FAMILY'
  | 'CLAIM_CHORE'
  | 'TAKEOVER_CHORE'
  | 'CREATE_HELP_REQUEST'
  | 'CREATE_TRADE_PROPOSAL';

// Offline action queue item
export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: any;
  timestamp: number;
  userId: string;
  familyId?: string;
  synced: boolean;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  optimisticUpdate?: boolean; // Whether this action has already updated local state
}

// Sync status for tracking sync progress
export interface SyncStatus {
  isActive: boolean;
  progress: number; // 0-100
  totalActions: number;
  syncedActions: number;
  failedActions: number;
  lastSyncTime: Date | null;
  lastError?: string;
}

// Cache metadata for managing data freshness
export interface CacheMetadata {
  lastUpdated: Date;
  expiresAt: Date;
  version: number;
  isStale: boolean;
}

// Cached data with metadata
export interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

// Chore filter types
export type ChoreFilter = 'all' | 'available' | 'assigned' | 'completed';

// Offline slice interface
export interface OfflineSlice {
  offline: {
    isOnline: boolean;
    networkStatus: NetworkStatus;
    pendingActions: OfflineAction[];
    failedActions: OfflineAction[];
    syncStatus: SyncStatus;
    lastSyncTime: Date | null;
    cacheSize: number;
    maxCacheSize: number;
    
    // Actions
    setOnlineStatus: (isOnline: boolean) => void;
    queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retryCount'>) => void;
    markActionSynced: (actionId: string) => void;
    markActionFailed: (actionId: string, error: string) => void;
    retryFailedAction: (actionId: string) => void;
    clearFailedActions: () => void;
    updateSyncStatus: (status: Partial<SyncStatus>) => void;
    setCacheSize: (size: number) => void;
  };
}

// Chore slice interface
export interface ChoreSlice {
  chores: {
    chores: CachedData<Chore[]> | null;
    filter: ChoreFilter;
    pendingCompletions: string[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setChores: (chores: Chore[]) => void;
    setFilter: (filter: ChoreFilter) => void;
    addPendingCompletion: (choreId: string) => void;
    removePendingCompletion: (choreId: string) => void;
    completeChoreOffline: (choreId: string) => Promise<void>;
    createChoreOffline: (chore: Omit<Chore, 'id'>) => Promise<void>;
    updateChoreOffline: (choreId: string, updates: Partial<Chore>) => Promise<void>;
    deleteChoreOffline: (choreId: string) => Promise<void>;
    clearError: () => void;
  };
}

// Reward slice interface
export interface RewardSlice {
  rewards: {
    rewards: CachedData<Reward[]> | null;
    redemptionHistory: RewardRedemption[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setRewards: (rewards: Reward[]) => void;
    setRedemptionHistory: (history: RewardRedemption[]) => void;
    redeemRewardOffline: (rewardId: string) => Promise<void>;
    createRewardOffline: (reward: Omit<Reward, 'id'>) => Promise<void>;
    updateRewardOffline: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
    deleteRewardOffline: (rewardId: string) => Promise<void>;
    clearError: () => void;
  };
}

// Combined store interface
export interface FamilyStore extends AuthSlice, FamilySlice, OfflineSlice, ChoreSlice, RewardSlice {
  // Any additional global actions
  refreshCache: () => Promise<void>;
  clearCache: () => void;
}