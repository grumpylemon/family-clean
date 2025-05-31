/**
 * Test suite for Conflict Detection Service
 */

import { conflictDetectionService } from '../services/conflictDetectionService';
import { EnhancedBulkOperation, AIRequestContext } from '../types/ai';

// Mock the Gemini AI service
jest.mock('../services/geminiAIService', () => ({
  geminiAIService: {
    analyzeConflicts: jest.fn()
  }
}));

describe('ConflictDetectionService', () => {
  const mockContext: AIRequestContext = {
    familySize: 4,
    memberAges: [45, 42, 16, 12],
    activeChores: [
      {
        id: 'chore1',
        title: 'Clean kitchen',
        type: 'cleaning',
        difficulty: 'medium',
        points: 15,
        assignedTo: 'user1',
        dueDate: '2025-01-01T10:00:00Z',
        room: 'kitchen',
        category: 'cleaning'
      },
      {
        id: 'chore2',
        title: 'Vacuum living room',
        type: 'cleaning',
        difficulty: 'easy',
        points: 10,
        assignedTo: 'user2',
        dueDate: '2025-01-01T11:00:00Z',
        room: 'living room',
        category: 'cleaning'
      },
      {
        id: 'chore3',
        title: 'Deep clean bathroom',
        type: 'cleaning',
        difficulty: 'hard',
        points: 25,
        assignedTo: 'user1',
        dueDate: '2025-01-01T14:00:00Z',
        room: 'bathroom',
        category: 'cleaning'
      }
    ],
    familyPreferences: {
      enabledFeatures: ['conflict_detection'],
      suggestionFrequency: 'normal',
      autoApprovalThreshold: 0.8,
      languageStyle: 'family_friendly',
      conflictSensitivity: 'medium',
      privacyLevel: 'standard'
    },
    historicalPatterns: {
      completionPatterns: [],
      preferredAssignments: [],
      timePreferences: [],
      seasonalAdjustments: [],
      successfulOperations: []
    },
    currentSchedule: {
      currentWeek: {
        weekStart: '2025-01-01T00:00:00Z',
        dailySchedules: []
      },
      upcomingEvents: [],
      memberAvailability: [],
      recurringCommitments: []
    }
  };

  describe('analyzeOperation', () => {
    test('detects no conflicts for simple operation', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'modify_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1'],
        modifications: { points: 20 },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.severity).toBe('none');
      expect(result.conflicts.length).toBe(0);
      expect(result.autoResolutionAvailable).toBe(true);
    });

    test('detects workload imbalance in assignment operation', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'assign_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'], // All chores to one person
        modifications: { assignTo: 'user1' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.conflicts.some(c => c.type === 'workload')).toBe(true);
      expect(result.severity).not.toBe('none');
    });

    test('detects skill mismatches in assignment', async () => {
      const contextWithYoungChild = {
        ...mockContext,
        memberAges: [45, 42, 16, 8], // 8-year-old child
        activeChores: [
          {
            id: 'chore1',
            title: 'Deep clean bathroom',
            type: 'cleaning',
            difficulty: 'hard',
            points: 25,
            assignedTo: 'user1',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'bathroom',
            category: 'cleaning'
          }
        ]
      };

      const operation: EnhancedBulkOperation = {
        operation: 'assign_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1'],
        modifications: { assignTo: 'child_user' }, // Assigning hard chore to child
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, contextWithYoungChild);

      expect(result.conflicts.some(c => c.type === 'skill')).toBe(true);
      expect(result.severity).toBe('major');
    });

    test('detects scheduling conflicts in reschedule operation', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'],
        modifications: { newDueDate: '2025-01-01T10:00:00Z' }, // All at same time
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.conflicts.some(c => c.type === 'schedule')).toBe(true);
    });

    test('detects resource conflicts', async () => {
      const contextWithSameRoom = {
        ...mockContext,
        activeChores: [
          {
            id: 'chore1',
            title: 'Clean kitchen counters',
            type: 'cleaning',
            difficulty: 'easy',
            points: 10,
            assignedTo: 'user1',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'kitchen',
            category: 'cleaning'
          },
          {
            id: 'chore2',
            title: 'Clean kitchen floor',
            type: 'cleaning',
            difficulty: 'medium',
            points: 15,
            assignedTo: 'user2',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'kitchen',
            category: 'cleaning'
          },
          {
            id: 'chore3',
            title: 'Organize kitchen cabinets',
            type: 'organizing',
            difficulty: 'medium',
            points: 20,
            assignedTo: 'user3',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'kitchen',
            category: 'organizing'
          }
        ]
      };

      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'],
        modifications: { newDueDate: '2025-01-01T10:00:00Z' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, contextWithSameRoom);

      expect(result.conflicts.some(c => c.type === 'resource')).toBe(true);
    });

    test('detects dependency conflicts in delete operation', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'delete_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2'], // Deleting majority of chores
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.conflicts.some(c => c.type === 'dependency')).toBe(true);
      expect(result.severity).toBe('major');
    });

    test('detects impossible scheduling (past dates)', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1'],
        modifications: { newDueDate: '2020-01-01T10:00:00Z' }, // Past date
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.conflicts.some(c => c.severity === 'blocking')).toBe(true);
      expect(result.severity).toBe('blocking');
    });
  });

  describe('Conflict severity classification', () => {
    test('classifies minor conflicts correctly', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'],
        modifications: { newDueDate: '2025-01-05T10:00:00Z' }, // Weekend
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      if (result.conflicts.length > 0) {
        expect(result.severity).toBe('minor');
        expect(result.autoResolutionAvailable).toBe(true);
      }
    });

    test('classifies major conflicts correctly', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'assign_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore3'], // Hard chore
        modifications: { assignTo: 'child_user' }, // To child
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const contextWithChild = {
        ...mockContext,
        memberAges: [45, 42, 16, 8]
      };

      const result = await conflictDetectionService.analyzeOperation(operation, contextWithChild);

      expect(result.conflicts.some(c => c.severity === 'major')).toBe(true);
      expect(result.autoResolutionAvailable).toBe(false);
    });

    test('classifies blocking conflicts correctly', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1'],
        modifications: { newDueDate: '2020-01-01T10:00:00Z' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.severity).toBe('blocking');
      expect(result.autoResolutionAvailable).toBe(true); // Can auto-fix by setting valid date
    });
  });

  describe('Resolution suggestions', () => {
    test('generates automatic resolutions for schedule conflicts', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'],
        modifications: { newDueDate: '2025-01-05T10:00:00Z' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      if (result.conflicts.some(c => c.type === 'schedule')) {
        expect(result.suggestedResolutions.length).toBeGreaterThan(0);
        expect(result.suggestedResolutions.some(r => r.strategy === 'reschedule')).toBe(true);
      }
    });

    test('generates resolutions for workload conflicts', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'assign_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'],
        modifications: { assignTo: 'user1' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      if (result.conflicts.some(c => c.type === 'workload')) {
        expect(result.suggestedResolutions.some(r => r.strategy === 'reassign')).toBe(true);
        expect(result.suggestedResolutions.some(r => r.modifications.rebalanceWorkload)).toBe(true);
      }
    });

    test('generates resolutions for resource conflicts', async () => {
      const contextWithSameRoom = {
        ...mockContext,
        activeChores: [
          {
            id: 'chore1',
            title: 'Clean kitchen',
            type: 'cleaning',
            difficulty: 'easy',
            points: 10,
            assignedTo: 'user1',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'kitchen',
            category: 'cleaning'
          },
          {
            id: 'chore2',
            title: 'Kitchen maintenance',
            type: 'maintenance',
            difficulty: 'medium',
            points: 15,
            assignedTo: 'user2',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'kitchen',
            category: 'maintenance'
          },
          {
            id: 'chore3',
            title: 'Kitchen organization',
            type: 'organizing',
            difficulty: 'medium',
            points: 20,
            assignedTo: 'user3',
            dueDate: '2025-01-01T10:00:00Z',
            room: 'kitchen',
            category: 'organizing'
          }
        ]
      };

      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1', 'chore2', 'chore3'],
        modifications: { newDueDate: '2025-01-01T10:00:00Z' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, contextWithSameRoom);

      if (result.conflicts.some(c => c.type === 'resource')) {
        expect(result.suggestedResolutions.some(r => r.strategy === 'reschedule')).toBe(true);
        expect(result.suggestedResolutions.some(r => r.modifications.staggerByHours)).toBeDefined();
      }
    });
  });

  describe('Edge cases', () => {
    test('handles empty chore list', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'modify_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: [],
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.severity).toBe('none');
      expect(result.conflicts.length).toBe(0);
    });

    test('handles missing context gracefully', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'assign_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1'],
        modifications: { assignTo: 'user2' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const emptyContext = {
        ...mockContext,
        activeChores: []
      };

      const result = await conflictDetectionService.analyzeOperation(operation, emptyContext);

      expect(result).toBeDefined();
      expect(result.severity).toBe('none');
    });

    test('handles invalid modification data', async () => {
      const operation: EnhancedBulkOperation = {
        operation: 'reschedule_multiple',
        familyId: 'family123',
        requestedBy: 'user1',
        choreIds: ['chore1'],
        modifications: { newDueDate: 'invalid-date' },
        applyImmediately: true,
        notifyMembers: true,
        aiAssisted: true,
        operationSteps: [],
        estimatedDuration: 30,
        confidenceScore: 0.9,
        requiresApproval: false,
        approvalStatus: 'pending'
      };

      const result = await conflictDetectionService.analyzeOperation(operation, mockContext);

      expect(result.conflicts.some(c => c.severity === 'blocking')).toBe(true);
    });
  });
});