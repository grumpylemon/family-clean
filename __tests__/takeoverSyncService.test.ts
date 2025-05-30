import { processTakeoverAction, getTakeoverAnalytics } from '../services/takeoverSyncService';
import { OfflineAction } from '../stores/types';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc,
  collection,
  runTransaction,
} from 'firebase/firestore';

// Mock Firebase
jest.mock('@/config/firebase', () => ({
  db: {},
  getChoresCollection: jest.fn(() => ({})),
  getFamiliesCollection: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/services/gamification', () => ({
  checkAchievementProgress: jest.fn(),
}));

describe('TakeoverSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processTakeoverAction', () => {
    const mockAction: OfflineAction = {
      id: 'action-1',
      type: 'TAKEOVER_CHORE',
      payload: {
        choreId: 'chore-123',
        originalAssigneeId: 'user-2',
        reason: 'overdue',
        bonusPoints: 5,
        bonusXP: 20,
        requiresAdminApproval: false,
      },
      timestamp: Date.now(),
      userId: 'user-1',
      familyId: 'family-123',
      synced: false,
      retryCount: 0,
      maxRetries: 3,
    };

    const mockChore = {
      id: 'chore-123',
      title: 'Clean Kitchen',
      assignedTo: 'user-2',
      assignedToName: 'John',
      status: 'open',
      dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    };

    const mockFamily = {
      members: [
        {
          uid: 'user-1',
          name: 'Sarah',
          takeoverStats: {
            choresTakenOver: 5,
            totalTakeoverBonus: 25,
            takeoverStreak: 2,
            dailyTakeoverCount: 0,
            dailyTakeoverResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        {
          uid: 'user-2',
          name: 'John',
        },
      ],
    };

    it('should successfully process a valid takeover action', async () => {
      const mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => true, id: 'chore-123', data: () => mockChore })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockFamily }),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
        return await callback(mockTransaction);
      });

      (addDoc as jest.Mock).mockResolvedValue({ id: 'takeover-123' });

      const result = await processTakeoverAction(mockAction);

      expect(result.success).toBe(true);
      expect(result.choreId).toBe('chore-123');
      expect(result.bonusAwarded).toEqual({ points: 5, xp: 20 });
      expect(mockTransaction.update).toHaveBeenCalledTimes(2);
    });

    it('should fail if chore is already completed', async () => {
      const completedChore = { ...mockChore, status: 'completed' };
      
      const mockTransaction = {
        get: jest.fn().mockResolvedValueOnce({ 
          exists: () => true, 
          id: 'chore-123', 
          data: () => completedChore 
        }),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
        return await callback(mockTransaction);
      });

      const result = await processTakeoverAction(mockAction);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Chore already completed');
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });

    it('should fail if user tries to takeover their own chore', async () => {
      const ownChore = { ...mockChore, assignedTo: 'user-1' };
      
      const mockTransaction = {
        get: jest.fn().mockResolvedValueOnce({ 
          exists: () => true, 
          id: 'chore-123', 
          data: () => ownChore 
        }),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
        return await callback(mockTransaction);
      });

      const result = await processTakeoverAction(mockAction);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Already assigned to you');
    });

    it('should require admin approval for high-value chores', async () => {
      const highValueAction = {
        ...mockAction,
        payload: {
          ...mockAction.payload,
          requiresAdminApproval: true,
          adminApproved: false,
        },
      };

      const mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => true, id: 'chore-123', data: () => mockChore })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockFamily }),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
        return await callback(mockTransaction);
      });

      const result = await processTakeoverAction(highValueAction);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Admin approval required for high-value chore');
    });

    it('should update member takeover stats correctly', async () => {
      const mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => true, id: 'chore-123', data: () => mockChore })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockFamily }),
        update: jest.fn(),
      };

      (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
        const result = await callback(mockTransaction);
        return result;
      });

      await processTakeoverAction(mockAction);

      // Check that family members were updated
      const familyUpdateCall = mockTransaction.update.mock.calls.find(
        call => call[1].members !== undefined
      );
      
      expect(familyUpdateCall).toBeTruthy();
      const updatedMember = familyUpdateCall[1].members.find(
        (m: any) => m.uid === 'user-1'
      );
      
      expect(updatedMember.takeoverStats.choresTakenOver).toBe(6);
      expect(updatedMember.takeoverStats.totalTakeoverBonus).toBe(30);
      expect(updatedMember.takeoverStats.dailyTakeoverCount).toBe(1);
    });
  });

  describe('getTakeoverAnalytics', () => {
    it('should calculate analytics for a given period', async () => {
      const mockTakeovers = [
        {
          id: 'takeover-1',
          choreId: 'chore-1',
          newAssigneeId: 'user-1',
          newAssigneeName: 'Sarah',
          bonusPoints: 5,
          overdueHours: 26,
        },
        {
          id: 'takeover-2',
          choreId: 'chore-2',
          newAssigneeId: 'user-1',
          newAssigneeName: 'Sarah',
          bonusPoints: 10,
          overdueHours: 48,
        },
        {
          id: 'takeover-3',
          choreId: 'chore-3',
          newAssigneeId: 'user-2',
          newAssigneeName: 'John',
          bonusPoints: 7,
          overdueHours: 30,
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockTakeovers.map(t => ({
          id: t.id,
          data: () => t,
        })),
        size: 3,
      });

      const analytics = await getTakeoverAnalytics('family-123', 'weekly');

      expect(analytics.period).toBe('weekly');
      expect(analytics.totalTakeovers).toBe(3);
      expect(analytics.uniqueHelpers).toBe(2);
      expect(analytics.totalBonusPoints).toBe(22);
      expect(analytics.averageResponseTime).toBeCloseTo(34.67, 1);
    });

    it('should handle empty takeover data', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        size: 0,
      });

      const analytics = await getTakeoverAnalytics('family-123', 'monthly');

      expect(analytics.totalTakeovers).toBe(0);
      expect(analytics.uniqueHelpers).toBe(0);
      expect(analytics.averageResponseTime).toBe(0);
    });
  });
});