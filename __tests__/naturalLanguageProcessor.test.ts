/**
 * Test suite for Natural Language Processor
 */

import { naturalLanguageProcessor } from '../services/naturalLanguageProcessor';
import { AIRequestContext } from '../types/ai';

// Mock the Gemini AI service
jest.mock('../services/geminiAIService', () => ({
  geminiAIService: {
    processNaturalLanguageRequest: jest.fn()
  }
}));

describe('NaturalLanguageProcessor', () => {
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
        title: 'Take out trash',
        type: 'maintenance',
        difficulty: 'easy',
        points: 5,
        assignedTo: 'user2',
        dueDate: '2025-01-01T18:00:00Z',
        room: 'bathroom',
        category: 'maintenance'
      }
    ],
    familyPreferences: {
      enabledFeatures: ['natural_language_operations'],
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

  describe('parseRequest', () => {
    test('parses simple assignment request', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'assign all kitchen chores to Sarah',
        'family123',
        mockContext
      );

      expect(result.intent.type).toBe('assign');
      expect(result.intent.target).toContain('kitchen');
      expect(result.intent.modifiers.assignTo).toBe('sarah');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.clarificationNeeded).toBe(false);
    });

    test('parses scheduling request', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'move all chores to tomorrow',
        'family123',
        mockContext
      );

      expect(result.intent.type).toBe('reschedule');
      expect(result.intent.modifiers.time).toBe('tomorrow');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('parses point modification request', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'increase points for all hard chores by 50%',
        'family123',
        mockContext
      );

      expect(result.intent.type).toBe('modify');
      expect(result.intent.modifiers.operation).toBe('increase');
      expect(result.intent.modifiers.percentageChange).toBe(50);
      expect(result.intent.target).toContain('hard');
    });

    test('parses deletion request', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'delete all bathroom chores',
        'family123',
        mockContext
      );

      expect(result.intent.type).toBe('delete');
      expect(result.intent.target).toContain('bathroom');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('parses creation request', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'create daily cleaning routine',
        'family123',
        mockContext
      );

      expect(result.intent.type).toBe('create');
      expect(result.intent.target).toContain('cleaning');
      expect(result.intent.modifiers.time).toBe('daily');
    });

    test('parses optimization request', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'balance workload among all family members',
        'family123',
        mockContext
      );

      expect(result.intent.type).toBe('optimize');
      expect(result.intent.scope).toBe('all');
    });

    test('detects ambiguous requests', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'do something with chores',
        'family123',
        mockContext
      );

      expect(result.clarificationNeeded).toBe(true);
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.ambiguities.length).toBeGreaterThan(0);
    });

    test('handles empty or invalid requests', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        '',
        'family123',
        mockContext
      );

      expect(result.clarificationNeeded).toBe(true);
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('extracts multiple entities correctly', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'assign kitchen and bathroom chores to mom and dad for tomorrow morning',
        'family123',
        mockContext
      );

      expect(result.entities.length).toBeGreaterThan(3);
      expect(result.entities.some(e => e.type === 'room' && e.value === 'kitchen')).toBe(true);
      expect(result.entities.some(e => e.type === 'room' && e.value === 'bathroom')).toBe(true);
      expect(result.entities.some(e => e.type === 'member' && e.value === 'mom')).toBe(true);
      expect(result.entities.some(e => e.type === 'time' && e.value === 'tomorrow')).toBe(true);
    });

    test('handles complex compound requests', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'increase all easy chores by 5 points and assign them to the kids',
        'family123',
        mockContext
      );

      // Should detect this as ambiguous due to multiple operations
      expect(result.ambiguities).toContain('unclear_operation');
    });
  });

  describe('generateClarificationQuestions', () => {
    test('generates appropriate clarification questions', () => {
      const parseResult = {
        intent: { type: 'assign' as const, scope: 'selected' as const, target: [], modifiers: {} },
        entities: [],
        confidence: 0.5,
        ambiguities: ['unclear_target', 'unclear_member'],
        clarificationNeeded: true,
        suggestedOperation: {}
      };

      const questions = naturalLanguageProcessor.generateClarificationQuestions(parseResult);

      expect(questions).toContain('Which specific chores would you like to modify?');
      expect(questions).toContain('Which family member should be assigned these chores?');
      expect(questions.length).toBe(2);
    });

    test('handles different ambiguity types', () => {
      const parseResult = {
        intent: { type: 'reschedule' as const, scope: 'selected' as const, target: [], modifiers: {} },
        entities: [],
        confidence: 0.4,
        ambiguities: ['unclear_time', 'unclear_scope'],
        clarificationNeeded: true,
        suggestedOperation: {}
      };

      const questions = naturalLanguageProcessor.generateClarificationQuestions(parseResult);

      expect(questions).toContain('When should these chores be scheduled?');
      expect(questions).toContain('Should this apply to all chores or just specific ones?');
    });
  });

  describe('Entity extraction', () => {
    test('extracts family member names', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'assign chores to Sarah and Mike',
        'family123',
        mockContext
      );

      const memberEntities = result.entities.filter(e => e.type === 'member');
      expect(memberEntities.length).toBeGreaterThanOrEqual(2);
      expect(memberEntities.some(e => e.value === 'sarah')).toBe(true);
      expect(memberEntities.some(e => e.value === 'mike')).toBe(true);
    });

    test('extracts room and location references', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'clean the kitchen and bathroom',
        'family123',
        mockContext
      );

      const roomEntities = result.entities.filter(e => e.type === 'room');
      expect(roomEntities.some(e => e.value === 'kitchen')).toBe(true);
      expect(roomEntities.some(e => e.value === 'bathroom')).toBe(true);
    });

    test('extracts time references', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'schedule for tomorrow morning and weekend',
        'family123',
        mockContext
      );

      const timeEntities = result.entities.filter(e => e.type === 'time');
      expect(timeEntities.some(e => e.value === 'tomorrow')).toBe(true);
      expect(timeEntities.some(e => e.value === 'morning')).toBe(true);
      expect(timeEntities.some(e => e.value === 'weekend')).toBe(true);
    });

    test('extracts difficulty levels', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'make all easy chores medium difficulty',
        'family123',
        mockContext
      );

      const difficultyEntities = result.entities.filter(e => e.type === 'difficulty');
      expect(difficultyEntities.some(e => e.value === 'easy')).toBe(true);
      expect(difficultyEntities.some(e => e.value === 'medium')).toBe(true);
    });

    test('extracts point values', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'set all chores to 20 points',
        'family123',
        mockContext
      );

      const pointEntities = result.entities.filter(e => e.type === 'points');
      expect(pointEntities.some(e => e.value.includes('20'))).toBe(true);
    });

    test('removes duplicate entities', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'kitchen kitchen kitchen chores',
        'family123',
        mockContext
      );

      const kitchenEntities = result.entities.filter(e => e.value === 'kitchen');
      expect(kitchenEntities.length).toBe(1);
    });
  });

  describe('Intent classification', () => {
    test('correctly identifies assignment intent', async () => {
      const testCases = [
        'assign chores to Sarah',
        'give all tasks to Mike',
        'transfer bathroom duties to mom'
      ];

      for (const testCase of testCases) {
        const result = await naturalLanguageProcessor.parseRequest(testCase, 'family123', mockContext);
        expect(result.intent.type).toBe('assign');
      }
    });

    test('correctly identifies modification intent', async () => {
      const testCases = [
        'change points to 15',
        'modify difficulty to hard',
        'update all chores',
        'adjust the schedule'
      ];

      for (const testCase of testCases) {
        const result = await naturalLanguageProcessor.parseRequest(testCase, 'family123', mockContext);
        expect(result.intent.type).toBe('modify');
      }
    });

    test('correctly identifies deletion intent', async () => {
      const testCases = [
        'delete all chores',
        'remove kitchen tasks',
        'cancel bathroom cleaning'
      ];

      for (const testCase of testCases) {
        const result = await naturalLanguageProcessor.parseRequest(testCase, 'family123', mockContext);
        expect(result.intent.type).toBe('delete');
      }
    });

    test('correctly identifies creation intent', async () => {
      const testCases = [
        'create new chores',
        'add daily tasks',
        'make weekly routine'
      ];

      for (const testCase of testCases) {
        const result = await naturalLanguageProcessor.parseRequest(testCase, 'family123', mockContext);
        expect(result.intent.type).toBe('create');
      }
    });
  });

  describe('Confidence scoring', () => {
    test('gives high confidence to clear, unambiguous requests', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'assign kitchen chores to Sarah',
        'family123',
        mockContext
      );

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('gives low confidence to vague requests', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'do something',
        'family123',
        mockContext
      );

      expect(result.confidence).toBeLessThan(0.5);
    });

    test('adjusts confidence based on entity matches', async () => {
      const highEntityResult = await naturalLanguageProcessor.parseRequest(
        'assign kitchen chores to Sarah for tomorrow',
        'family123',
        mockContext
      );

      const lowEntityResult = await naturalLanguageProcessor.parseRequest(
        'assign chores',
        'family123',
        mockContext
      );

      expect(highEntityResult.confidence).toBeGreaterThan(lowEntityResult.confidence);
    });
  });

  describe('Operation structure generation', () => {
    test('generates correct operation structure for assignment', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'assign kitchen chores to Sarah',
        'family123',
        mockContext
      );

      expect(result.suggestedOperation.operation).toBe('assign_multiple');
      expect(result.suggestedOperation.modifications?.assignTo).toBe('sarah');
    });

    test('generates correct operation structure for rescheduling', async () => {
      const result = await naturalLanguageProcessor.parseRequest(
        'move all chores to tomorrow',
        'family123',
        mockContext
      );

      expect(result.suggestedOperation.operation).toBe('reschedule_multiple');
      expect(result.suggestedOperation.modifications?.newDueDate).toBeDefined();
    });

    test('sets approval requirements correctly', async () => {
      const deleteResult = await naturalLanguageProcessor.parseRequest(
        'delete all chores',
        'family123',
        mockContext
      );

      const assignResult = await naturalLanguageProcessor.parseRequest(
        'assign one chore to Sarah',
        'family123',
        mockContext
      );

      expect(deleteResult.suggestedOperation.requiresApproval).toBe(true);
      expect(assignResult.suggestedOperation.requiresApproval).toBe(false);
    });
  });
});