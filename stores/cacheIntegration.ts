// Cache Integration - Seamless integration with Zustand store
// Provides automatic caching for all data operations

import { cacheService, CacheResult } from './cacheService';
import { CACHE_POLICIES, CACHE_KEYS, getCachePolicy, getPoliciesByInvalidationEvent } from './cachePolicies';
import { Family, Chore, Reward, User, FamilyMember } from '../types';

// Cache event types for invalidation
export type CacheEvent = 
  | 'USER_UPDATE' | 'LOGOUT'
  | 'SETTINGS_UPDATE'
  | 'FAMILY_UPDATE' | 'MEMBER_UPDATE' | 'MEMBER_ADD' | 'MEMBER_REMOVE'
  | 'CHORE_CREATE' | 'CHORE_UPDATE' | 'CHORE_DELETE' | 'CHORE_COMPLETE' | 'CHORE_ASSIGN' | 'CHORE_TAKEOVER'
  | 'REWARD_CREATE' | 'REWARD_UPDATE' | 'REWARD_DELETE' | 'REWARD_REDEEM' | 'REDEMPTION_UPDATE'
  | 'POINTS_UPDATE' | 'ACHIEVEMENT_UNLOCK' | 'STREAK_UPDATE'
  | 'PET_ADD' | 'PET_UPDATE' | 'PET_REMOVE' | 'PET_CHORE_CREATE' | 'PET_CHORE_COMPLETE'
  | 'ROOM_CREATE' | 'ROOM_UPDATE' | 'ROOM_DELETE' | 'ROOM_ASSIGN' | 'ROOM_UNASSIGN'
  | 'HELP_REQUEST_CREATE' | 'HELP_REQUEST_UPDATE'
  | 'TRADE_CREATE' | 'TRADE_UPDATE' | 'TRADE_COMPLETE'
  | 'NOTIFICATION_CREATE' | 'NOTIFICATION_READ';

// Cache integration class
class CacheIntegration {
  // Emit cache invalidation event
  async invalidateCache(event: CacheEvent, data?: any): Promise<void> {
    console.log(`🗄️ Cache invalidation event: ${event}`, data);
    
    // Get all policies affected by this event
    const affectedPolicies = getPoliciesByInvalidationEvent(event);
    
    // Invalidate cache for each affected policy
    for (const policy of affectedPolicies) {
      await cacheService.invalidateByTag(policy.tags[0]);
    }
  }

  // User data caching
  async getCachedUser(userId: string): Promise<CacheResult<User>> {
    const key = CACHE_KEYS.userProfile(userId);
    
    return await cacheService.get<User>(key);
  }

  async setCachedUser(userId: string, user: User): Promise<void> {
    const key = CACHE_KEYS.userProfile(userId);
    const policy = getCachePolicy('USER_PROFILE');
    
    if (policy) {
      await cacheService.set(key, user, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  // Family data caching
  async getCachedFamily(familyId: string): Promise<CacheResult<Family>> {
    const key = CACHE_KEYS.familyData(familyId);
    return await cacheService.get<Family>(key);
  }

  async setCachedFamily(familyId: string, family: Family): Promise<void> {
    const key = CACHE_KEYS.familyData(familyId);
    const policy = getCachePolicy('FAMILY_DATA');
    
    if (policy) {
      await cacheService.set(key, family, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags,
        skipCompression: false
      });
    }
  }

  // Family members caching
  async getCachedFamilyMembers(familyId: string): Promise<CacheResult<FamilyMember[]>> {
    const key = CACHE_KEYS.familyMembers(familyId);
    return await cacheService.get<FamilyMember[]>(key);
  }

  async setCachedFamilyMembers(familyId: string, members: FamilyMember[]): Promise<void> {
    const key = CACHE_KEYS.familyMembers(familyId);
    const policy = getCachePolicy('FAMILY_MEMBERS');
    
    if (policy) {
      await cacheService.set(key, members, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  // Chore data caching
  async getCachedChores(familyId: string, filter?: string): Promise<CacheResult<Chore[]>> {
    const key = CACHE_KEYS.choresList(familyId, filter);
    return await cacheService.get<Chore[]>(key);
  }

  async setCachedChores(familyId: string, chores: Chore[], filter?: string): Promise<void> {
    const key = CACHE_KEYS.choresList(familyId, filter);
    const policy = getCachePolicy('CHORES_LIST');
    
    if (policy) {
      await cacheService.set(key, chores, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  async getCachedUserChores(userId: string): Promise<CacheResult<Chore[]>> {
    const key = CACHE_KEYS.userChores(userId);
    return await cacheService.get<Chore[]>(key);
  }

  async setCachedUserChores(userId: string, chores: Chore[]): Promise<void> {
    const key = CACHE_KEYS.userChores(userId);
    const policy = getCachePolicy('USER_CHORES');
    
    if (policy) {
      await cacheService.set(key, chores, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  async getCachedChoreDetails(choreId: string): Promise<CacheResult<Chore>> {
    const key = CACHE_KEYS.choreDetails(choreId);
    return await cacheService.get<Chore>(key);
  }

  async setCachedChoreDetails(choreId: string, chore: Chore): Promise<void> {
    const key = CACHE_KEYS.choreDetails(choreId);
    const policy = getCachePolicy('CHORE_DETAILS');
    
    if (policy) {
      await cacheService.set(key, chore, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  // Reward data caching
  async getCachedRewards(familyId: string, category?: string): Promise<CacheResult<Reward[]>> {
    const key = CACHE_KEYS.rewardsList(familyId, category);
    return await cacheService.get<Reward[]>(key);
  }

  async setCachedRewards(familyId: string, rewards: Reward[], category?: string): Promise<void> {
    const key = CACHE_KEYS.rewardsList(familyId, category);
    const policy = getCachePolicy('REWARDS_CATALOG');
    
    if (policy) {
      await cacheService.set(key, rewards, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  // Gamification data caching
  async getCachedUserStats(userId: string): Promise<CacheResult<any>> {
    const key = CACHE_KEYS.userStats(userId);
    return await cacheService.get<any>(key);
  }

  async setCachedUserStats(userId: string, stats: any): Promise<void> {
    const key = CACHE_KEYS.userStats(userId);
    const policy = getCachePolicy('USER_STATS');
    
    if (policy) {
      await cacheService.set(key, stats, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  async getCachedLeaderboard(familyId: string, type: string): Promise<CacheResult<any[]>> {
    const key = CACHE_KEYS.leaderboard(familyId, type);
    return await cacheService.get<any[]>(key);
  }

  async setCachedLeaderboard(familyId: string, type: string, data: any[]): Promise<void> {
    const key = CACHE_KEYS.leaderboard(familyId, type);
    const policy = getCachePolicy('LEADERBOARD');
    
    if (policy) {
      await cacheService.set(key, data, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  async getCachedStreaks(userId: string): Promise<CacheResult<any>> {
    const key = CACHE_KEYS.streaks(userId);
    return await cacheService.get<any>(key);
  }

  async setCachedStreaks(userId: string, streaks: any): Promise<void> {
    const key = CACHE_KEYS.streaks(userId);
    const policy = getCachePolicy('STREAKS');
    
    if (policy) {
      await cacheService.set(key, streaks, {
        ttl: policy.ttl,
        priority: policy.priority,
        tags: policy.tags
      });
    }
  }

  // Warmup critical cache entries on app start
  async warmupCache(userId: string | null, familyId: string | null): Promise<void> {
    console.log('🗄️ Warming up cache...');
    
    const warmupPolicies = CACHE_POLICIES;
    const warmupPromises: Promise<any>[] = [];

    // Load user-specific data
    if (userId) {
      // User profile warmup would fetch from Firebase here
      console.log(`🗄️ Warming up user data for ${userId}`);
    }

    // Load family-specific data
    if (familyId) {
      // Family data warmup would fetch from Firebase here
      console.log(`🗄️ Warming up family data for ${familyId}`);
    }

    await Promise.all(warmupPromises);
    console.log('🗄️ Cache warmup completed');
  }

  // Start background refresh for policies with refresh intervals
  startBackgroundRefresh(): void {
    const refreshablePolicies = Object.values(CACHE_POLICIES)
      .filter(policy => policy.refreshInterval);

    refreshablePolicies.forEach(policy => {
      if (policy.refreshInterval) {
        setInterval(async () => {
          console.log(`🗄️ Background refresh for ${policy.key}`);
          // Refresh logic would go here
        }, policy.refreshInterval);
      }
    });
  }

  // Get cache statistics for monitoring
  getCacheStats() {
    return cacheService.getStats();
  }

  // Clear all cache
  async clearAllCache(): Promise<void> {
    await cacheService.clear();
  }

  // Clear cache by priority
  async clearCacheByPriority(priorities: ('critical' | 'high' | 'medium' | 'low')[]): Promise<void> {
    const keepPriorities = (['critical', 'high', 'medium', 'low'] as const)
      .filter(p => !priorities.includes(p));
    
    await cacheService.clear({ keepPriority: keepPriorities });
  }

  // Clear cache by tag
  async clearCacheByTag(tag: string): Promise<void> {
    await cacheService.invalidateByTag(tag);
  }
}

// Export singleton instance
export const cacheIntegration = new CacheIntegration();

// Start background refresh when imported
if (typeof window !== 'undefined') {
  cacheIntegration.startBackgroundRefresh();
}