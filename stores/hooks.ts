// Zustand Store Hooks - React hooks for easy integration with existing components
// Provides compatibility layer and enhanced functionality

import { useEffect, useCallback } from 'react';
import { useFamilyStore } from './familyStore';
import { networkService } from './networkService';
import { 
  createOrUpdateUserProfile,
  getFamily,
  getFamiliesCollection,
  getChoresForFamily,
  getRewardsForFamily,
  getUserProfile
} from '@/services/firestore';
import { User } from 'firebase/auth';
import { Family, Chore, Reward } from '@/types';

// Auth hooks - replacement for useAuth from Context
export const useAuth = () => {
  const { 
    user, 
    loading, 
    error, 
    isAuthenticated,
    setUser, 
    setLoading, 
    setError 
  } = useFamilyStore();

  const signInWithGoogle = useCallback(async () => {
    // This will integrate with existing auth logic
    setLoading(true);
    setError(null);
    
    try {
      // Call existing Google sign-in logic here
      console.log('Google sign-in integration pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const signInAsGuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call existing guest sign-in logic here
      console.log('Guest sign-in integration pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call existing logout logic
      setUser(null);
      console.log('Logout integration pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setError]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signInWithGoogle,
    signInAsGuest,
    logout
  };
};

// Family hooks - replacement for useFamily from Context
export const useFamily = () => {
  const {
    family,
    userProfile,
    loading,
    error,
    isAdmin,
    currentMember,
    setFamily,
    setUserProfile,
    setLoading,
    setError,
    updateMemberOptimistically,
    refreshCache,
    user
  } = useFamilyStore();

  // Load family data
  const loadUserAndFamily = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const profile = await getUserProfile(user.uid);
      
      if (profile) {
        setUserProfile(profile);
        
        // If user has a family, load it
        if (profile.familyId) {
          const familyData = await getFamily(profile.familyId);
          if (familyData) {
            setFamily(familyData);
          }
        }
      } else {
        // Create initial user profile
        await createOrUpdateUserProfile(user.uid, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const newProfile = await getUserProfile(user.uid);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error loading user/family:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setError, setUserProfile, setFamily]);

  // Auto-load when user changes
  useEffect(() => {
    if (user) {
      loadUserAndFamily();
    }
  }, [user, loadUserAndFamily]);

  const createNewFamily = useCallback(async (familyName: string): Promise<boolean> => {
    // Implementation will integrate with existing family creation logic
    console.log(`Creating family: ${familyName}`);
    return false;
  }, []);

  const joinFamily = useCallback(async (joinCode: string): Promise<boolean> => {
    // Implementation will integrate with existing family joining logic
    console.log(`Joining family with code: ${joinCode}`);
    return false;
  }, []);

  const updateFamilySettings = useCallback(async (
    settings: Partial<Family['settings']>, 
    name?: string
  ): Promise<boolean> => {
    // Implementation will integrate with existing settings update logic
    console.log('Updating family settings:', settings);
    return false;
  }, []);

  const updateMemberRole = useCallback(async (
    userId: string, 
    role: any, 
    familyRole: any
  ): Promise<boolean> => {
    // Optimistically update UI
    updateMemberOptimistically(userId, { role, familyRole });
    
    // Implementation will integrate with existing role update logic
    console.log(`Updating member role: ${userId}`, { role, familyRole });
    return false;
  }, [updateMemberOptimistically]);

  const refreshFamily = useCallback(async () => {
    await refreshCache();
  }, [refreshCache]);

  return {
    family: family?.data || null,
    userProfile: userProfile?.data || null,
    loading,
    error,
    isAdmin,
    currentMember,
    createNewFamily,
    joinFamily,
    updateFamilySettings,
    updateMemberRole,
    refreshFamily,
    // Legacy methods for compatibility
    updateMemberName: async () => false,
    removeMember: async () => false,
    updateFamilyMember: async () => false
  };
};

// Chore hooks - enhanced with offline functionality
export const useChores = () => {
  const {
    chores,
    loading,
    error,
    filter,
    pendingCompletions,
    isOnline,
    setChores,
    setLoading,
    setError,
    setFilter,
    completeChoreOffline,
    createChoreOffline,
    family,
    user
  } = useFamilyStore();

  // Load chores from server
  const loadChores = useCallback(async () => {
    if (!family?.data.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const choresList = await getChoresForFamily(family.data.id);
      setChores(choresList);
    } catch (err) {
      console.error('Error loading chores:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chores');
    } finally {
      setLoading(false);
    }
  }, [family, setChores, setLoading, setError]);

  // Complete chore with offline support
  const completeChore = useCallback(async (choreId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await completeChoreOffline(choreId);
      
      // If online, the action will be synced automatically
      // If offline, it will be queued and synced when connection returns
      
      console.log(`Chore ${choreId} marked as complete ${isOnline ? '(syncing)' : '(queued)'}`)
    } catch (err) {
      console.error('Error completing chore:', err);
      throw err;
    }
  }, [user, completeChoreOffline, isOnline]);

  // Create chore with offline support
  const createChore = useCallback(async (choreData: Omit<Chore, 'id'>) => {
    try {
      await createChoreOffline(choreData);
      console.log(`Chore created ${isOnline ? '(syncing)' : '(queued)'}`);
    } catch (err) {
      console.error('Error creating chore:', err);
      throw err;
    }
  }, [createChoreOffline, isOnline]);

  // Filtered chores based on current filter
  const filteredChores = useFamilyStore(state => {
    if (!state.chores) return [];
    
    const allChores = state.chores.data;
    
    switch (state.filter) {
      case 'available':
        return allChores.filter(chore => 
          !chore.completedAt && 
          !state.pendingCompletions.includes(chore.id || '')
        );
      case 'assigned':
        return allChores.filter(chore => 
          chore.assignedTo === state.user?.uid && !chore.completedAt
        );
      case 'completed':
        return allChores.filter(chore => !!chore.completedAt);
      default:
        return allChores;
    }
  });

  return {
    chores: chores?.data || [],
    filteredChores,
    loading,
    error,
    filter,
    pendingCompletions,
    isOnline,
    setFilter,
    loadChores,
    completeChore,
    createChore,
    refreshChores: loadChores
  };
};

// Rewards hooks
export const useRewards = () => {
  const {
    rewards,
    loading,
    error,
    setRewards,
    setLoading,
    setError,
    redeemRewardOffline,
    family,
    isOnline
  } = useFamilyStore();

  // Load rewards from server
  const loadRewards = useCallback(async () => {
    if (!family?.data.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const rewardsList = await getRewardsForFamily(family.data.id);
      setRewards(rewardsList);
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }, [family, setRewards, setLoading, setError]);

  // Redeem reward with offline support
  const redeemReward = useCallback(async (rewardId: string) => {
    try {
      await redeemRewardOffline(rewardId);
      console.log(`Reward ${rewardId} redeemed ${isOnline ? '(syncing)' : '(queued)'}`);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      throw err;
    }
  }, [redeemRewardOffline, isOnline]);

  return {
    rewards: rewards?.data || [],
    loading,
    error,
    isOnline,
    loadRewards,
    redeemReward,
    refreshRewards: loadRewards
  };
};

// Offline status hook
export const useOfflineStatus = () => {
  const {
    isOnline,
    networkStatus,
    pendingActions,
    failedActions,
    syncStatus
  } = useFamilyStore();

  const manualSync = useCallback(async () => {
    await networkService.triggerSync();
  }, []);

  const retryFailedAction = useFamilyStore(state => state.retryFailedAction);
  const clearFailedActions = useFamilyStore(state => state.clearFailedActions);

  return {
    isOnline,
    networkStatus,
    pendingActions,
    failedActions,
    syncStatus,
    hasPendingActions: pendingActions.length > 0,
    hasFailedActions: failedActions.length > 0,
    manualSync,
    retryFailedAction,
    clearFailedActions
  };
};

// Store initialization hook
export const useStoreInitialization = () => {
  const { user } = useFamilyStore();

  useEffect(() => {
    // Initialize network service
    networkService.init();

    // Cleanup on unmount
    return () => {
      networkService.cleanup();
    };
  }, []);

  // Set up auth integration
  useEffect(() => {
    // This will be integrated with the existing auth system
    console.log('Store initialization with user:', user?.uid);
  }, [user]);
};