/**
 * Fairness Engine Service
 * Calculates workload distribution, equity scores, and fairness metrics for the rotation system
 */

import {
  MemberWorkload,
  FamilyFairnessMetrics,
  FairnessSnapshot
} from '../types/rotation';
import { FamilyMember, Chore } from '../types';
import { getChores, getFamilyCompletionRecords } from './firestore';

class FairnessEngine {
  private readonly FAIRNESS_THRESHOLD = 75; // Minimum acceptable fairness score
  private readonly WORKLOAD_VARIANCE_THRESHOLD = 25; // Maximum acceptable variance in workloads

  /**
   * Calculate current workload distribution for all family members
   */
  public async calculateMemberWorkloads(
    familyId: string,
    members: FamilyMember[]
  ): Promise<MemberWorkload[]> {
    const workloads: MemberWorkload[] = [];
    
    // Get all active chores for the family
    const chores = await getChores(familyId);
    const activeChores = chores.filter(chore => chore.status === 'open');
    
    // Get completion history for pattern analysis
    const completionRecords = await getFamilyCompletionRecords(familyId, 30); // Last 30 days

    for (const member of members) {
      const workload = await this.calculateIndividualWorkload(
        member,
        activeChores,
        completionRecords,
        members.length
      );
      workloads.push(workload);
    }

    return workloads;
  }

  /**
   * Calculate workload metrics for an individual member
   */
  private async calculateIndividualWorkload(
    member: FamilyMember,
    activeChores: Chore[],
    completionRecords: any[],
    totalMembers: number
  ): Promise<MemberWorkload> {
    // Current assignments
    const assignedChores = activeChores.filter(chore => chore.assignedTo === member.uid);
    const currentPoints = assignedChores.reduce((sum, chore) => sum + chore.points, 0);
    const currentChores = assignedChores.length;

    // Weekly statistics
    const weeklyRecords = completionRecords.filter(record => {
      const recordDate = new Date(record.completedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return recordDate >= weekAgo && record.userId === member.uid;
    });

    const weeklyPoints = weeklyRecords.reduce((sum, record) => sum + record.pointsEarned, 0);
    const weeklyChores = weeklyRecords.length;

    // Difficulty distribution
    const difficultyDistribution = {
      easy: assignedChores.filter(c => c.difficulty === 'easy').length,
      medium: assignedChores.filter(c => c.difficulty === 'medium').length,
      hard: assignedChores.filter(c => c.difficulty === 'hard').length
    };

    // Completion rate calculation
    const memberRecords = completionRecords.filter(r => r.userId === member.uid);
    const totalAssigned = memberRecords.length + currentChores;
    const completionRate = totalAssigned > 0 ? memberRecords.length / totalAssigned : 1.0;

    // Average completion time
    const completionTimes = memberRecords
      .filter(r => r.completionTime)
      .map(r => r.completionTime);
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 30; // Default 30 minutes

    // Capacity utilization
    const maxCapacity = member.rotationPreferences?.maxChoresPerWeek || 10;
    const capacityUtilization = Math.min(1.0, weeklyChores / maxCapacity);

    // Fairness score calculation
    const fairnessScore = this.calculateFairnessScore(
      member,
      currentPoints,
      weeklyPoints,
      currentChores,
      weeklyChores,
      totalMembers,
      completionRate
    );

    // Preference respect rate
    const preferenceRespectRate = this.calculatePreferenceRespectRate(
      member,
      assignedChores
    );

    return {
      memberId: member.uid,
      memberName: member.name,
      currentPoints,
      currentChores,
      weeklyPoints,
      weeklyChores,
      difficultyDistribution,
      completionRate,
      averageCompletionTime,
      fairnessScore,
      capacityUtilization,
      preferenceRespectRate
    };
  }

  /**
   * Calculate fairness score for an individual member
   */
  private calculateFairnessScore(
    member: FamilyMember,
    currentPoints: number,
    weeklyPoints: number,
    currentChores: number,
    weeklyChores: number,
    totalMembers: number,
    completionRate: number
  ): number {
    // Expected fair share (assuming equal distribution)
    const expectedPointsShare = 1.0 / totalMembers;
    const expectedChoresShare = 1.0 / totalMembers;

    // Calculate deviation from fair share
    const familyTotalPoints = weeklyPoints * totalMembers; // Simplified calculation
    const actualPointsShare = familyTotalPoints > 0 ? weeklyPoints / familyTotalPoints : expectedPointsShare;
    const pointsDeviation = Math.abs(actualPointsShare - expectedPointsShare);

    const familyTotalChores = weeklyChores * totalMembers; // Simplified calculation
    const actualChoresShare = familyTotalChores > 0 ? weeklyChores / familyTotalChores : expectedChoresShare;
    const choresDeviation = Math.abs(actualChoresShare - expectedChoresShare);

    // Base fairness score (higher is more fair)
    const pointsFairness = Math.max(0, 100 - (pointsDeviation * 200));
    const choresFairness = Math.max(0, 100 - (choresDeviation * 200));
    const completionFairness = completionRate * 100;

    // Weighted combination
    const fairnessScore = (
      pointsFairness * 0.4 +
      choresFairness * 0.4 +
      completionFairness * 0.2
    );

    return Math.max(0, Math.min(100, fairnessScore));
  }

  /**
   * Calculate how often member preferences are respected
   */
  private calculatePreferenceRespectRate(
    member: FamilyMember,
    assignedChores: Chore[]
  ): number {
    if (!member.rotationPreferences || assignedChores.length === 0) {
      return 0.8; // Default neutral score
    }

    const preferences = member.rotationPreferences;
    let respectCount = 0;
    let totalChecks = 0;

    for (const chore of assignedChores) {
      // Check if chore type is preferred
      if (preferences.preferredChoreTypes.includes(chore.type)) {
        respectCount += 1;
      } else if (preferences.dislikedChoreTypes.includes(chore.type)) {
        respectCount -= 0.5; // Penalty for disliked assignments
      }
      totalChecks += 1;

      // Check if difficulty is preferred
      if (preferences.preferredDifficulties.includes(chore.difficulty)) {
        respectCount += 0.5;
      }
      totalChecks += 0.5;
    }

    return totalChecks > 0 ? Math.max(0, Math.min(1, (respectCount / totalChecks) + 0.5)) : 0.8;
  }

  /**
   * Calculate overall family fairness metrics
   */
  public async calculateFamilyFairness(
    familyId: string,
    memberWorkloads: MemberWorkload[]
  ): Promise<FamilyFairnessMetrics> {
    if (memberWorkloads.length === 0) {
      return {
        lastCalculatedAt: new Date().toISOString(),
        memberWorkloads: [],
        equityScore: 100,
        rebalancingNeeded: false,
        workloadVariance: 0,
        fairnessThreshold: this.FAIRNESS_THRESHOLD
      };
    }

    // Calculate overall equity score
    const fairnessScores = memberWorkloads.map(w => w.fairnessScore);
    const averageFairness = fairnessScores.reduce((sum, score) => sum + score, 0) / fairnessScores.length;
    
    // Calculate workload variance
    const weeklyPoints = memberWorkloads.map(w => w.weeklyPoints);
    const averagePoints = weeklyPoints.reduce((sum, points) => sum + points, 0) / weeklyPoints.length;
    const variance = weeklyPoints.reduce((sum, points) => sum + Math.pow(points - averagePoints, 2), 0) / weeklyPoints.length;
    const workloadVariance = Math.sqrt(variance);

    // Determine if rebalancing is needed
    const rebalancingNeeded = averageFairness < this.FAIRNESS_THRESHOLD || 
                              workloadVariance > this.WORKLOAD_VARIANCE_THRESHOLD ||
                              fairnessScores.some(score => score < this.FAIRNESS_THRESHOLD - 10);

    return {
      lastCalculatedAt: new Date().toISOString(),
      memberWorkloads,
      equityScore: Math.round(averageFairness),
      rebalancingNeeded,
      workloadVariance: Math.round(workloadVariance),
      fairnessThreshold: this.FAIRNESS_THRESHOLD
    };
  }

  /**
   * Generate rebalancing recommendations
   */
  public generateRebalancingRecommendations(
    familyFairness: FamilyFairnessMetrics
  ): string[] {
    const recommendations: string[] = [];
    const workloads = familyFairness.memberWorkloads;

    if (!familyFairness.rebalancingNeeded) {
      return ['No rebalancing needed - family workload is well distributed'];
    }

    // Find members with lowest and highest workloads
    const sortedByWorkload = [...workloads].sort((a, b) => a.weeklyPoints - b.weeklyPoints);
    const underworkedMembers = sortedByWorkload.slice(0, Math.ceil(workloads.length / 3));
    const overworkedMembers = sortedByWorkload.slice(-Math.ceil(workloads.length / 3));

    // Generate specific recommendations
    if (overworkedMembers.length > 0 && underworkedMembers.length > 0) {
      const mostOverworked = overworkedMembers[overworkedMembers.length - 1];
      const leastWorked = underworkedMembers[0];
      
      recommendations.push(
        `Consider redistributing some chores from ${mostOverworked.memberName} ` +
        `(${mostOverworked.weeklyPoints} pts) to ${leastWorked.memberName} ` +
        `(${leastWorked.weeklyPoints} pts)`
      );
    }

    // Check for capacity issues
    const overCapacityMembers = workloads.filter(w => w.capacityUtilization > 0.9);
    if (overCapacityMembers.length > 0) {
      recommendations.push(
        `Members at capacity: ${overCapacityMembers.map(m => m.memberName).join(', ')}. ` +
        `Consider increasing their limits or redistributing their workload.`
      );
    }

    // Check for completion rate issues
    const lowCompletionMembers = workloads.filter(w => w.completionRate < 0.7);
    if (lowCompletionMembers.length > 0) {
      recommendations.push(
        `Low completion rates: ${lowCompletionMembers.map(m => m.memberName).join(', ')}. ` +
        `Consider adjusting their assignments or providing additional support.`
      );
    }

    // Check preference respect
    const lowPreferenceMembers = workloads.filter(w => w.preferenceRespectRate < 0.5);
    if (lowPreferenceMembers.length > 0) {
      recommendations.push(
        `Preferences not well respected for: ${lowPreferenceMembers.map(m => m.memberName).join(', ')}. ` +
        `Consider using preference-based rotation strategy.`
      );
    }

    return recommendations;
  }

  /**
   * Create a fairness snapshot for historical tracking
   */
  public createFairnessSnapshot(
    familyFairness: FamilyFairnessMetrics,
    rebalancingActions: string[] = []
  ): FairnessSnapshot {
    return {
      date: new Date().toISOString(),
      equityScore: familyFairness.equityScore,
      memberWorkloads: [...familyFairness.memberWorkloads],
      rebalancingActions
    };
  }

  /**
   * Analyze fairness trends over time
   */
  public analyzeFairnessTrends(snapshots: FairnessSnapshot[]): {
    trend: 'improving' | 'declining' | 'stable';
    averageEquity: number;
    volatility: number;
    recommendations: string[];
  } {
    if (snapshots.length < 2) {
      return {
        trend: 'stable',
        averageEquity: snapshots[0]?.equityScore || 100,
        volatility: 0,
        recommendations: ['Need more data to analyze trends']
      };
    }

    const equityScores = snapshots.map(s => s.equityScore);
    const averageEquity = equityScores.reduce((sum, score) => sum + score, 0) / equityScores.length;
    
    // Calculate trend
    const firstHalf = equityScores.slice(0, Math.floor(equityScores.length / 2));
    const secondHalf = equityScores.slice(Math.floor(equityScores.length / 2));
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable';
    if (secondAvg > firstAvg + 5) trend = 'improving';
    else if (secondAvg < firstAvg - 5) trend = 'declining';
    else trend = 'stable';

    // Calculate volatility
    const variance = equityScores.reduce((sum, score) => sum + Math.pow(score - averageEquity, 2), 0) / equityScores.length;
    const volatility = Math.sqrt(variance);

    // Generate recommendations based on trends
    const recommendations: string[] = [];
    if (trend === 'declining') {
      recommendations.push('Fairness is declining - consider implementing workload balancing strategy');
    }
    if (volatility > 15) {
      recommendations.push('High volatility in fairness scores - consider more consistent rotation strategy');
    }
    if (averageEquity < this.FAIRNESS_THRESHOLD) {
      recommendations.push('Average fairness below threshold - immediate rebalancing recommended');
    }

    return {
      trend,
      averageEquity: Math.round(averageEquity),
      volatility: Math.round(volatility),
      recommendations
    };
  }

  /**
   * Predict optimal assignment to maintain fairness
   */
  public predictOptimalAssignment(
    memberWorkloads: MemberWorkload[],
    chorePoints: number,
    choreDifficulty: string
  ): { memberId: string; fairnessImpact: number; reasoning: string }[] {
    return memberWorkloads
      .map(workload => {
        // Calculate potential fairness impact
        const currentFairness = workload.fairnessScore;
        const newWeeklyPoints = workload.weeklyPoints + chorePoints;
        const newCapacityUtilization = Math.min(1.0, newWeeklyPoints / (workload.weeklyPoints / workload.capacityUtilization || 100));
        
        // Estimate new fairness score
        const fairnessImpact = this.estimateFairnessImpact(workload, chorePoints, newCapacityUtilization);
        
        return {
          memberId: workload.memberId,
          fairnessImpact,
          reasoning: `Current fairness: ${currentFairness}, Estimated impact: ${fairnessImpact > 0 ? '+' : ''}${fairnessImpact}`
        };
      })
      .sort((a, b) => b.fairnessImpact - a.fairnessImpact); // Sort by best fairness impact
  }

  /**
   * Estimate fairness impact of assigning a chore to a member
   */
  private estimateFairnessImpact(
    workload: MemberWorkload,
    chorePoints: number,
    newCapacityUtilization: number
  ): number {
    const currentFairness = workload.fairnessScore;
    
    // If member is underworked, positive impact
    if (workload.fairnessScore > 85) {
      return Math.max(-10, -5 * (chorePoints / 10));
    }
    
    // If member is at good balance, neutral to slightly negative
    if (workload.fairnessScore > 70) {
      return Math.max(-5, -2 * (chorePoints / 10));
    }
    
    // If member is overworked, negative impact
    return Math.min(-1, -10 * (chorePoints / 10));
  }
}

export const fairnessEngine = new FairnessEngine();