/**
 * Comprehensive test suite for rotation service
 * Tests all rotation strategies and fairness calculations
 */

import { rotationService } from '../services/rotationService';
import { fairnessEngine } from '../services/fairnessEngine';
import { scheduleIntelligence } from '../services/scheduleIntelligence';
import {
  RotationStrategy,
  RotationContext,
  MemberWorkload,
  FamilyRotationSettings
} from '../types/rotation';
import { FamilyMember, Chore, ChoreDifficulty } from '../types';

// Mock the dependencies
jest.mock('../services/fairnessEngine');
jest.mock('../services/scheduleIntelligence');
jest.mock('../services/firestore');

const mockFairnessEngine = fairnessEngine as jest.Mocked<typeof fairnessEngine>;
const mockScheduleIntelligence = scheduleIntelligence as jest.Mocked<typeof scheduleIntelligence>;

describe('RotationService', () => {
  // Test data setup
  const mockFamily = {
    id: 'test-family',
    name: 'Test Family',
    adminId: 'admin-123',
    joinCode: 'TEST123',
    members: [],
    settings: {
      defaultChorePoints: 10,
      defaultChoreCooldownHours: 24,
      allowPointTransfers: false,
      weekStartDay: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberRotationOrder: ['member-1', 'member-2', 'member-3'],
    nextFamilyChoreAssigneeIndex: 0
  };

  const mockMembers: FamilyMember[] = [
    {
      uid: 'member-1',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'member',
      familyRole: 'parent',
      points: { current: 50, lifetime: 500, weekly: 30 },
      joinedAt: new Date().toISOString(),
      isActive: true,
      rotationPreferences: {
        preferredChoreTypes: ['individual'],
        dislikedChoreTypes: ['pet'],
        preferredDifficulties: ['easy', 'medium'],
        maxChoresPerWeek: 8,
        maxChoresPerDay: 2,
        preferredDaysOfWeek: [1, 2, 3, 4, 5],
        preferredTimeRanges: [],
        unavailabilityPeriods: [],
        skillCertifications: ['cleaning', 'cooking'],
        energyPatterns: []
      }
    },
    {
      uid: 'member-2',
      name: 'Bob',
      email: 'bob@test.com',
      role: 'member',
      familyRole: 'parent',
      points: { current: 75, lifetime: 400, weekly: 45 },
      joinedAt: new Date().toISOString(),
      isActive: true,
      rotationPreferences: {
        preferredChoreTypes: ['family'],
        dislikedChoreTypes: ['individual'],
        preferredDifficulties: ['medium', 'hard'],
        maxChoresPerWeek: 10,
        maxChoresPerDay: 3,
        preferredDaysOfWeek: [6, 0],
        preferredTimeRanges: [],
        unavailabilityPeriods: [],
        skillCertifications: ['maintenance', 'outdoor'],
        energyPatterns: []
      }
    },
    {
      uid: 'member-3',
      name: 'Charlie',
      email: 'charlie@test.com',
      role: 'member',
      familyRole: 'child',
      points: { current: 25, lifetime: 150, weekly: 15 },
      joinedAt: new Date().toISOString(),
      isActive: true,
      rotationPreferences: {
        preferredChoreTypes: ['individual'],
        dislikedChoreTypes: ['family'],
        preferredDifficulties: ['easy'],
        maxChoresPerWeek: 5,
        maxChoresPerDay: 1,
        preferredDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        preferredTimeRanges: [],
        unavailabilityPeriods: [],
        skillCertifications: ['basic_cleaning'],
        energyPatterns: []
      }
    }
  ];

  const mockChore: Chore = {
    id: 'test-chore',
    title: 'Test Chore',
    type: 'individual',
    difficulty: 'medium',
    points: 15,
    assignedTo: 'member-1',
    assignedToName: 'Alice',
    status: 'completed',
    familyId: 'test-family',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: 'admin-123',
    rotationConfig: {
      strategy: RotationStrategy.ROUND_ROBIN,
      priorityLevel: 'normal'
    }
  };

  const mockWorkloads: MemberWorkload[] = [
    {
      memberId: 'member-1',
      memberName: 'Alice',
      currentPoints: 30,
      currentChores: 3,
      weeklyPoints: 45,
      weeklyChores: 4,
      difficultyDistribution: { easy: 1, medium: 2, hard: 0 },
      completionRate: 0.9,
      averageCompletionTime: 25,
      fairnessScore: 75,
      capacityUtilization: 0.6,
      preferenceRespectRate: 0.8
    },
    {
      memberId: 'member-2',
      memberName: 'Bob',
      currentPoints: 45,
      currentChores: 4,
      weeklyPoints: 60,
      weeklyChores: 5,
      difficultyDistribution: { easy: 0, medium: 2, hard: 2 },
      completionRate: 0.95,
      averageCompletionTime: 30,
      fairnessScore: 65,
      capacityUtilization: 0.8,
      preferenceRespectRate: 0.9
    },
    {
      memberId: 'member-3',
      memberName: 'Charlie',
      currentPoints: 15,
      currentChores: 2,
      weeklyPoints: 20,
      weeklyChores: 2,
      difficultyDistribution: { easy: 2, medium: 0, hard: 0 },
      completionRate: 0.8,
      averageCompletionTime: 35,
      fairnessScore: 90,
      capacityUtilization: 0.4,
      preferenceRespectRate: 0.7
    }
  ];

  const mockRotationSettings: FamilyRotationSettings = {
    defaultStrategy: RotationStrategy.ROUND_ROBIN,
    fairnessWeight: 0.7,
    preferenceWeight: 0.5,
    availabilityWeight: 0.8,
    enableIntelligentScheduling: true,
    maxChoresPerMember: 10,
    rotationCooldownHours: 24,
    seasonalAdjustments: true,
    autoRebalancingEnabled: true,
    emergencyFallbackEnabled: true,
    strategyConfigs: {
      [RotationStrategy.ROUND_ROBIN]: { strategy: RotationStrategy.ROUND_ROBIN, parameters: {}, enabled: true },
      [RotationStrategy.WORKLOAD_BALANCE]: { strategy: RotationStrategy.WORKLOAD_BALANCE, parameters: {}, enabled: true },
      [RotationStrategy.SKILL_BASED]: { strategy: RotationStrategy.SKILL_BASED, parameters: {}, enabled: true },
      [RotationStrategy.CALENDAR_AWARE]: { strategy: RotationStrategy.CALENDAR_AWARE, parameters: {}, enabled: true },
      [RotationStrategy.RANDOM_FAIR]: { strategy: RotationStrategy.RANDOM_FAIR, parameters: {}, enabled: true },
      [RotationStrategy.PREFERENCE_BASED]: { strategy: RotationStrategy.PREFERENCE_BASED, parameters: {}, enabled: true },
      [RotationStrategy.MIXED_STRATEGY]: { strategy: RotationStrategy.MIXED_STRATEGY, parameters: {}, enabled: true }
    }
  };

  const mockContext: RotationContext = {
    familyId: 'test-family',
    choreId: 'test-chore',
    currentAssignee: 'member-1',
    availableMembers: mockMembers,
    familySettings: mockRotationSettings,
    currentWorkloads: mockWorkloads,
    scheduleConstraints: [],
    emergencyMode: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockFairnessEngine.calculateMemberWorkloads.mockResolvedValue(mockWorkloads);
    
    mockScheduleIntelligence.checkMemberAvailability.mockResolvedValue({
      score: 85,
      conflicts: [],
      suggestedTimes: [],
      reasoning: 'Good availability'
    });
  });

  describe('Round Robin Strategy', () => {
    it('should assign to next member in rotation order', async () => {
      // Mock the family fetch to return our test family
      jest.spyOn(rotationService as any, 'getFamilyById').mockResolvedValue(mockFamily);

      const result = await rotationService.determineNextAssignee(
        mockChore,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBe('member-2'); // Next in rotation after member-1
      expect(result.strategy).toBe(RotationStrategy.ROUND_ROBIN);
      expect(result.fairnessScore).toBeGreaterThan(70);
    });

    it('should skip inactive members', async () => {
      const contextWithInactiveMember = {
        ...mockContext,
        availableMembers: mockMembers.map(m => 
          m.uid === 'member-2' ? { ...m, isActive: false } : m
        )
      };

      jest.spyOn(rotationService as any, 'getFamilyById').mockResolvedValue(mockFamily);

      const result = await rotationService.determineNextAssignee(
        mockChore,
        mockFamily as any,
        contextWithInactiveMember
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBe('member-3'); // Skip inactive member-2
    });

    it('should handle empty rotation order gracefully', async () => {
      const familyWithEmptyRotation = {
        ...mockFamily,
        memberRotationOrder: [],
        nextFamilyChoreAssigneeIndex: 0
      };

      jest.spyOn(rotationService as any, 'getFamilyById').mockResolvedValue(familyWithEmptyRotation);

      const result = await rotationService.determineNextAssignee(
        mockChore,
        familyWithEmptyRotation as any,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBeDefined();
    });
  });

  describe('Workload Balance Strategy', () => {
    it('should assign to member with lowest workload', async () => {
      const contextWithWorkloadStrategy = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          defaultStrategy: RotationStrategy.WORKLOAD_BALANCE
        }
      };

      const choreWithWorkloadStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.WORKLOAD_BALANCE,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithWorkloadStrategy,
        mockFamily as any,
        contextWithWorkloadStrategy
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBe('member-3'); // Charlie has lowest workload
      expect(result.strategy).toBe(RotationStrategy.WORKLOAD_BALANCE);
    });

    it('should consider capacity utilization in workload calculation', async () => {
      const workloadsWithHighCapacity = mockWorkloads.map(w =>
        w.memberId === 'member-3' ? { ...w, capacityUtilization: 0.95 } : w
      );

      mockFairnessEngine.calculateMemberWorkloads.mockResolvedValue(workloadsWithHighCapacity);

      const contextWithWorkloadStrategy = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          defaultStrategy: RotationStrategy.WORKLOAD_BALANCE
        }
      };

      const choreWithWorkloadStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.WORKLOAD_BALANCE,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithWorkloadStrategy,
        mockFamily as any,
        contextWithWorkloadStrategy
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).not.toBe('member-3'); // Should avoid over-capacity member
    });
  });

  describe('Skill-Based Strategy', () => {
    it('should assign to member with required skills', async () => {
      const choreWithSkillRequirement = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.SKILL_BASED,
          requiredSkills: ['cooking'],
          priorityLevel: 'normal' as const
        }
      };

      const contextWithSkillStrategy = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          defaultStrategy: RotationStrategy.SKILL_BASED
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithSkillRequirement,
        mockFamily as any,
        contextWithSkillStrategy
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBe('member-1'); // Only Alice has cooking skill
      expect(result.strategy).toBe(RotationStrategy.SKILL_BASED);
    });

    it('should fallback to workload balance when no skills required', async () => {
      const choreWithoutSkillRequirement = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.SKILL_BASED,
          requiredSkills: [],
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithoutSkillRequirement,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBeDefined();
    });

    it('should handle missing skill certifications', async () => {
      const choreWithRareSkill = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.SKILL_BASED,
          requiredSkills: ['rare_skill_nobody_has'],
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithRareSkill,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(true);
      // Should still assign to someone even without perfect skill match
    });
  });

  describe('Calendar-Aware Strategy', () => {
    it('should assign to member with best availability', async () => {
      mockScheduleIntelligence.checkMemberAvailability
        .mockResolvedValueOnce({
          score: 60,
          conflicts: [{ type: 'calendar', severity: 'medium', description: 'Meeting conflict', canOverride: true }],
          suggestedTimes: [],
          reasoning: 'Moderate availability'
        })
        .mockResolvedValueOnce({
          score: 95,
          conflicts: [],
          suggestedTimes: [],
          reasoning: 'Excellent availability'
        })
        .mockResolvedValueOnce({
          score: 70,
          conflicts: [],
          suggestedTimes: [],
          reasoning: 'Good availability'
        });

      const choreWithCalendarStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.CALENDAR_AWARE,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithCalendarStrategy,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).toBe('member-2'); // Best availability score
      expect(result.strategy).toBe(RotationStrategy.CALENDAR_AWARE);
    });

    it('should include conflicts in result', async () => {
      const conflicts = [
        { type: 'calendar' as const, severity: 'high' as const, description: 'Work meeting', canOverride: false }
      ];

      mockScheduleIntelligence.checkMemberAvailability.mockResolvedValue({
        score: 30,
        conflicts,
        suggestedTimes: ['2024-01-01T10:00:00Z'],
        reasoning: 'Conflicts detected'
      });

      const choreWithCalendarStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.CALENDAR_AWARE,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithCalendarStrategy,
        mockFamily as any,
        mockContext
      );

      expect(result.conflictsDetected).toHaveLength(1);
      expect(result.conflictsDetected[0].type).toBe('calendar');
    });
  });

  describe('Random Fair Strategy', () => {
    it('should assign randomly but fairly', async () => {
      const choreWithRandomStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.RANDOM_FAIR,
          priorityLevel: 'normal' as const
        }
      };

      // Run multiple times to check randomness
      const results = [];
      for (let i = 0; i < 10; i++) {
        const result = await rotationService.determineNextAssignee(
          choreWithRandomStrategy,
          mockFamily as any,
          mockContext
        );
        results.push(result.assignedMemberId);
      }

      // Should assign successfully
      expect(results.every(id => id !== undefined)).toBe(true);
      
      // Should have some variation (though this could theoretically fail with bad luck)
      const uniqueAssignees = new Set(results);
      expect(uniqueAssignees.size).toBeGreaterThan(1);
    });

    it('should weight assignments based on fairness scores', async () => {
      // Charlie has highest fairness score (90), so should be less likely to be assigned
      // Multiple runs should show this tendency
      const choreWithRandomStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.RANDOM_FAIR,
          priorityLevel: 'normal' as const
        }
      };

      const results = [];
      for (let i = 0; i < 50; i++) {
        const result = await rotationService.determineNextAssignee(
          choreWithRandomStrategy,
          mockFamily as any,
          mockContext
        );
        results.push(result.assignedMemberId);
      }

      // Count assignments
      const charlieAssignments = results.filter(id => id === 'member-3').length;
      const totalAssignments = results.length;
      
      // Charlie should get fewer assignments due to higher fairness score
      expect(charlieAssignments / totalAssignments).toBeLessThan(0.5);
    });
  });

  describe('Preference-Based Strategy', () => {
    it('should respect member preferences', async () => {
      const choreAlicePrefers = {
        ...mockChore,
        type: 'individual' as const, // Alice prefers individual chores
        rotationConfig: {
          strategy: RotationStrategy.PREFERENCE_BASED,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreAlicePrefers,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(true);
      // Alice or Charlie should be preferred over Bob (who dislikes individual chores)
      expect(['member-1', 'member-3']).toContain(result.assignedMemberId);
    });

    it('should avoid members who dislike the chore type', async () => {
      const choreBobDislikes = {
        ...mockChore,
        type: 'individual' as const, // Bob dislikes individual chores
        rotationConfig: {
          strategy: RotationStrategy.PREFERENCE_BASED,
          avoidMembers: ['member-2'],
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreBobDislikes,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.assignedMemberId).not.toBe('member-2');
    });

    it('should balance preferences with fairness', async () => {
      const contextWithHighPreferenceWeight = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          preferenceWeight: 0.9,
          fairnessWeight: 0.1
        }
      };

      const choreWithPreferenceStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.PREFERENCE_BASED,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithPreferenceStrategy,
        mockFamily as any,
        contextWithHighPreferenceWeight
      );

      expect(result.success).toBe(true);
      expect(result.fairnessScore).toBeGreaterThan(0);
    });
  });

  describe('Mixed Strategy', () => {
    it('should combine multiple strategies', async () => {
      const contextWithMixedStrategy = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          defaultStrategy: RotationStrategy.MIXED_STRATEGY,
          strategyConfigs: {
            ...mockRotationSettings.strategyConfigs,
            [RotationStrategy.WORKLOAD_BALANCE]: {
              strategy: RotationStrategy.WORKLOAD_BALANCE,
              parameters: {},
              enabled: true,
              weight: 0.6
            },
            [RotationStrategy.PREFERENCE_BASED]: {
              strategy: RotationStrategy.PREFERENCE_BASED,
              parameters: {},
              enabled: true,
              weight: 0.4
            }
          }
        }
      };

      const choreWithMixedStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.MIXED_STRATEGY,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithMixedStrategy,
        mockFamily as any,
        contextWithMixedStrategy
      );

      expect(result.success).toBe(true);
      expect(result.strategy).toBe(RotationStrategy.MIXED_STRATEGY);
    });

    it('should fallback to round robin when no strategies enabled', async () => {
      const contextWithNoEnabledStrategies = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          strategyConfigs: {
            ...mockRotationSettings.strategyConfigs,
            [RotationStrategy.WORKLOAD_BALANCE]: {
              strategy: RotationStrategy.WORKLOAD_BALANCE,
              parameters: {},
              enabled: false,
              weight: 0
            }
          }
        }
      };

      const choreWithMixedStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.MIXED_STRATEGY,
          priorityLevel: 'normal' as const
        }
      };

      jest.spyOn(rotationService as any, 'getFamilyById').mockResolvedValue(mockFamily);

      const result = await rotationService.determineNextAssignee(
        choreWithMixedStrategy,
        mockFamily as any,
        contextWithNoEnabledStrategies
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle fairness engine errors gracefully', async () => {
      mockFairnessEngine.calculateMemberWorkloads.mockRejectedValue(new Error('Database error'));

      const result = await rotationService.determineNextAssignee(
        mockChore,
        mockFamily as any,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Rotation engine error');
    });

    it('should handle no eligible members', async () => {
      const contextWithNoEligibleMembers = {
        ...mockContext,
        availableMembers: mockMembers.map(m => ({ ...m, isActive: false }))
      };

      const result = await rotationService.determineNextAssignee(
        mockChore,
        mockFamily as any,
        contextWithNoEligibleMembers
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('No eligible members');
    });

    it('should handle calendar service failures', async () => {
      mockScheduleIntelligence.checkMemberAvailability.mockRejectedValue(new Error('Calendar API error'));

      const choreWithCalendarStrategy = {
        ...mockChore,
        rotationConfig: {
          strategy: RotationStrategy.CALENDAR_AWARE,
          priorityLevel: 'normal' as const
        }
      };

      const result = await rotationService.determineNextAssignee(
        choreWithCalendarStrategy,
        mockFamily as any,
        mockContext
      );

      // Should still succeed with fallback behavior
      expect(result.success).toBe(true);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect schedule conflicts', async () => {
      const criticalConflicts = [
        { type: 'calendar' as const, severity: 'critical' as const, description: 'Unmovable meeting', canOverride: false }
      ];

      mockScheduleIntelligence.checkMemberAvailability.mockResolvedValue({
        score: 10,
        conflicts: criticalConflicts,
        suggestedTimes: [],
        reasoning: 'Critical conflicts'
      });

      const result = await rotationService.determineNextAssignee(
        mockChore,
        mockFamily as any,
        mockContext
      );

      expect(result.conflictsDetected).toHaveLength(1);
      expect(result.conflictsDetected[0].severity).toBe('critical');
    });

    it('should provide alternative assignments for conflicts', async () => {
      const contextWithConflicts = {
        ...mockContext,
        familySettings: {
          ...mockRotationSettings,
          enableIntelligentScheduling: true
        }
      };

      mockScheduleIntelligence.checkMemberAvailability
        .mockResolvedValueOnce({
          score: 10,
          conflicts: [{ type: 'calendar', severity: 'critical', description: 'Conflict', canOverride: false }],
          suggestedTimes: [],
          reasoning: 'Critical conflict'
        })
        .mockResolvedValue({
          score: 90,
          conflicts: [],
          suggestedTimes: [],
          reasoning: 'Good availability'
        });

      const result = await rotationService.determineNextAssignee(
        mockChore,
        mockFamily as any,
        contextWithConflicts
      );

      expect(result.success).toBe(true);
      expect(result.conflictsDetected).toBeDefined();
    });
  });
});