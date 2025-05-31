/**
 * Comprehensive Rotation Service
 * Core engine for intelligent chore rotation with multiple strategies and fairness tracking
 */

import {
  RotationStrategy,
  RotationContext,
  RotationResult,
  MemberWorkload,
  ScheduleConflict,
  ChoreRotationConfig,
  FamilyRotationSettings,
  AlternativeAssignment,
  BatchRotationOperation,
  BatchRotationResult
} from '../types/rotation';
import { FamilyMember, Chore, Family } from '../types';
import { fairnessEngine } from './fairnessEngine';
import { scheduleIntelligence } from './scheduleIntelligence';

class RotationService {
  private defaultSettings: FamilyRotationSettings = {
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
    strategyConfigs: {} as Record<RotationStrategy, any>
  };

  /**
   * Main rotation engine - determines next assignee for a chore
   */
  public async determineNextAssignee(
    chore: Chore,
    family: Family,
    context: RotationContext
  ): Promise<RotationResult> {
    try {
      // Get rotation configuration for this chore
      const choreConfig = this.getChoreRotationConfig(chore);
      const strategy = choreConfig.strategy || context.familySettings.defaultStrategy;

      // Calculate current fairness state
      const currentWorkloads = await fairnessEngine.calculateMemberWorkloads(
        family.id!,
        context.availableMembers
      );

      // Filter eligible members based on chore requirements
      const eligibleMembers = await this.filterEligibleMembers(
        context.availableMembers,
        chore,
        choreConfig,
        currentWorkloads
      );

      if (eligibleMembers.length === 0) {
        return this.createFailureResult(
          strategy,
          'No eligible members available for this chore'
        );
      }

      // Apply selected rotation strategy
      const result = await this.applyRotationStrategy(
        strategy,
        eligibleMembers,
        chore,
        context,
        currentWorkloads
      );

      // Validate assignment doesn't create conflicts
      if (result.success && result.assignedMemberId) {
        const conflicts = await this.detectScheduleConflicts(
          result.assignedMemberId,
          chore,
          context
        );
        result.conflictsDetected = conflicts;

        // If critical conflicts exist, try alternative assignments
        if (this.hasCriticalConflicts(conflicts)) {
          const alternatives = await this.findAlternativeAssignments(
            eligibleMembers,
            chore,
            context,
            currentWorkloads
          );
          result.alternativeAssignments = alternatives;

          // If no good alternatives, this becomes a failed assignment
          if (alternatives.length === 0 || !this.hasAcceptableAlternative(alternatives)) {
            result.success = false;
            result.errorMessage = 'No suitable assignment found due to scheduling conflicts';
          }
        }
      }

      return result;

    } catch (error) {
      console.error('Error in rotation service:', error);
      return this.createFailureResult(
        context.familySettings.defaultStrategy,
        `Rotation engine error: ${error}`
      );
    }
  }

  /**
   * Apply the selected rotation strategy
   */
  private async applyRotationStrategy(
    strategy: RotationStrategy,
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext,
    currentWorkloads: MemberWorkload[]
  ): Promise<RotationResult> {
    switch (strategy) {
      case RotationStrategy.ROUND_ROBIN:
        return this.applyRoundRobinStrategy(eligibleMembers, chore, context);

      case RotationStrategy.WORKLOAD_BALANCE:
        return this.applyWorkloadBalanceStrategy(eligibleMembers, currentWorkloads, chore, context);

      case RotationStrategy.SKILL_BASED:
        return this.applySkillBasedStrategy(eligibleMembers, chore, context);

      case RotationStrategy.CALENDAR_AWARE:
        return this.applyCalendarAwareStrategy(eligibleMembers, chore, context);

      case RotationStrategy.RANDOM_FAIR:
        return this.applyRandomFairStrategy(eligibleMembers, currentWorkloads, chore, context);

      case RotationStrategy.PREFERENCE_BASED:
        return this.applyPreferenceBasedStrategy(eligibleMembers, chore, context, currentWorkloads);

      case RotationStrategy.MIXED_STRATEGY:
        return this.applyMixedStrategy(eligibleMembers, chore, context, currentWorkloads);

      default:
        // Fallback to round robin
        console.warn(`Unknown strategy ${strategy}, falling back to round robin`);
        return this.applyRoundRobinStrategy(eligibleMembers, chore, context);
    }
  }

  /**
   * Round Robin Strategy - Simple sequential rotation
   */
  private async applyRoundRobinStrategy(
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext
  ): Promise<RotationResult> {
    // Get current rotation index from family settings
    const family = await this.getFamilyById(context.familyId);
    let nextIndex = family.nextFamilyChoreAssigneeIndex || 0;
    
    // Find next eligible member in rotation order
    const rotationOrder = family.memberRotationOrder || eligibleMembers.map(m => m.uid);
    let found = false;
    let attempts = 0;
    
    while (!found && attempts < rotationOrder.length) {
      const candidateId = rotationOrder[nextIndex % rotationOrder.length];
      const candidate = eligibleMembers.find(m => m.uid === candidateId);
      
      if (candidate && candidate.uid !== chore.assignedTo) {
        return {
          success: true,
          assignedMemberId: candidate.uid,
          assignedMemberName: candidate.name,
          strategy: RotationStrategy.ROUND_ROBIN,
          fairnessScore: 85, // Good fairness for round robin
          conflictsDetected: []
        };
      }
      
      nextIndex = (nextIndex + 1) % rotationOrder.length;
      attempts++;
    }

    // If all members tried and none suitable, assign to first eligible
    if (eligibleMembers.length > 0) {
      const fallbackMember = eligibleMembers[0];
      return {
        success: true,
        assignedMemberId: fallbackMember.uid,
        assignedMemberName: fallbackMember.name,
        strategy: RotationStrategy.ROUND_ROBIN,
        fairnessScore: 70, // Lower score for fallback assignment
        conflictsDetected: []
      };
    }

    return this.createFailureResult(RotationStrategy.ROUND_ROBIN, 'No eligible members in rotation order');
  }

  /**
   * Workload Balance Strategy - Assign to member with lowest current workload
   */
  private async applyWorkloadBalanceStrategy(
    eligibleMembers: FamilyMember[],
    currentWorkloads: MemberWorkload[],
    chore: Chore,
    context: RotationContext
  ): Promise<RotationResult> {
    // Score members by workload capacity and fairness
    const memberScores = eligibleMembers.map(member => {
      const workload = currentWorkloads.find(w => w.memberId === member.uid);
      if (!workload) {
        return {
          member,
          score: 100, // New member gets highest priority
          capacity: 1.0,
          fairness: 100
        };
      }

      // Calculate composite score considering multiple factors
      const capacityScore = (1 - workload.capacityUtilization) * 100;
      const fairnessScore = workload.fairnessScore;
      const completionScore = workload.completionRate * 100;

      // Weighted combination of scores
      const compositeScore = (
        capacityScore * 0.4 +
        fairnessScore * 0.4 +
        completionScore * 0.2
      );

      return {
        member,
        score: compositeScore,
        capacity: 1 - workload.capacityUtilization,
        fairness: fairnessScore
      };
    });

    // Sort by composite score (highest first)
    memberScores.sort((a, b) => b.score - a.score);
    
    const bestMember = memberScores[0];
    return {
      success: true,
      assignedMemberId: bestMember.member.uid,
      assignedMemberName: bestMember.member.name,
      strategy: RotationStrategy.WORKLOAD_BALANCE,
      fairnessScore: bestMember.fairness,
      conflictsDetected: []
    };
  }

  /**
   * Skill-Based Strategy - Assign based on required skills and member capabilities
   */
  private async applySkillBasedStrategy(
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext
  ): Promise<RotationResult> {
    const choreConfig = this.getChoreRotationConfig(chore);
    const requiredSkills = choreConfig.requiredSkills || [];

    // If no specific skills required, use workload balance as fallback
    if (requiredSkills.length === 0) {
      return this.applyWorkloadBalanceStrategy(eligibleMembers, [], chore, context);
    }

    // Score members by skill match
    const skillScores = eligibleMembers.map(member => {
      const memberSkills = member.rotationPreferences?.skillCertifications || [];
      const matchedSkills = requiredSkills.filter(skill => memberSkills.includes(skill));
      const skillScore = matchedSkills.length / requiredSkills.length;

      return {
        member,
        skillScore,
        hasAllRequiredSkills: skillScore === 1
      };
    });

    // Prefer members with all required skills
    const fullyQualified = skillScores.filter(s => s.hasAllRequiredSkills);
    const targetMembers = fullyQualified.length > 0 ? fullyQualified : skillScores;

    // Sort by skill score
    targetMembers.sort((a, b) => b.skillScore - a.skillScore);
    
    const bestMember = targetMembers[0];
    return {
      success: true,
      assignedMemberId: bestMember.member.uid,
      assignedMemberName: bestMember.member.name,
      strategy: RotationStrategy.SKILL_BASED,
      fairnessScore: bestMember.hasAllRequiredSkills ? 90 : 70,
      conflictsDetected: []
    };
  }

  /**
   * Calendar-Aware Strategy - Consider member availability and schedule conflicts
   */
  private async applyCalendarAwareStrategy(
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext
  ): Promise<RotationResult> {
    // Check availability for each member
    const availabilityScores = await Promise.all(
      eligibleMembers.map(async member => {
        const availability = await scheduleIntelligence.checkMemberAvailability(
          member.uid,
          typeof chore.dueDate === 'string' ? chore.dueDate : chore.dueDate.toISOString(),
          chore.estimatedDuration || 30
        );

        return {
          member,
          availabilityScore: availability.score,
          conflicts: availability.conflicts,
          optimalTimes: availability.suggestedTimes
        };
      })
    );

    // Sort by availability score
    availabilityScores.sort((a, b) => b.availabilityScore - a.availabilityScore);

    const bestMember = availabilityScores[0];
    return {
      success: true,
      assignedMemberId: bestMember.member.uid,
      assignedMemberName: bestMember.member.name,
      strategy: RotationStrategy.CALENDAR_AWARE,
      fairnessScore: 80,
      conflictsDetected: bestMember.conflicts
    };
  }

  /**
   * Random Fair Strategy - Weighted randomization ensuring fairness
   */
  private async applyRandomFairStrategy(
    eligibleMembers: FamilyMember[],
    currentWorkloads: MemberWorkload[],
    chore: Chore,
    context: RotationContext
  ): Promise<RotationResult> {
    // Calculate weights based on fairness scores (lower workload = higher weight)
    const weights = eligibleMembers.map(member => {
      const workload = currentWorkloads.find(w => w.memberId === member.uid);
      const fairnessScore = workload?.fairnessScore || 100;
      
      // Invert fairness score so lower workload members have higher probability
      return Math.max(0.1, (100 - fairnessScore) / 100 + 0.2);
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < eligibleMembers.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return {
          success: true,
          assignedMemberId: eligibleMembers[i].uid,
          assignedMemberName: eligibleMembers[i].name,
          strategy: RotationStrategy.RANDOM_FAIR,
          fairnessScore: 85,
          conflictsDetected: []
        };
      }
    }

    // Fallback to first member
    return {
      success: true,
      assignedMemberId: eligibleMembers[0].uid,
      assignedMemberName: eligibleMembers[0].name,
      strategy: RotationStrategy.RANDOM_FAIR,
      fairnessScore: 75,
      conflictsDetected: []
    };
  }

  /**
   * Preference-Based Strategy - Respect member preferences while maintaining fairness
   */
  private async applyPreferenceBasedStrategy(
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext,
    currentWorkloads: MemberWorkload[]
  ): Promise<RotationResult> {
    const choreConfig = this.getChoreRotationConfig(chore);
    
    // Score members based on preferences
    const preferenceScores = eligibleMembers.map(member => {
      const preferences = member.rotationPreferences;
      let preferenceScore = 0.5; // Neutral starting point
      
      if (preferences) {
        // Positive preference factors
        if (preferences.preferredChoreTypes.includes(chore.type)) {
          preferenceScore += 0.3;
        }
        if (preferences.preferredDifficulties.includes(chore.difficulty)) {
          preferenceScore += 0.2;
        }
        
        // Negative preference factors
        if (preferences.dislikedChoreTypes.includes(chore.type)) {
          preferenceScore -= 0.4;
        }
      }

      // Chore-specific preferences
      if (choreConfig.preferredMembers?.includes(member.uid)) {
        preferenceScore += 0.4;
      }
      if (choreConfig.avoidMembers?.includes(member.uid)) {
        preferenceScore -= 0.5;
      }

      // Balance with fairness
      const workload = currentWorkloads.find(w => w.memberId === member.uid);
      const fairnessFactor = workload ? (workload.fairnessScore / 100) : 1;
      
      const finalScore = (preferenceScore * context.familySettings.preferenceWeight) + 
                        (fairnessFactor * context.familySettings.fairnessWeight);

      return {
        member,
        preferenceScore,
        fairnessFactor,
        finalScore: Math.max(0, Math.min(1, finalScore))
      };
    });

    // Sort by final score
    preferenceScores.sort((a, b) => b.finalScore - a.finalScore);
    
    const bestMember = preferenceScores[0];
    return {
      success: true,
      assignedMemberId: bestMember.member.uid,
      assignedMemberName: bestMember.member.name,
      strategy: RotationStrategy.PREFERENCE_BASED,
      fairnessScore: bestMember.fairnessFactor * 100,
      conflictsDetected: []
    };
  }

  /**
   * Mixed Strategy - Combine multiple strategies with weighted scores
   */
  private async applyMixedStrategy(
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext,
    currentWorkloads: MemberWorkload[]
  ): Promise<RotationResult> {
    // Get strategy configurations and weights
    const strategyConfigs = context.familySettings.strategyConfigs;
    const enabledStrategies = Object.entries(strategyConfigs)
      .filter(([_, config]) => config.enabled && (config.weight || 0) > 0)
      .map(([strategy, config]) => ({ strategy: strategy as RotationStrategy, config }));

    if (enabledStrategies.length === 0) {
      // Fallback to round robin if no strategies configured
      return this.applyRoundRobinStrategy(eligibleMembers, chore, context);
    }

    // Calculate composite scores for each member
    const memberScores = await Promise.all(
      eligibleMembers.map(async member => {
        let compositeScore = 0;
        let totalWeight = 0;

        for (const { strategy, config } of enabledStrategies) {
          const strategyResult = await this.getStrategyScore(
            strategy,
            member,
            chore,
            context,
            currentWorkloads
          );
          
          const weight = config.weight || 0;
          compositeScore += strategyResult.score * weight;
          totalWeight += weight;
        }

        return {
          member,
          compositeScore: totalWeight > 0 ? compositeScore / totalWeight : 0
        };
      })
    );

    // Sort by composite score
    memberScores.sort((a, b) => b.compositeScore - a.compositeScore);
    
    const bestMember = memberScores[0];
    return {
      success: true,
      assignedMemberId: bestMember.member.uid,
      assignedMemberName: bestMember.member.name,
      strategy: RotationStrategy.MIXED_STRATEGY,
      fairnessScore: bestMember.compositeScore,
      conflictsDetected: []
    };
  }

  /**
   * Get strategy-specific score for a member (used in mixed strategy)
   */
  private async getStrategyScore(
    strategy: RotationStrategy,
    member: FamilyMember,
    chore: Chore,
    context: RotationContext,
    currentWorkloads: MemberWorkload[]
  ): Promise<{ score: number; reasoning: string }> {
    switch (strategy) {
      case RotationStrategy.WORKLOAD_BALANCE:
        const workload = currentWorkloads.find(w => w.memberId === member.uid);
        return {
          score: workload ? (1 - workload.capacityUtilization) * 100 : 100,
          reasoning: 'Based on current workload capacity'
        };

      case RotationStrategy.PREFERENCE_BASED:
        const preferences = member.rotationPreferences;
        let prefScore = 50; // Neutral
        if (preferences?.preferredChoreTypes.includes(chore.type)) prefScore += 30;
        if (preferences?.dislikedChoreTypes.includes(chore.type)) prefScore -= 30;
        return {
          score: Math.max(0, prefScore),
          reasoning: 'Based on member preferences'
        };

      case RotationStrategy.SKILL_BASED:
        const choreConfig = this.getChoreRotationConfig(chore);
        const memberSkills = member.rotationPreferences?.skillCertifications || [];
        const requiredSkills = choreConfig.requiredSkills || [];
        const skillMatch = requiredSkills.length > 0 ? 
          (requiredSkills.filter(skill => memberSkills.includes(skill)).length / requiredSkills.length) * 100 : 50;
        return {
          score: skillMatch,
          reasoning: 'Based on skill requirements'
        };

      default:
        return { score: 50, reasoning: 'Default scoring' };
    }
  }

  /**
   * Filter eligible members based on chore requirements and constraints
   */
  private async filterEligibleMembers(
    members: FamilyMember[],
    chore: Chore,
    choreConfig: ChoreRotationConfig,
    currentWorkloads: MemberWorkload[]
  ): Promise<FamilyMember[]> {
    return members.filter(member => {
      // Basic eligibility checks
      if (!member.isActive) return false;
      
      // Check capacity limits
      const workload = currentWorkloads.find(w => w.memberId === member.uid);
      if (workload && workload.capacityUtilization >= 1.0) return false;
      
      // Check skill requirements
      if (choreConfig.requiredSkills && choreConfig.requiredSkills.length > 0) {
        const memberSkills = member.rotationPreferences?.skillCertifications || [];
        const hasRequiredSkills = choreConfig.requiredSkills.every(skill => 
          memberSkills.includes(skill)
        );
        if (!hasRequiredSkills) return false;
      }
      
      // Check explicit eligibility restrictions
      if (choreConfig.eligibleMembers && !choreConfig.eligibleMembers.includes(member.uid)) {
        return false;
      }
      
      // Check if member should be avoided (but don't exclude completely unless critical)
      if (choreConfig.avoidMembers?.includes(member.uid) && choreConfig.priorityLevel !== 'urgent') {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Detect schedule conflicts for a potential assignment
   */
  private async detectScheduleConflicts(
    memberId: string,
    chore: Chore,
    context: RotationContext
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    // Check calendar conflicts if available
    if (context.familySettings.enableIntelligentScheduling) {
      try {
        const availability = await scheduleIntelligence.checkMemberAvailability(
          memberId,
          typeof chore.dueDate === 'string' ? chore.dueDate : chore.dueDate.toISOString(),
          chore.estimatedDuration || 30
        );
        conflicts.push(...availability.conflicts);
      } catch (error) {
        console.warn('Calendar availability check failed:', error);
      }
    }

    // Check capacity conflicts
    const member = context.availableMembers.find(m => m.uid === memberId);
    if (member?.rotationPreferences) {
      const prefs = member.rotationPreferences;
      
      // Check daily/weekly limits
      if (prefs.maxChoresPerDay && this.getMemberDailyChoreCount(memberId, context) >= prefs.maxChoresPerDay) {
        conflicts.push({
          type: 'capacity',
          severity: 'high',
          description: 'Member has reached daily chore limit',
          canOverride: true
        });
      }
    }

    return conflicts;
  }

  /**
   * Helper methods for various calculations and utilities
   */
  private getChoreRotationConfig(chore: Chore): ChoreRotationConfig {
    return chore.rotationConfig || {
      strategy: RotationStrategy.ROUND_ROBIN,
      priorityLevel: 'normal'
    };
  }

  private getMemberDailyChoreCount(memberId: string, context: RotationContext): number {
    // This would typically query recent assignments - simplified for now
    return 0;
  }

  private async getFamilyById(familyId: string): Promise<Family> {
    // This would typically fetch from Firestore - simplified for now
    throw new Error('Not implemented - would fetch family from database');
  }

  private createFailureResult(strategy: RotationStrategy, errorMessage: string): RotationResult {
    return {
      success: false,
      strategy,
      fairnessScore: 0,
      conflictsDetected: [],
      errorMessage
    };
  }

  private hasCriticalConflicts(conflicts: ScheduleConflict[]): boolean {
    return conflicts.some(c => c.severity === 'critical' || (c.severity === 'high' && !c.canOverride));
  }

  private async findAlternativeAssignments(
    eligibleMembers: FamilyMember[],
    chore: Chore,
    context: RotationContext,
    currentWorkloads: MemberWorkload[]
  ): Promise<AlternativeAssignment[]> {
    // This would implement alternative assignment logic
    return [];
  }

  private hasAcceptableAlternative(alternatives: AlternativeAssignment[]): boolean {
    return alternatives.some(alt => 
      alt.conflicts.every(c => c.severity !== 'critical' || c.canOverride)
    );
  }

  /**
   * Batch operations for multiple chores
   */
  public async processBatchRotation(operation: BatchRotationOperation): Promise<BatchRotationResult> {
    const results: Record<string, RotationResult> = {};
    const failedChores: string[] = [];
    const warnings: string[] = [];
    let processedChores = 0;

    for (const choreId of operation.choreIds) {
      try {
        // This would implement batch rotation logic
        processedChores++;
      } catch (error) {
        failedChores.push(choreId);
        warnings.push(`Failed to rotate chore ${choreId}: ${error}`);
      }
    }

    return {
      success: failedChores.length === 0,
      processedChores,
      failedChores,
      warnings,
      fairnessImpact: 0, // Would calculate actual fairness impact
      results
    };
  }
}

export const rotationService = new RotationService();