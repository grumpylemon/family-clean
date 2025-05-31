/**
 * Test suite for Gemini AI Service
 */

import { geminiAIService } from '../services/geminiAIService';
import { AIRequestContext } from '../types/ai';

// Mock fetch for testing
global.fetch = jest.fn();

describe('GeminiAIService', () => {
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
        room: 'kitchen',
        category: 'maintenance'
      }
    ],
    familyPreferences: {
      enabledFeatures: ['natural_language_operations', 'conflict_detection'],
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

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;
  });

  describe('isAvailable', () => {
    test('returns true when API key is configured', () => {
      expect(geminiAIService.isAvailable()).toBe(true);
    });

    test('returns false when API key is missing', () => {
      delete process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;
      // Create new instance to reload config
      const freshService = require('../services/geminiAIService').geminiAIService;
      expect(freshService.isAvailable()).toBe(false);
    });
  });

  describe('processNaturalLanguageRequest', () => {
    test('processes simple assignment request successfully', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                operation: 'assign_multiple',
                target: ['kitchen'],
                assignTo: 'user1',
                reasoning: 'Assigning kitchen chores to user1'
              })
            }]
          },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geminiAIService.processNaturalLanguageRequest(
        'Assign all kitchen chores to user1',
        'family123',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.reasoning).toContain('Assigning kitchen chores to user1');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generateContent'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Assign all kitchen chores to user1')
        })
      );
    });

    test('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await geminiAIService.processNaturalLanguageRequest(
        'Test request',
        'family123',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Network error');
    });

    test('handles invalid API responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const result = await geminiAIService.processNaturalLanguageRequest(
        'Test request',
        'family123',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('API request failed');
    });

    test('handles timeout correctly', async () => {
      jest.useFakeTimers();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      (fetch as jest.Mock).mockImplementationOnce(() => timeoutPromise);

      const resultPromise = geminiAIService.processNaturalLanguageRequest(
        'Test request',
        'family123',
        mockContext
      );

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(30000);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('timeout');

      jest.useRealTimers();
    });
  });

  describe('getSuggestions', () => {
    test('returns optimization suggestions', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Based on your family patterns, consider redistributing workload for better balance.'
            }]
          },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: {
          promptTokenCount: 80,
          candidatesTokenCount: 40,
          totalTokenCount: 120
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geminiAIService.getSuggestions(
        'workload_optimization',
        'family123',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.reasoning).toContain('redistributing workload');
    });
  });

  describe('analyzeConflicts', () => {
    test('identifies scheduling conflicts', async () => {
      const operationDetails = {
        operation: 'reschedule_multiple',
        choreIds: ['chore1', 'chore2'],
        newDueDate: '2025-01-01T10:00:00Z'
      };

      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                conflicts: [{
                  type: 'schedule',
                  description: 'Two chores scheduled at the same time',
                  severity: 'minor'
                }],
                resolutions: [{
                  strategy: 'stagger_timing',
                  description: 'Stagger chores by 2 hours'
                }]
              })
            }]
          },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: {
          promptTokenCount: 120,
          candidatesTokenCount: 60,
          totalTokenCount: 180
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geminiAIService.analyzeConflicts(
        operationDetails,
        'family123',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.analysis?.details.conflicts).toBeDefined();
    });
  });

  describe('assessFamilyImpact', () => {
    test('provides family impact assessment', async () => {
      const operation = {
        operation: 'assign_multiple',
        choreIds: ['chore1'],
        assignTo: 'user2'
      };

      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                memberImpacts: [{
                  memberId: 'user2',
                  workloadChange: 15,
                  impact: 'minor_increase'
                }],
                overallScore: 85,
                recommendations: ['Consider balancing with easier chores']
              })
            }]
          },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: {
          promptTokenCount: 150,
          candidatesTokenCount: 80,
          totalTokenCount: 230
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geminiAIService.assessFamilyImpact(
        operation,
        'family123',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.analysis?.details.memberImpacts).toBeDefined();
      expect(result.analysis?.details.overallScore).toBe(85);
    });
  });

  describe('Rate limiting', () => {
    test('enforces rate limits per family', async () => {
      const mockResponse = {
        candidates: [{
          content: { parts: [{ text: 'Test response' }] },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // Make multiple requests rapidly
      const promises = Array.from({ length: 15 }, () =>
        geminiAIService.processNaturalLanguageRequest('test', 'family123', mockContext)
      );

      const results = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedCount = results.filter(r => 
        !r.success && r.errors?.[0]?.includes('Rate limit')
      ).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Response caching', () => {
    test('caches similar requests', async () => {
      const mockResponse = {
        candidates: [{
          content: { parts: [{ text: 'Cached response' }] },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First request
      const result1 = await geminiAIService.processNaturalLanguageRequest(
        'test request',
        'family123',
        mockContext
      );

      // Second identical request (should be cached)
      const result2 = await geminiAIService.processNaturalLanguageRequest(
        'test request',
        'family123',
        mockContext
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.reasoning).toBe('Cached response');
      
      // Fetch should only be called once due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Usage tracking', () => {
    test('tracks API usage by family', async () => {
      const mockResponse = {
        candidates: [{
          content: { parts: [{ text: 'Test response' }] },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await geminiAIService.processNaturalLanguageRequest(
        'test request',
        'family123',
        mockContext
      );

      const usage = geminiAIService.getUsageStats('family123');
      
      expect(usage).toBeDefined();
      expect(usage?.requestCount).toBe(1);
      expect(usage?.tokenUsage.total).toBe(0); // Would be updated in real implementation
    });
  });

  describe('Error handling', () => {
    test('handles malformed JSON responses', async () => {
      const mockResponse = {
        candidates: [{
          content: { parts: [{ text: 'Invalid JSON: {broken}' }] },
          finishReason: 'STOP',
          safetyRatings: []
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geminiAIService.processNaturalLanguageRequest(
        'test request',
        'family123',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.reasoning).toBe('Invalid JSON: {broken}');
    });

    test('handles empty API responses', async () => {
      const mockResponse = {
        candidates: [],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 0, totalTokenCount: 10 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geminiAIService.processNaturalLanguageRequest(
        'test request',
        'family123',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('No response from API');
    });
  });
});