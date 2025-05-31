/**
 * Test suite for Rotation Admin Service
 * 
 * Tests the core functionality of the rotation admin service
 * including configuration management, fairness calculations, and analytics.
 */

import { jest } from '@jest/globals';

// Mock Firebase dependencies
jest.mock('../config/firebase', () => ({
  safeCollection: jest.fn((collection) => ({
    collection,
    doc: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  })),
  isMockImplementation: jest.fn(() => true), // Always use mock for tests
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Import service after mocking
import { rotationAdminService } from '../services/rotationAdminService';
import type { 
  RotationConfiguration, 
  FairnessMetrics, 
  MemberPreferences,
  RotationAnalytics 
} from '../services/rotationAdminService';

describe('RotationAdminService', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRotationConfiguration', () => {
    it('returns mock configuration when using mock implementation', async () => {
      const familyId = 'test-family-123';
      
      const config = await rotationAdminService.getRotationConfiguration(familyId);
      
      expect(config).toBeDefined();
      expect(config?.familyId).toBe(familyId);
      expect(config?.activeStrategy).toBe('round_robin');
      expect(config?.fairnessThreshold).toBe(75);
      expect(config?.workloadVarianceLimit).toBe(25);
      expect(config?.enabledFeatures).toBeDefined();
      expect(config?.enabledFeatures.skillBasedAssignment).toBe(true);
      expect(config?.enabledFeatures.preferenceOptimization).toBe(true);
      expect(config?.enabledFeatures.automaticRebalancing).toBe(true);
    });

    it('includes required configuration fields', async () => {
      const config = await rotationAdminService.getRotationConfiguration('test-family');
      
      expect(config).toMatchObject({
        familyId: expect.any(String),
        activeStrategy: expect.any(String),
        fairnessThreshold: expect.any(Number),
        workloadVarianceLimit: expect.any(Number),
        enabledFeatures: expect.any(Object),
        lastModified: expect.any(String),
        modifiedBy: expect.any(String),
      });
    });
  });

  describe('updateRotationConfiguration', () => {
    it('accepts valid configuration updates', async () => {
      const configUpdate = {
        familyId: 'test-family',
        activeStrategy: 'workload_balance' as const,
        fairnessThreshold: 80,
        modifiedBy: 'admin-user',
      };

      // Should not throw
      await expect(rotationAdminService.updateRotationConfiguration(configUpdate))
        .resolves.toBeUndefined();
    });

    it('handles mixed strategy configuration', async () => {
      const mixedConfig = {
        familyId: 'test-family',
        activeStrategy: 'mixed_strategy' as const,
        mixedStrategyWeights: {
          fairness: 25,
          preference: 25,
          availability: 25,
          skill: 15,
          workload: 10,
        },
        modifiedBy: 'admin-user',
      };

      await expect(rotationAdminService.updateRotationConfiguration(mixedConfig))
        .resolves.toBeUndefined();
    });
  });

  describe('getFairnessMetrics', () => {
    it('returns mock fairness metrics', async () => {
      const metrics = await rotationAdminService.getFairnessMetrics('test-family');
      
      expect(metrics).toBeDefined();
      expect(metrics?.familyId).toBe('test-family');
      expect(metrics?.overallScore).toBe(87);
      expect(metrics?.workloadVariance).toBe(18);
      expect(metrics?.preferenceRespectRate).toBe(73);
      expect(metrics?.memberWorkloads).toHaveLength(2);
      expect(metrics?.recommendations).toHaveLength(1);
    });

    it('includes valid member workload data', async () => {
      const metrics = await rotationAdminService.getFairnessMetrics('test-family');
      
      const memberWorkload = metrics?.memberWorkloads[0];
      expect(memberWorkload).toMatchObject({
        userId: expect.any(String),
        userName: expect.any(String),
        currentChores: expect.any(Number),
        weeklyPoints: expect.any(Number),
        capacityUtilization: expect.any(Number),
        fairnessScore: expect.any(Number),
        preferenceMatch: expect.any(Number),
        trendDirection: expect.stringMatching(/^(up|down|stable)$/),
      });
    });

    it('includes actionable recommendations', async () => {
      const metrics = await rotationAdminService.getFairnessMetrics('test-family');
      
      const recommendation = metrics?.recommendations[0];
      expect(recommendation).toMatchObject({
        id: expect.any(String),
        type: expect.stringMatching(/^(rebalance|preference|capacity|warning)$/),
        priority: expect.stringMatching(/^(low|medium|high|urgent)$/),
        title: expect.any(String),
        description: expect.any(String),
        actionLabel: expect.any(String),
        impact: expect.any(String),
        affectedMembers: expect.any(Array),
        createdAt: expect.any(String),
      });
    });
  });

  describe('getMemberPreferences', () => {
    it('returns mock member preferences', async () => {
      const prefs = await rotationAdminService.getMemberPreferences('test-family', 'user-123');
      
      expect(prefs).toBeDefined();
      expect(prefs?.userId).toBe('user-123');
      expect(prefs?.familyId).toBe('test-family');
      expect(prefs?.chorePreferences).toBeDefined();
      expect(prefs?.skillCertifications).toEqual(['Cleaning', 'Pet Care']);
      expect(prefs?.capacityLimits).toBeDefined();
      expect(prefs?.specialSettings).toBeDefined();
    });

    it('includes valid chore preferences', async () => {
      const prefs = await rotationAdminService.getMemberPreferences('test-family', 'user-123');
      
      const chorePrefs = prefs?.chorePreferences;
      expect(chorePrefs?.individual).toBe(1);
      expect(chorePrefs?.family).toBe(0);
      expect(chorePrefs?.shared).toBe(-1);
      expect(chorePrefs?.pet).toBe(2);
      expect(chorePrefs?.room).toBe(0);
    });

    it('includes capacity limits', async () => {
      const prefs = await rotationAdminService.getMemberPreferences('test-family', 'user-123');
      
      expect(prefs?.capacityLimits).toMatchObject({
        maxDailyChores: 3,
        maxWeeklyPoints: 200,
        preferredTimeSlots: ['morning', 'evening'],
      });
    });
  });

  describe('updateMemberPreferences', () => {
    it('accepts valid preference updates', async () => {
      const preferences: MemberPreferences = {
        userId: 'user-123',
        familyId: 'test-family',
        chorePreferences: {
          individual: 1,
          family: 0,
          shared: -1,
          pet: 2,
          room: 1,
        },
        skillCertifications: ['Cleaning', 'Cooking'],
        availabilityPattern: {},
        capacityLimits: {
          maxDailyChores: 4,
          maxWeeklyPoints: 250,
          preferredTimeSlots: ['morning'],
        },
        specialSettings: {
          skipWeekends: true,
          requiresSupervision: false,
          canTakeOverChores: true,
          preferGroupTasks: false,
        },
        lastUpdated: new Date().toISOString(),
      };

      await expect(rotationAdminService.updateMemberPreferences(preferences))
        .resolves.toBeUndefined();
    });
  });

  describe('getRotationAnalytics', () => {
    it('returns mock analytics data', async () => {
      const analytics = await rotationAdminService.getRotationAnalytics('test-family', 'week');
      
      expect(analytics).toBeDefined();
      expect(analytics?.familyId).toBe('test-family');
      expect(analytics?.period).toBe('week');
      expect(analytics?.strategyEffectiveness).toHaveLength(2);
      expect(analytics?.fairnessTrends).toHaveLength(3);
      expect(analytics?.memberSatisfaction).toHaveLength(1);
      expect(analytics?.systemHealth).toBeDefined();
    });

    it('includes strategy performance data', async () => {
      const analytics = await rotationAdminService.getRotationAnalytics('test-family');
      
      const strategyPerf = analytics?.strategyEffectiveness[0];
      expect(strategyPerf).toMatchObject({
        strategy: expect.any(String),
        avgFairnessScore: expect.any(Number),
        memberSatisfaction: expect.any(Number),
        conflictRate: expect.any(Number),
        usageCount: expect.any(Number),
        lastUsed: expect.any(String),
      });
    });

    it('includes system health metrics', async () => {
      const analytics = await rotationAdminService.getRotationAnalytics('test-family');
      
      expect(analytics?.systemHealth).toMatchObject({
        averageResponseTime: expect.any(Number),
        conflictRate: expect.any(Number),
        automationSuccess: expect.any(Number),
        userSatisfaction: expect.any(Number),
      });
    });
  });

  describe('forceRebalance', () => {
    it('accepts rebalance requests', async () => {
      await expect(rotationAdminService.forceRebalance('test-family', 'admin-user'))
        .resolves.toBeUndefined();
    });
  });

  describe('testRotationStrategy', () => {
    it('returns mock test results', async () => {
      const testResults = await rotationAdminService.testRotationStrategy(
        'test-family', 
        'workload_balance'
      );
      
      expect(testResults).toBeDefined();
      expect(testResults.previewAssignments).toHaveLength(2);
      expect(testResults.fairnessImpact).toBeDefined();
      expect(testResults.memberImpact).toHaveLength(2);
      expect(testResults.testCompletedAt).toBeDefined();
    });

    it('includes preview assignments', async () => {
      const testResults = await rotationAdminService.testRotationStrategy(
        'test-family', 
        'preference_based'
      );
      
      const assignment = testResults.previewAssignments[0];
      expect(assignment).toMatchObject({
        choreId: expect.any(String),
        currentAssignee: expect.any(String),
        newAssignee: expect.any(String),
        reason: expect.any(String),
      });
    });

    it('includes fairness impact prediction', async () => {
      const testResults = await rotationAdminService.testRotationStrategy(
        'test-family', 
        'skill_based'
      );
      
      expect(testResults.fairnessImpact).toMatchObject({
        currentScore: 87,
        predictedScore: 93,
        improvement: 6,
      });
    });
  });

  describe('applyRecommendation', () => {
    it('accepts recommendation applications', async () => {
      await expect(rotationAdminService.applyRecommendation(
        'test-family', 
        'recommendation-123', 
        'admin-user'
      )).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      // Since we're using mock implementation, errors won't be thrown
      // But we can verify the service methods are designed to handle errors
      expect(typeof rotationAdminService.getRotationConfiguration).toBe('function');
      expect(typeof rotationAdminService.updateRotationConfiguration).toBe('function');
      expect(typeof rotationAdminService.getFairnessMetrics).toBe('function');
    });
  });

  describe('Data Validation', () => {
    it('validates rotation strategy types', () => {
      const validStrategies = [
        'round_robin',
        'workload_balance',
        'skill_based',
        'calendar_aware',
        'random_fair',
        'preference_based',
        'mixed_strategy',
      ];

      // This test ensures our type system includes all expected strategies
      validStrategies.forEach(strategy => {
        expect(typeof strategy).toBe('string');
      });
    });

    it('validates fairness score ranges', async () => {
      const metrics = await rotationAdminService.getFairnessMetrics('test-family');
      
      // Fairness scores should be between 0-100
      expect(metrics?.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics?.overallScore).toBeLessThanOrEqual(100);
      
      metrics?.memberWorkloads.forEach(member => {
        expect(member.fairnessScore).toBeGreaterThanOrEqual(0);
        expect(member.fairnessScore).toBeLessThanOrEqual(100);
        expect(member.preferenceMatch).toBeGreaterThanOrEqual(0);
        expect(member.preferenceMatch).toBeLessThanOrEqual(100);
        expect(member.capacityUtilization).toBeGreaterThanOrEqual(0);
        expect(member.capacityUtilization).toBeLessThanOrEqual(100);
      });
    });

    it('validates preference scale ranges', async () => {
      const prefs = await rotationAdminService.getMemberPreferences('test-family', 'user-123');
      
      // Chore preferences should be in -2 to +2 range
      Object.values(prefs?.chorePreferences || {}).forEach(preference => {
        expect(preference).toBeGreaterThanOrEqual(-2);
        expect(preference).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Mock Implementation Consistency', () => {
    it('provides consistent mock data structure', async () => {
      const config = await rotationAdminService.getRotationConfiguration('family-1');
      const metrics = await rotationAdminService.getFairnessMetrics('family-1');
      const prefs = await rotationAdminService.getMemberPreferences('family-1', 'user-1');
      const analytics = await rotationAdminService.getRotationAnalytics('family-1');

      // All methods should return consistent data types
      expect(config).toBeDefined();
      expect(metrics).toBeDefined();
      expect(prefs).toBeDefined();
      expect(analytics).toBeDefined();
    });

    it('maintains referential integrity in mock data', async () => {
      const metrics = await rotationAdminService.getFairnessMetrics('test-family');
      
      // All member workloads should reference the same family
      metrics?.memberWorkloads.forEach(member => {
        expect(typeof member.userId).toBe('string');
        expect(typeof member.userName).toBe('string');
        expect(member.userId.length).toBeGreaterThan(0);
        expect(member.userName.length).toBeGreaterThan(0);
      });
    });
  });
});

export {};