import { renderHook, act } from '@testing-library/react-hooks';
import { useFamilyStore } from '../stores/hooks';
import { Chore, Family, FamilyMember } from '../types';

// Mock data
const mockUser = {
  uid: 'user-1',
  email: 'user1@example.com',
  displayName: 'User One',
  familyId: 'family-1',
};

const mockFamily: Family = {
  id: 'family-1',
  name: 'Test Family',
  adminId: 'admin-1',
  joinCode: 'TEST123',
  members: [
    {
      uid: 'user-1',
      name: 'User One',
      email: 'user1@example.com',
      role: 'member',
      familyRole: 'parent',
      points: { current: 100, lifetime: 500, weekly: 50 },
      isActive: true,
      joinedAt: new Date().toISOString(),
      takeoverStats: {
        choresTakenOver: 0,
        totalTakeoverBonus: 0,
        takeoverStreak: 0,
        dailyTakeoverCount: 0,
        dailyTakeoverResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      uid: 'user-2',
      name: 'User Two',
      email: 'user2@example.com',
      role: 'member',
      familyRole: 'child',
      points: { current: 50, lifetime: 200, weekly: 20 },
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
  ] as FamilyMember[],
  settings: {
    defaultChorePoints: 10,
    defaultChoreCooldownHours: 24,
    allowPointTransfers: true,
    weekStartDay: 0,
    takeoverSettings: {
      enabled: true,
      overdueThresholdHours: 24,
      maxDailyTakeovers: 2,
      takeoverBonusPercentage: 25,
      takeoverXPMultiplier: 2.0,
      cooldownAfterTakeoverHours: 48,
      highValueThreshold: 100,
      protectionPeriodHours: 12,
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockChore: Chore = {
  id: 'chore-1',
  title: 'Clean Kitchen',
  type: 'individual',
  difficulty: 'medium',
  points: 20,
  xpReward: 20,
  assignedTo: 'user-2',
  assignedToName: 'User Two',
  dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days overdue
  createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // Created 3 days ago
  createdBy: 'admin-1',
  familyId: 'family-1',
  status: 'open',
};

describe('Chore Takeover System', () => {
  beforeEach(() => {
    // Reset store state
    useFamilyStore.setState({
      auth: {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      family: {
        family: mockFamily,
        members: mockFamily.members,
        isLoading: false,
        error: null,
      },
      chores: {
        chores: {
          data: [mockChore],
          metadata: {
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            version: 1,
            isStale: false,
          },
        },
        filter: 'all',
        pendingCompletions: [],
        pendingTakeovers: [],
        isLoading: false,
        error: null,
      },
    });
  });

  describe('checkTakeoverEligibility', () => {
    it('should allow takeover for overdue chores', () => {
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const { eligible, reason } = result.current.checkTakeoverEligibility(mockChore);
      
      expect(eligible).toBe(true);
      expect(reason).toBeUndefined();
    });

    it('should not allow takeover of own chores', () => {
      const ownChore = { ...mockChore, assignedTo: 'user-1' };
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const { eligible, reason } = result.current.checkTakeoverEligibility(ownChore);
      
      expect(eligible).toBe(false);
      expect(reason).toBe('Cannot take over your own chore');
    });

    it('should not allow takeover of completed chores', () => {
      const completedChore: Chore = { ...mockChore, status: 'completed' };
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const { eligible, reason } = result.current.checkTakeoverEligibility(completedChore);
      
      expect(eligible).toBe(false);
      expect(reason).toBe('Chore already completed');
    });

    it('should not allow takeover during protection period', () => {
      const newChore = {
        ...mockChore,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      };
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const { eligible, reason } = result.current.checkTakeoverEligibility(newChore);
      
      expect(eligible).toBe(false);
      expect(reason).toBe('Chore still in protection period');
    });

    it('should not allow takeover before overdue threshold', () => {
      const recentChore = {
        ...mockChore,
        dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours overdue
      };
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const { eligible, reason } = result.current.checkTakeoverEligibility(recentChore);
      
      expect(eligible).toBe(false);
      expect(reason).toMatch(/Available for takeover in \d+ hours/);
    });

    it('should respect daily takeover limit', () => {
      // Update user's takeover stats to hit limit
      const updatedFamily = {
        ...mockFamily,
        members: mockFamily.members.map(m =>
          m.uid === 'user-1'
            ? {
                ...m,
                takeoverStats: {
                  ...m.takeoverStats!,
                  dailyTakeoverCount: 2, // Hit the limit
                },
              }
            : m
        ),
      };
      
      useFamilyStore.setState({
        family: { ...useFamilyStore.getState().family, family: updatedFamily },
      });
      
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const { eligible, reason } = result.current.checkTakeoverEligibility(mockChore);
      
      expect(eligible).toBe(false);
      expect(reason).toBe('Daily takeover limit reached');
    });
  });

  describe('takeoverChore', () => {
    it('should successfully takeover a chore', async () => {
      const { result } = renderHook(() => useFamilyStore());
      
      await act(async () => {
        await result.current.chores.takeoverChore('chore-1', 'overdue');
      });
      
      // Check that the chore was updated optimistically
      const updatedChore = result.current.chores.chores?.data.find(c => c.id === 'chore-1');
      expect(updatedChore?.assignedTo).toBe('user-1');
      expect(updatedChore?.originalAssignee).toBe('user-2');
      expect(updatedChore?.isTakenOver).toBe(true);
      expect(updatedChore?.takeoverBonusPoints).toBe(5); // 25% of 20 points
      expect(updatedChore?.takeoverBonusXP).toBe(20); // 2x multiplier - 1 = 1x bonus
      
      // Check that the action was queued
      const pendingActions = result.current.offline.pendingActions;
      expect(pendingActions).toHaveLength(1);
      expect(pendingActions[0].type).toBe('TAKEOVER_CHORE');
      expect(pendingActions[0].payload.choreId).toBe('chore-1');
    });

    it('should add chore to pending takeovers', async () => {
      const { result } = renderHook(() => useFamilyStore());
      
      await act(async () => {
        await result.current.chores.takeoverChore('chore-1');
      });
      
      expect(result.current.chores.pendingTakeovers).toContain('chore-1');
    });

    it('should calculate correct bonus for high-value chores', async () => {
      const highValueChore = { ...mockChore, id: 'chore-2', points: 150 };
      
      useFamilyStore.setState({
        chores: {
          ...useFamilyStore.getState().chores,
          chores: {
            data: [mockChore, highValueChore],
            metadata: useFamilyStore.getState().chores.chores!.metadata,
          },
        },
      });
      
      const { result } = renderHook(() => useFamilyStore());
      
      await act(async () => {
        await result.current.chores.takeoverChore('chore-2');
      });
      
      const action = result.current.offline.pendingActions.find(
        a => a.payload.choreId === 'chore-2'
      );
      
      expect(action?.payload.bonusPoints).toBe(38); // 25% of 150 = 37.5, rounded to 38
      expect(action?.payload.requiresAdminApproval).toBe(true);
    });

    it('should throw error for ineligible chores', async () => {
      const { result } = renderHook(() => useFamilyStore());
      
      // Try to takeover own chore
      const ownChore = { ...mockChore, id: 'chore-3', assignedTo: 'user-1' };
      
      useFamilyStore.setState({
        chores: {
          ...useFamilyStore.getState().chores,
          chores: {
            data: [ownChore],
            metadata: useFamilyStore.getState().chores.chores!.metadata,
          },
        },
      });
      
      await expect(
        act(async () => {
          await result.current.chores.takeoverChore('chore-3');
        })
      ).rejects.toThrow('Cannot take over your own chore');
    });
  });

  describe('getTakeoverStats', () => {
    it('should return correct takeover stats', () => {
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const stats = result.current.getTakeoverStats();
      
      expect(stats.dailyCount).toBe(0);
      expect(stats.canTakeoverMore).toBe(true);
    });

    it('should indicate when daily reset is needed', () => {
      // Set reset time to past
      const updatedFamily = {
        ...mockFamily,
        members: mockFamily.members.map(m =>
          m.uid === 'user-1'
            ? {
                ...m,
                takeoverStats: {
                  ...m.takeoverStats!,
                  dailyTakeoverCount: 2,
                  dailyTakeoverResetAt: new Date(Date.now() - 1000).toISOString(), // Past time
                },
              }
            : m
        ),
      };
      
      useFamilyStore.setState({
        family: { ...useFamilyStore.getState().family, family: updatedFamily },
      });
      
      const { result } = renderHook(() => useFamilyStore((state) => state.chores));
      
      const stats = result.current.getTakeoverStats();
      
      // Should indicate reset is needed
      expect(stats.dailyCount).toBe(0);
      expect(stats.canTakeoverMore).toBe(true);
    });
  });
});