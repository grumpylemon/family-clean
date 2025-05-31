import { choreCardService } from '../services/choreCardService';
import { educationalContentService } from '../services/educationalContentService';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' }
  },
  safeCollection: jest.fn(() => ({}))
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
}));

describe('Advanced Chore Cards System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ChoreCardService', () => {
    test('should create advanced card successfully', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'new-card-123' });

      const mockCard = {
        choreId: 'test-chore-123',
        instructions: {},
        educationalContent: {
          facts: [],
          quotes: [],
          learningObjectives: []
        },
        gamification: {
          specialAchievements: [],
          qualityMultipliers: {
            incomplete: 0,
            partial: 0.5,
            complete: 1.0,
            excellent: 1.2
          },
          learningRewards: {
            instructionCompleted: 5,
            factEngagement: 2,
            certificationProgress: 10
          },
          certificationBonuses: {
            basic: 10,
            intermediate: 20,
            advanced: 30
          }
        },
        createdBy: 'test-user-123',
        familyId: 'test-family-456',
        isActive: true,
        version: 1
      };

      const cardId = await choreCardService.createAdvancedCard(mockCard);
      
      expect(cardId).toBe('new-card-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          choreId: 'test-chore-123',
          familyId: 'test-family-456',
          isActive: true,
          version: 1
        })
      );
    });

    test('should get advanced card by chore ID', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'card-123',
          data: () => ({
            choreId: 'test-chore-123',
            familyId: 'test-family-456'
          })
        }]
      });

      const card = await choreCardService.getAdvancedCard('test-chore-123');
      
      expect(card).toEqual({
        id: 'card-123',
        choreId: 'test-chore-123',
        familyId: 'test-family-456'
      });
    });

    test('should return null when no advanced card found', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({ empty: true });

      const card = await choreCardService.getAdvancedCard('nonexistent-chore');
      
      expect(card).toBeNull();
    });

    test('should calculate assignment score based on preferences', async () => {
      // Mock high satisfaction preference
      jest.spyOn(choreCardService, 'getChorePreference').mockResolvedValue({
        userId: 'user-123',
        choreId: 'chore-456',
        satisfactionRating: 5,
        lastUpdated: new Date().toISOString()
      });

      jest.spyOn(choreCardService, 'getPerformanceMetrics').mockResolvedValue(null);
      jest.spyOn(choreCardService, 'getCertificationStatus').mockResolvedValue(null);

      const score = await choreCardService.calculateAssignmentScore('user-123', 'chore-456');
      
      // Should be high score due to high satisfaction
      expect(score).toBeGreaterThan(60);
    });

    test('should recommend best assignee from available users', async () => {
      const availableUsers = ['user-1', 'user-2', 'user-3'];
      
      // Mock scores: user-2 has highest score
      jest.spyOn(choreCardService, 'calculateAssignmentScore')
        .mockImplementation(async (userId) => {
          switch (userId) {
            case 'user-1': return 60;
            case 'user-2': return 85; // Highest
            case 'user-3': return 45;
            default: return 50;
          }
        });

      const recommendedUser = await choreCardService.getRecommendedAssignee('chore-456', availableUsers);
      
      expect(recommendedUser).toBe('user-2');
    });
  });

  describe('EducationalContentService', () => {
    test('should get random fact for age group', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'fact-1',
          data: () => ({
            content: 'Test educational fact',
            ageGroups: ['child'],
            category: 'science'
          })
        }]
      });

      const fact = await educationalContentService.getRandomFact('child');
      
      expect(fact).toBeTruthy();
      expect(fact?.content).toBe('Test educational fact');
    });

    test('should return mock fact when no facts found', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({ empty: true });

      const fact = await educationalContentService.getRandomFact('adult');
      
      expect(fact).toBeTruthy();
      expect(fact?.content).toBeTruthy();
    });

    test('should get random quote for age group', async () => {
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'quote-1',
          data: () => ({
            text: 'Test inspirational quote',
            ageGroups: ['teen'],
            themes: ['motivation']
          })
        }]
      });

      const quote = await educationalContentService.getRandomQuote('teen');
      
      expect(quote).toBeTruthy();
      expect(quote?.text).toBe('Test inspirational quote');
    });

    test('should add new educational fact', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'fact-123' });

      const factId = await educationalContentService.addEducationalFact({
        content: 'New educational fact',
        ageGroups: ['adult'],
        category: 'science',
        sources: ['Test Source']
      });
      
      expect(factId).toBe('fact-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          content: 'New educational fact',
          ageGroups: ['adult'],
          category: 'science'
        })
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete advanced card workflow', async () => {
      // Mock card creation
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockResolvedValue({ id: 'card-123' });

      // Mock card retrieval
      const mockGetDocs = require('firebase/firestore').getDocs;
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'card-123',
          data: () => ({
            choreId: 'test-chore',
            instructions: {
              adult: {
                id: 'inst-1',
                ageGroup: 'adult',
                steps: [],
                prerequisites: [],
                totalEstimatedMinutes: 30,
                safetyWarnings: [],
                tips: []
              }
            }
          })
        }]
      });

      // Create advanced card
      const cardData = {
        choreId: 'test-chore',
        instructions: {},
        educationalContent: {
          facts: [],
          quotes: [],
          learningObjectives: []
        },
        gamification: {
          specialAchievements: [],
          qualityMultipliers: {
            incomplete: 0,
            partial: 0.5,
            complete: 1.0,
            excellent: 1.2
          },
          learningRewards: {
            instructionCompleted: 5,
            factEngagement: 2,
            certificationProgress: 10
          },
          certificationBonuses: {
            basic: 10,
            intermediate: 20,
            advanced: 30
          }
        },
        createdBy: 'test-user-123',
        familyId: 'family-123',
        isActive: true,
        version: 1
      };

      const cardId = await choreCardService.createAdvancedCard(cardData);
      expect(cardId).toBe('card-123');

      // Retrieve the card
      const retrievedCard = await choreCardService.getAdvancedCard('test-chore');
      expect(retrievedCard).toBeTruthy();
      expect(retrievedCard?.choreId).toBe('test-chore');
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase errors gracefully', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      mockAddDoc.mockRejectedValue(new Error('Firebase error'));

      const cardData = {
        choreId: 'test-chore',
        instructions: {},
        educationalContent: {
          facts: [],
          quotes: [],
          learningObjectives: []
        },
        gamification: {
          specialAchievements: [],
          qualityMultipliers: {
            incomplete: 0,
            partial: 0.5,
            complete: 1.0,
            excellent: 1.2
          },
          learningRewards: {
            instructionCompleted: 5,
            factEngagement: 2,
            certificationProgress: 10
          },
          certificationBonuses: {
            basic: 10,
            intermediate: 20,
            advanced: 30
          }
        },
        createdBy: 'test-user-123',
        familyId: 'family-123',
        isActive: true,
        version: 1
      };

      await expect(
        choreCardService.createAdvancedCard(cardData)
      ).rejects.toThrow('Firebase error');
    });

    test('should return default score on calculation error', async () => {
      jest.spyOn(choreCardService, 'getChorePreference').mockRejectedValue(new Error('Network error'));
      
      const score = await choreCardService.calculateAssignmentScore('user-123', 'chore-456');
      
      expect(score).toBe(50); // Default score
    });
  });
});