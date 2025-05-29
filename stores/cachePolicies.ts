// Cache Policies - Smart caching strategies for different data types
// Defines TTL, priority, and invalidation rules for each data category

import { CachePriority } from './cacheService';

export interface CachePolicy {
  key: string;
  ttl: number;                    // Time to live in milliseconds
  priority: CachePriority;
  tags: string[];
  compress: boolean;
  prefetch: boolean;
  invalidateOn: string[];         // Events that trigger invalidation
  refreshInterval?: number;       // Background refresh interval
  maxSize?: number;               // Max size for this type of data
  warmup: boolean;                // Load on app start
}

// Data-specific cache policies
export const CACHE_POLICIES: Record<string, CachePolicy> = {
  // User and authentication data
  USER_PROFILE: {
    key: 'user_profile',
    ttl: 2 * 60 * 60 * 1000,      // 2 hours
    priority: 'critical',
    tags: ['user', 'auth'],
    compress: false,
    prefetch: true,
    invalidateOn: ['USER_UPDATE', 'LOGOUT'],
    warmup: true
  },

  USER_SETTINGS: {
    key: 'user_settings',
    ttl: 24 * 60 * 60 * 1000,     // 24 hours
    priority: 'high',
    tags: ['user', 'settings'],
    compress: true,
    prefetch: true,
    invalidateOn: ['SETTINGS_UPDATE'],
    warmup: true
  },

  // Family data
  FAMILY_DATA: {
    key: 'family_data',
    ttl: 60 * 60 * 1000,          // 1 hour
    priority: 'critical',
    tags: ['family', 'core'],
    compress: true,
    prefetch: true,
    invalidateOn: ['FAMILY_UPDATE', 'MEMBER_UPDATE'],
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    warmup: true
  },

  FAMILY_MEMBERS: {
    key: 'family_members',
    ttl: 2 * 60 * 60 * 1000,      // 2 hours
    priority: 'high',
    tags: ['family', 'members'],
    compress: true,
    prefetch: true,
    invalidateOn: ['MEMBER_ADD', 'MEMBER_REMOVE', 'MEMBER_UPDATE'],
    refreshInterval: 60 * 60 * 1000, // 1 hour
    warmup: true
  },

  // Chore data
  CHORES_LIST: {
    key: 'chores_list',
    ttl: 30 * 60 * 1000,          // 30 minutes
    priority: 'high',
    tags: ['chores', 'list'],
    compress: true,
    prefetch: true,
    invalidateOn: ['CHORE_CREATE', 'CHORE_UPDATE', 'CHORE_DELETE', 'CHORE_COMPLETE'],
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    warmup: true
  },

  USER_CHORES: {
    key: 'user_chores',
    ttl: 15 * 60 * 1000,          // 15 minutes
    priority: 'critical',
    tags: ['chores', 'user'],
    compress: true,
    prefetch: true,
    invalidateOn: ['CHORE_ASSIGN', 'CHORE_COMPLETE', 'CHORE_TAKEOVER'],
    refreshInterval: 10 * 60 * 1000, // 10 minutes
    warmup: true
  },

  CHORE_DETAILS: {
    key: 'chore_details',
    ttl: 60 * 60 * 1000,          // 1 hour
    priority: 'medium',
    tags: ['chores', 'details'],
    compress: true,
    prefetch: false,
    invalidateOn: ['CHORE_UPDATE'],
    warmup: false
  },

  // Reward data
  REWARDS_CATALOG: {
    key: 'rewards_catalog',
    ttl: 24 * 60 * 60 * 1000,     // 24 hours
    priority: 'medium',
    tags: ['rewards', 'catalog'],
    compress: true,
    prefetch: true,
    invalidateOn: ['REWARD_CREATE', 'REWARD_UPDATE', 'REWARD_DELETE'],
    refreshInterval: 6 * 60 * 60 * 1000, // 6 hours
    warmup: true
  },

  USER_REDEMPTIONS: {
    key: 'user_redemptions',
    ttl: 2 * 60 * 60 * 1000,      // 2 hours
    priority: 'medium',
    tags: ['rewards', 'redemptions'],
    compress: true,
    prefetch: false,
    invalidateOn: ['REWARD_REDEEM', 'REDEMPTION_UPDATE'],
    warmup: false
  },

  // Gamification data
  USER_STATS: {
    key: 'user_stats',
    ttl: 30 * 60 * 1000,          // 30 minutes
    priority: 'high',
    tags: ['gamification', 'stats'],
    compress: true,
    prefetch: true,
    invalidateOn: ['CHORE_COMPLETE', 'POINTS_UPDATE', 'ACHIEVEMENT_UNLOCK'],
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    warmup: true
  },

  LEADERBOARD: {
    key: 'leaderboard',
    ttl: 5 * 60 * 1000,           // 5 minutes
    priority: 'low',
    tags: ['gamification', 'leaderboard'],
    compress: true,
    prefetch: false,
    invalidateOn: ['POINTS_UPDATE'],
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    warmup: false
  },

  ACHIEVEMENTS: {
    key: 'achievements',
    ttl: 12 * 60 * 60 * 1000,     // 12 hours
    priority: 'medium',
    tags: ['gamification', 'achievements'],
    compress: true,
    prefetch: true,
    invalidateOn: ['ACHIEVEMENT_UNLOCK'],
    warmup: true
  },

  STREAKS: {
    key: 'streaks',
    ttl: 60 * 60 * 1000,          // 1 hour
    priority: 'high',
    tags: ['gamification', 'streaks'],
    compress: true,
    prefetch: true,
    invalidateOn: ['CHORE_COMPLETE', 'STREAK_UPDATE'],
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    warmup: true
  },

  // Pet data
  PETS_LIST: {
    key: 'pets_list',
    ttl: 4 * 60 * 60 * 1000,      // 4 hours
    priority: 'medium',
    tags: ['pets', 'list'],
    compress: true,
    prefetch: true,
    invalidateOn: ['PET_ADD', 'PET_UPDATE', 'PET_REMOVE'],
    warmup: true
  },

  PET_CHORES: {
    key: 'pet_chores',
    ttl: 30 * 60 * 1000,          // 30 minutes
    priority: 'high',
    tags: ['pets', 'chores'],
    compress: true,
    prefetch: true,
    invalidateOn: ['PET_CHORE_CREATE', 'PET_CHORE_COMPLETE'],
    refreshInterval: 20 * 60 * 1000, // 20 minutes
    warmup: true
  },

  // Room data
  ROOMS_LIST: {
    key: 'rooms_list',
    ttl: 12 * 60 * 60 * 1000,     // 12 hours
    priority: 'low',
    tags: ['rooms', 'list'],
    compress: true,
    prefetch: true,
    invalidateOn: ['ROOM_CREATE', 'ROOM_UPDATE', 'ROOM_DELETE'],
    warmup: true
  },

  ROOM_ASSIGNMENTS: {
    key: 'room_assignments',
    ttl: 6 * 60 * 60 * 1000,      // 6 hours
    priority: 'medium',
    tags: ['rooms', 'assignments'],
    compress: true,
    prefetch: true,
    invalidateOn: ['ROOM_ASSIGN', 'ROOM_UNASSIGN'],
    warmup: true
  },

  // Collaboration data
  HELP_REQUESTS: {
    key: 'help_requests',
    ttl: 15 * 60 * 1000,          // 15 minutes
    priority: 'high',
    tags: ['collaboration', 'help'],
    compress: true,
    prefetch: false,
    invalidateOn: ['HELP_REQUEST_CREATE', 'HELP_REQUEST_UPDATE'],
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    warmup: false
  },

  TRADE_PROPOSALS: {
    key: 'trade_proposals',
    ttl: 30 * 60 * 1000,          // 30 minutes
    priority: 'medium',
    tags: ['collaboration', 'trades'],
    compress: true,
    prefetch: false,
    invalidateOn: ['TRADE_CREATE', 'TRADE_UPDATE', 'TRADE_COMPLETE'],
    warmup: false
  },

  // Notification data
  NOTIFICATIONS: {
    key: 'notifications',
    ttl: 5 * 60 * 1000,           // 5 minutes
    priority: 'high',
    tags: ['notifications'],
    compress: true,
    prefetch: true,
    invalidateOn: ['NOTIFICATION_CREATE', 'NOTIFICATION_READ'],
    refreshInterval: 2 * 60 * 1000, // 2 minutes
    warmup: false
  }
};

// Helper function to get policy by data type
export function getCachePolicy(dataType: string): CachePolicy | undefined {
  return CACHE_POLICIES[dataType];
}

// Helper function to get all policies for a tag
export function getPoliciesByTag(tag: string): CachePolicy[] {
  return Object.values(CACHE_POLICIES).filter(policy => 
    policy.tags.includes(tag)
  );
}

// Helper function to get all policies that need warmup
export function getWarmupPolicies(): CachePolicy[] {
  return Object.values(CACHE_POLICIES).filter(policy => policy.warmup);
}

// Helper function to get all policies with refresh intervals
export function getRefreshablePolicies(): CachePolicy[] {
  return Object.values(CACHE_POLICIES).filter(policy => 
    policy.refreshInterval !== undefined
  );
}

// Helper function to invalidate cache based on event
export function getPoliciesByInvalidationEvent(event: string): CachePolicy[] {
  return Object.values(CACHE_POLICIES).filter(policy => 
    policy.invalidateOn.includes(event)
  );
}

// Cache key generators for dynamic keys
export const CACHE_KEYS = {
  // User-specific keys
  userProfile: (userId: string) => `user_profile_${userId}`,
  userSettings: (userId: string) => `user_settings_${userId}`,
  userChores: (userId: string) => `user_chores_${userId}`,
  userStats: (userId: string) => `user_stats_${userId}`,
  userRedemptions: (userId: string) => `user_redemptions_${userId}`,
  
  // Family-specific keys
  familyData: (familyId: string) => `family_data_${familyId}`,
  familyMembers: (familyId: string) => `family_members_${familyId}`,
  familyChores: (familyId: string) => `family_chores_${familyId}`,
  familyRewards: (familyId: string) => `family_rewards_${familyId}`,
  familyRooms: (familyId: string) => `family_rooms_${familyId}`,
  familyPets: (familyId: string) => `family_pets_${familyId}`,
  
  // Detailed data keys
  choreDetails: (choreId: string) => `chore_details_${choreId}`,
  rewardDetails: (rewardId: string) => `reward_details_${rewardId}`,
  petDetails: (petId: string) => `pet_details_${petId}`,
  roomDetails: (roomId: string) => `room_details_${roomId}`,
  
  // List keys with filters
  choresList: (familyId: string, filter?: string) => 
    filter ? `chores_list_${familyId}_${filter}` : `chores_list_${familyId}`,
  rewardsList: (familyId: string, category?: string) => 
    category ? `rewards_list_${familyId}_${category}` : `rewards_list_${familyId}`,
  
  // Gamification keys
  leaderboard: (familyId: string, type: string) => 
    `leaderboard_${familyId}_${type}`,
  achievements: (userId: string) => `achievements_${userId}`,
  streaks: (userId: string) => `streaks_${userId}`,
  
  // Collaboration keys
  helpRequests: (familyId: string) => `help_requests_${familyId}`,
  tradeProposals: (familyId: string) => `trade_proposals_${familyId}`,
  notifications: (userId: string) => `notifications_${userId}`
};