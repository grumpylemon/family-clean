/**
 * Rotation Admin Service
 * 
 * Handles administrative functions for the rotation system including:
 * - Strategy configuration
 * - Fairness monitoring
 * - Member preference management
 * - Analytics and reporting
 * - Testing and validation
 */

import { 
  safeCollection,
  isMockImplementation 
} from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// Types for rotation admin functionality
export type RotationStrategy = 
  | 'round_robin'
  | 'workload_balance'
  | 'skill_based'
  | 'calendar_aware'
  | 'random_fair'
  | 'preference_based'
  | 'mixed_strategy';

export interface RotationConfiguration {
  familyId: string;
  activeStrategy: RotationStrategy;
  mixedStrategyWeights?: {
    fairness: number;
    preference: number;
    availability: number;
    skill: number;
    workload: number;
  };
  fairnessThreshold: number;
  workloadVarianceLimit: number;
  enabledFeatures: {
    calendarIntegration: boolean;
    skillBasedAssignment: boolean;
    preferenceOptimization: boolean;
    automaticRebalancing: boolean;
  };
  lastModified: string;
  modifiedBy: string;
}

export interface FairnessMetrics {
  familyId: string;
  date: string;
  overallScore: number;
  workloadVariance: number;
  preferenceRespectRate: number;
  memberWorkloads: MemberWorkload[];
  recommendations: FairnessRecommendation[];
  calculatedAt: string;
}

export interface MemberWorkload {
  userId: string;
  userName: string;
  currentChores: number;
  weeklyPoints: number;
  capacityUtilization: number;
  fairnessScore: number;
  preferenceMatch: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface FairnessRecommendation {
  id: string;
  type: 'rebalance' | 'preference' | 'capacity' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionLabel: string;
  impact: string;
  affectedMembers: string[];
  createdAt: string;
}

export interface MemberPreferences {
  userId: string;
  familyId: string;
  chorePreferences: Record<string, number>; // -2 to +2 scale
  skillCertifications: string[];
  availabilityPattern: {
    [day: string]: { start: string; end: string; available: boolean }[];
  };
  capacityLimits: {
    maxDailyChores: number;
    maxWeeklyPoints: number;
    preferredTimeSlots: string[];
  };
  specialSettings: {
    skipWeekends: boolean;
    requiresSupervision: boolean;
    canTakeOverChores: boolean;
    preferGroupTasks: boolean;
  };
  lastUpdated: string;
}

export interface RotationAnalytics {
  familyId: string;
  period: string;
  strategyEffectiveness: StrategyPerformance[];
  fairnessTrends: FairnessTrend[];
  memberSatisfaction: MemberSatisfactionScore[];
  systemHealth: {
    averageResponseTime: number;
    conflictRate: number;
    automationSuccess: number;
    userSatisfaction: number;
  };
  generatedAt: string;
}

export interface StrategyPerformance {
  strategy: RotationStrategy;
  avgFairnessScore: number;
  memberSatisfaction: number;
  conflictRate: number;
  usageCount: number;
  lastUsed: string;
}

export interface FairnessTrend {
  date: string;
  equityScore: number;
  workloadVariance: number;
  preferenceRespectRate: number;
  rebalancingActions: number;
}

export interface MemberSatisfactionScore {
  userId: string;
  userName: string;
  satisfactionScore: number;
  preferenceMatch: number;
  workloadFairness: number;
  trend: 'improving' | 'declining' | 'stable';
}

class RotationAdminService {
  /**
   * Get rotation configuration for a family
   */
  async getRotationConfiguration(familyId: string): Promise<RotationConfiguration | null> {
    try {
      if (isMockImplementation()) {
        // Return mock configuration for testing
        return {
          familyId,
          activeStrategy: 'round_robin',
          fairnessThreshold: 75,
          workloadVarianceLimit: 25,
          enabledFeatures: {
            calendarIntegration: false,
            skillBasedAssignment: true,
            preferenceOptimization: true,
            automaticRebalancing: true,
          },
          lastModified: new Date().toISOString(),
          modifiedBy: 'admin',
        };
      }

      const configDoc = await getDoc(
        doc(safeCollection('rotationConfigurations'), familyId)
      );

      if (configDoc.exists()) {
        return configDoc.data() as RotationConfiguration;
      }

      return null;
    } catch (error) {
      console.error('Error getting rotation configuration:', error);
      throw error;
    }
  }

  /**
   * Update rotation configuration
   */
  async updateRotationConfiguration(
    config: Partial<RotationConfiguration> & { familyId: string; modifiedBy: string }
  ): Promise<void> {
    try {
      if (isMockImplementation()) {
        console.log('Mock: Updated rotation configuration for family', config.familyId);
        return;
      }

      const configRef = doc(safeCollection('rotationConfigurations'), config.familyId);
      
      await setDoc(configRef, {
        ...config,
        lastModified: new Date().toISOString(),
      }, { merge: true });

      console.log('Rotation configuration updated successfully');
    } catch (error) {
      console.error('Error updating rotation configuration:', error);
      throw error;
    }
  }

  /**
   * Get current fairness metrics for a family
   */
  async getFairnessMetrics(familyId: string): Promise<FairnessMetrics | null> {
    try {
      if (isMockImplementation()) {
        // Return mock fairness metrics
        return {
          familyId,
          date: new Date().toISOString().split('T')[0],
          overallScore: 87,
          workloadVariance: 18,
          preferenceRespectRate: 73,
          memberWorkloads: [
            {
              userId: '1',
              userName: 'Sarah',
              currentChores: 8,
              weeklyPoints: 240,
              capacityUtilization: 75,
              fairnessScore: 92,
              preferenceMatch: 85,
              trendDirection: 'up',
            },
            {
              userId: '2',
              userName: 'Mike',
              currentChores: 6,
              weeklyPoints: 180,
              capacityUtilization: 60,
              fairnessScore: 78,
              preferenceMatch: 65,
              trendDirection: 'down',
            },
          ],
          recommendations: [
            {
              id: '1',
              type: 'rebalance',
              priority: 'medium',
              title: 'Workload Imbalance Detected',
              description: 'Emma is approaching capacity limit while Mike has availability.',
              actionLabel: 'Rebalance Now',
              impact: 'Would improve overall fairness by 12%',
              affectedMembers: ['Emma', 'Mike'],
              createdAt: new Date().toISOString(),
            },
          ],
          calculatedAt: new Date().toISOString(),
        };
      }

      const metricsQuery = query(
        safeCollection('fairnessMetrics'),
        where('familyId', '==', familyId),
        orderBy('calculatedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(metricsQuery);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as FairnessMetrics;
      }

      return null;
    } catch (error) {
      console.error('Error getting fairness metrics:', error);
      throw error;
    }
  }

  /**
   * Get member preferences
   */
  async getMemberPreferences(familyId: string, userId: string): Promise<MemberPreferences | null> {
    try {
      if (isMockImplementation()) {
        return {
          userId,
          familyId,
          chorePreferences: {
            individual: 1,
            family: 0,
            shared: -1,
            pet: 2,
            room: 0,
          },
          skillCertifications: ['Cleaning', 'Pet Care'],
          availabilityPattern: {},
          capacityLimits: {
            maxDailyChores: 3,
            maxWeeklyPoints: 200,
            preferredTimeSlots: ['morning', 'evening'],
          },
          specialSettings: {
            skipWeekends: false,
            requiresSupervision: false,
            canTakeOverChores: true,
            preferGroupTasks: false,
          },
          lastUpdated: new Date().toISOString(),
        };
      }

      const prefsDoc = await getDoc(
        doc(safeCollection('memberPreferences'), `${familyId}_${userId}`)
      );

      if (prefsDoc.exists()) {
        return prefsDoc.data() as MemberPreferences;
      }

      return null;
    } catch (error) {
      console.error('Error getting member preferences:', error);
      throw error;
    }
  }

  /**
   * Update member preferences
   */
  async updateMemberPreferences(preferences: MemberPreferences): Promise<void> {
    try {
      if (isMockImplementation()) {
        console.log('Mock: Updated preferences for user', preferences.userId);
        return;
      }

      const prefsRef = doc(
        safeCollection('memberPreferences'), 
        `${preferences.familyId}_${preferences.userId}`
      );
      
      await setDoc(prefsRef, {
        ...preferences,
        lastUpdated: new Date().toISOString(),
      });

      console.log('Member preferences updated successfully');
    } catch (error) {
      console.error('Error updating member preferences:', error);
      throw error;
    }
  }

  /**
   * Get rotation analytics for a family
   */
  async getRotationAnalytics(familyId: string, period: string = 'week'): Promise<RotationAnalytics | null> {
    try {
      if (isMockImplementation()) {
        return {
          familyId,
          period,
          strategyEffectiveness: [
            {
              strategy: 'round_robin',
              avgFairnessScore: 78,
              memberSatisfaction: 82,
              conflictRate: 5,
              usageCount: 15,
              lastUsed: new Date().toISOString(),
            },
            {
              strategy: 'calendar_aware',
              avgFairnessScore: 92,
              memberSatisfaction: 88,
              conflictRate: 2,
              usageCount: 8,
              lastUsed: new Date().toISOString(),
            },
          ],
          fairnessTrends: [
            { date: '2024-01-01', equityScore: 82, workloadVariance: 22, preferenceRespectRate: 70, rebalancingActions: 2 },
            { date: '2024-01-02', equityScore: 85, workloadVariance: 20, preferenceRespectRate: 72, rebalancingActions: 1 },
            { date: '2024-01-03', equityScore: 87, workloadVariance: 18, preferenceRespectRate: 73, rebalancingActions: 0 },
          ],
          memberSatisfaction: [
            {
              userId: '1',
              userName: 'Sarah',
              satisfactionScore: 88,
              preferenceMatch: 85,
              workloadFairness: 92,
              trend: 'improving',
            },
          ],
          systemHealth: {
            averageResponseTime: 1.2,
            conflictRate: 3,
            automationSuccess: 94,
            userSatisfaction: 87,
          },
          generatedAt: new Date().toISOString(),
        };
      }

      const analyticsQuery = query(
        safeCollection('rotationAnalytics'),
        where('familyId', '==', familyId),
        where('period', '==', period),
        orderBy('generatedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(analyticsQuery);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as RotationAnalytics;
      }

      return null;
    } catch (error) {
      console.error('Error getting rotation analytics:', error);
      throw error;
    }
  }

  /**
   * Force rebalance rotation assignments
   */
  async forceRebalance(familyId: string, adminId: string): Promise<void> {
    try {
      if (isMockImplementation()) {
        console.log('Mock: Force rebalancing rotation for family', familyId);
        return;
      }

      // This would trigger the rotation service to rebalance assignments
      const rebalanceDoc = {
        familyId,
        triggeredBy: adminId,
        triggeredAt: new Date().toISOString(),
        status: 'pending',
      };

      await addDoc(safeCollection('rebalanceRequests'), rebalanceDoc);
      console.log('Rebalance request submitted successfully');
    } catch (error) {
      console.error('Error submitting rebalance request:', error);
      throw error;
    }
  }

  /**
   * Test rotation strategy without applying changes
   */
  async testRotationStrategy(
    familyId: string, 
    strategy: RotationStrategy, 
    testParams?: any
  ): Promise<any> {
    try {
      if (isMockImplementation()) {
        // Return mock test results
        return {
          previewAssignments: [
            { choreId: '1', currentAssignee: 'Sarah', newAssignee: 'Mike', reason: 'workload_balance' },
            { choreId: '2', currentAssignee: 'Mike', newAssignee: 'Emma', reason: 'preference_match' },
          ],
          fairnessImpact: {
            currentScore: 87,
            predictedScore: 93,
            improvement: 6,
          },
          memberImpact: [
            { userId: '1', name: 'Sarah', currentWorkload: 8, newWorkload: 6, change: -2 },
            { userId: '2', name: 'Mike', currentWorkload: 6, newWorkload: 7, change: +1 },
          ],
          testCompletedAt: new Date().toISOString(),
        };
      }

      // This would call the rotation service with test mode enabled
      // For now, return mock results
      throw new Error('Real strategy testing not yet implemented');
    } catch (error) {
      console.error('Error testing rotation strategy:', error);
      throw error;
    }
  }

  /**
   * Apply a fairness recommendation
   */
  async applyRecommendation(familyId: string, recommendationId: string, adminId: string): Promise<void> {
    try {
      if (isMockImplementation()) {
        console.log('Mock: Applied recommendation', recommendationId, 'for family', familyId);
        return;
      }

      const actionDoc = {
        familyId,
        recommendationId,
        appliedBy: adminId,
        appliedAt: new Date().toISOString(),
        status: 'pending',
      };

      await addDoc(safeCollection('recommendationActions'), actionDoc);
      console.log('Recommendation action submitted successfully');
    } catch (error) {
      console.error('Error applying recommendation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rotationAdminService = new RotationAdminService();