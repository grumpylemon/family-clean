// Chore Slice - Enhanced with Takeover System
// Implements chore management with takeover functionality

import { StateCreator } from 'zustand';
import { FamilyStore, ChoreSlice } from './types';
import { Chore, ChoreTakeover } from '@/types';

export const createChoreSlice: StateCreator<
  FamilyStore,
  [],
  [],
  ChoreSlice
> = (set, get) => ({
  chores: {
    chores: null,
    filter: 'all',
    pendingCompletions: [],
    pendingTakeovers: [],
    isLoading: false,
    error: null,
    
    setChores: (chores) => set((state) => ({
      chores: {
        ...state.chores,
        chores: {
          data: chores,
          metadata: {
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            version: 1,
            isStale: false
          }
        }
      }
    })),
    
    setFilter: (filter) => set((state) => ({
      chores: { ...state.chores, filter }
    })),
    
    addPendingCompletion: (choreId) => set((state) => ({
      chores: {
        ...state.chores,
        pendingCompletions: [...state.chores.pendingCompletions, choreId]
      }
    })),
    
    removePendingCompletion: (choreId) => set((state) => ({
      chores: {
        ...state.chores,
        pendingCompletions: state.chores.pendingCompletions.filter(id => id !== choreId)
      }
    })),
    
    completeChoreOffline: async (choreId) => {
      const { offline } = get();
      const { auth } = get();
      
      if (!auth.user) {
        throw new Error('User not authenticated');
      }
      
      // Add to pending completions
      set((state) => ({
        chores: {
          ...state.chores,
          pendingCompletions: [...state.chores.pendingCompletions, choreId]
        }
      }));
      
      // Queue offline action
      offline.queueAction({
        type: 'COMPLETE_CHORE',
        payload: { choreId },
        userId: auth.user.uid,
        familyId: auth.user.familyId || undefined,
        maxRetries: 3,
        optimisticUpdate: true
      });
    },
    
    createChoreOffline: async (chore) => {
      const { offline } = get();
      const { auth } = get();
      
      if (!auth.user) {
        throw new Error('User not authenticated');
      }
      
      // Queue offline action
      offline.queueAction({
        type: 'CREATE_CHORE',
        payload: chore,
        userId: auth.user.uid,
        familyId: auth.user.familyId || undefined,
        maxRetries: 3,
        optimisticUpdate: false
      });
    },
    
    updateChoreOffline: async (choreId, updates) => {
      const { offline } = get();
      const { auth } = get();
      
      if (!auth.user) {
        throw new Error('User not authenticated');
      }
      
      // Queue offline action
      offline.queueAction({
        type: 'UPDATE_CHORE',
        payload: { choreId, updates },
        userId: auth.user.uid,
        familyId: auth.user.familyId || undefined,
        maxRetries: 3,
        optimisticUpdate: false
      });
    },
    
    deleteChoreOffline: async (choreId) => {
      const { offline } = get();
      const { auth } = get();
      
      if (!auth.user) {
        throw new Error('User not authenticated');
      }
      
      // Queue offline action
      offline.queueAction({
        type: 'DELETE_CHORE',
        payload: { choreId },
        userId: auth.user.uid,
        familyId: auth.user.familyId || undefined,
        maxRetries: 3,
        optimisticUpdate: false
      });
    },
    
    clearError: () => set((state) => ({
      chores: { ...state.chores, error: null }
    })),
    
    // Takeover functionality
    canTakeoverChore: (choreId) => {
      const state = get();
      const { auth, family } = state;
      
      if (!auth.user || !family.family) return false;
      
      const chore = state.chores.chores?.data.find(c => c.id === choreId);
      if (!chore) return false;
      
      const { eligible } = state.chores.checkTakeoverEligibility(chore);
      return eligible;
    },
    
    checkTakeoverEligibility: (chore) => {
      const { auth, family } = get();
      
      if (!auth.user || !family.family) {
        return { eligible: false, reason: 'Not authenticated' };
      }
      
      // Can't take over your own chore
      if (chore.assignedTo === auth.user.uid) {
        return { eligible: false, reason: 'Cannot take over your own chore' };
      }
      
      // Check if chore is already taken over
      if (chore.isTakenOver) {
        return { eligible: false, reason: 'Chore already taken over' };
      }
      
      // Check if chore is locked
      if (chore.lockedUntil && new Date(chore.lockedUntil) > new Date()) {
        return { eligible: false, reason: 'Chore is locked' };
      }
      
      // Check if chore is completed
      if (chore.status === 'completed') {
        return { eligible: false, reason: 'Chore already completed' };
      }
      
      // Get takeover settings
      const takeoverSettings = family.family.settings.takeoverSettings || {
        enabled: true,
        overdueThresholdHours: 24,
        maxDailyTakeovers: 2,
        protectionPeriodHours: 12
      };
      
      if (!takeoverSettings.enabled) {
        return { eligible: false, reason: 'Takeover system disabled' };
      }
      
      // Check if chore is in protection period
      const choreAge = Date.now() - new Date(chore.createdAt).getTime();
      const protectionMs = takeoverSettings.protectionPeriodHours * 60 * 60 * 1000;
      if (choreAge < protectionMs) {
        return { eligible: false, reason: 'Chore still in protection period' };
      }
      
      // Check if chore is overdue enough
      const dueDate = new Date(chore.dueDate);
      const overdueMs = Date.now() - dueDate.getTime();
      const thresholdMs = takeoverSettings.overdueThresholdHours * 60 * 60 * 1000;
      
      if (overdueMs < thresholdMs) {
        const hoursLeft = Math.ceil((thresholdMs - overdueMs) / (60 * 60 * 1000));
        return { eligible: false, reason: `Available for takeover in ${hoursLeft} hours` };
      }
      
      // Check daily takeover limit
      const { dailyCount, canTakeoverMore } = get().chores.getTakeoverStats();
      if (!canTakeoverMore) {
        return { eligible: false, reason: 'Daily takeover limit reached' };
      }
      
      return { eligible: true };
    },
    
    getTakeoverStats: () => {
      const { auth, family } = get();
      
      if (!auth.user || !family.family) {
        return { dailyCount: 0, canTakeoverMore: false };
      }
      
      const member = family.family.members.find(m => m.uid === auth.user!.uid);
      if (!member || !member.takeoverStats) {
        return { dailyCount: 0, canTakeoverMore: true };
      }
      
      const takeoverSettings = family.family.settings.takeoverSettings || {
        maxDailyTakeovers: 2
      };
      
      // Check if daily reset is needed
      const resetTime = new Date(member.takeoverStats.dailyTakeoverResetAt);
      const now = new Date();
      if (now > resetTime) {
        // Reset needed - would be handled by backend
        return { dailyCount: 0, canTakeoverMore: true };
      }
      
      return {
        dailyCount: member.takeoverStats.dailyTakeoverCount,
        canTakeoverMore: member.takeoverStats.dailyTakeoverCount < takeoverSettings.maxDailyTakeovers
      };
    },
    
    addPendingTakeover: (choreId) => set((state) => ({
      chores: {
        ...state.chores,
        pendingTakeovers: [...state.chores.pendingTakeovers, choreId]
      }
    })),
    
    removePendingTakeover: (choreId) => set((state) => ({
      chores: {
        ...state.chores,
        pendingTakeovers: state.chores.pendingTakeovers.filter(id => id !== choreId)
      }
    })),
    
    takeoverChore: async (choreId, reason = 'overdue') => {
      const { offline, auth, family } = get();
      
      if (!auth.user) {
        throw new Error('User not authenticated');
      }
      
      const chore = get().chores.chores?.data.find(c => c.id === choreId);
      if (!chore) {
        throw new Error('Chore not found');
      }
      
      const { eligible, reason: ineligibleReason } = get().chores.checkTakeoverEligibility(chore);
      if (!eligible) {
        throw new Error(ineligibleReason || 'Cannot takeover this chore');
      }
      
      // Add to pending takeovers
      set((state) => ({
        chores: {
          ...state.chores,
          pendingTakeovers: [...state.chores.pendingTakeovers, choreId]
        }
      }));
      
      // Calculate takeover bonus
      const takeoverSettings = family.family?.settings.takeoverSettings || {
        takeoverBonusPercentage: 25,
        takeoverXPMultiplier: 2.0,
        highValueThreshold: 100
      };
      
      const bonusPoints = Math.round(chore.points * (takeoverSettings.takeoverBonusPercentage / 100));
      const bonusXP = Math.round((chore.xpReward || chore.points) * (takeoverSettings.takeoverXPMultiplier - 1));
      const requiresAdminApproval = chore.points >= takeoverSettings.highValueThreshold;
      
      // Queue offline action
      offline.queueAction({
        type: 'TAKEOVER_CHORE',
        payload: {
          choreId,
          originalAssigneeId: chore.assignedTo,
          reason,
          bonusPoints,
          bonusXP,
          requiresAdminApproval
        },
        userId: auth.user.uid,
        familyId: auth.user.familyId || undefined,
        maxRetries: 3,
        optimisticUpdate: true
      });
      
      // Optimistic update
      if (get().chores.chores) {
        const updatedChores = get().chores.chores!.data.map(c => 
          c.id === choreId
            ? {
                ...c,
                originalAssignee: c.assignedTo,
                originalAssigneeName: c.assignedToName,
                assignedTo: auth.user!.uid,
                assignedToName: auth.user!.displayName || 'Unknown',
                takenOverBy: auth.user!.uid,
                takenOverByName: auth.user!.displayName || 'Unknown',
                takenOverAt: new Date().toISOString(),
                takeoverReason: reason,
                isTakenOver: true,
                takeoverBonusPoints: bonusPoints,
                takeoverBonusXP: bonusXP
              }
            : c
        );
        
        set((state) => ({
          chores: {
            ...state.chores,
            chores: {
              data: updatedChores,
              metadata: state.chores.chores!.metadata
            }
          }
        }));
      }
    }
  }
});