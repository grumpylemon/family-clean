/**
 * Family Impact Analysis Service for Enhanced Bulk Operations
 * Analyzes how bulk operations will affect each family member and overall household dynamics
 */

import { 
  FamilyImpactAssessment,
  MemberImpact,
  WorkloadChange,
  ScheduleChange,
  DifficultyAdjustment,
  EnhancedBulkOperation,
  AIRequestContext
} from '../types/ai';
import { Chore, Family, FamilyMember } from '../types';
import { geminiAIService } from './geminiAIService';

export class FamilyImpactAnalyzer {

  /**
   * Analyze the comprehensive impact of a bulk operation on family members
   */
  public async analyzeImpact(
    operation: EnhancedBulkOperation,
    familyContext: AIRequestContext
  ): Promise<FamilyImpactAssessment> {
    try {
      // Analyze different impact dimensions
      const memberImpacts = await this.analyzeMemberImpacts(operation, familyContext);
      const workloadChanges = this.analyzeWorkloadChanges(operation, familyContext);
      const scheduleChanges = this.analyzeScheduleChanges(operation, familyContext);
      const difficultyAdjustments = this.analyzeDifficultyAdjustments(operation, familyContext);
      
      // Calculate overall family harmony score
      const overallScore = this.calculateOverallScore(memberImpacts, workloadChanges, scheduleChanges);
      
      // Generate AI-powered recommendations
      const recommendations = await this.generateRecommendations(
        operation, 
        memberImpacts, 
        familyContext
      );

      return {
        memberImpacts,
        workloadChanges,
        scheduleChanges,
        difficultyAdjustments,
        overallScore,
        recommendations
      };
      
    } catch (error) {
      console.error('Error analyzing family impact:', error);
      return this.createEmptyAssessment();
    }
  }

  /**
   * Analyze impact on individual family members
   */
  private async analyzeMemberImpacts(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<MemberImpact[]> {
    const impacts: MemberImpact[] = [];
    
    // Get current member workloads
    const currentWorkloads = this.calculateCurrentWorkloads(context.activeChores);
    
    // Simulate the operation to predict new workloads
    const predictedWorkloads = this.simulateWorkloadChanges(operation, currentWorkloads, context);
    
    // Analyze each member's impact
    const memberIds = new Set([
      ...Object.keys(currentWorkloads),
      ...Object.keys(predictedWorkloads)
    ]);
    
    for (const memberId of memberIds) {
      const current = currentWorkloads[memberId] || { chores: 0, points: 0, difficulty: 0 };
      const predicted = predictedWorkloads[memberId] || { chores: 0, points: 0, difficulty: 0 };
      
      const workloadChange = predicted.points - current.points;
      const impact = this.classifyImpact(workloadChange, current.points);
      
      // Check for potential conflicts
      const scheduleConflicts = await this.checkMemberScheduleConflicts(
        memberId, 
        operation, 
        context
      );
      
      const skillMismatches = this.checkSkillMismatches(memberId, operation, context);
      const concerns = this.identifyMemberConcerns(memberId, operation, context);

      impacts.push({
        memberId,
        memberName: this.getMemberName(memberId, context),
        currentWorkload: current.points,
        newWorkload: predicted.points,
        workloadChange,
        scheduleConflicts: scheduleConflicts.length,
        skillMismatches: skillMismatches.length,
        impact,
        concerns
      });
    }
    
    return impacts;
  }

  /**
   * Analyze workload distribution changes
   */
  private analyzeWorkloadChanges(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): WorkloadChange[] {
    const changes: WorkloadChange[] = [];
    
    const currentWorkloads = this.calculateCurrentWorkloads(context.activeChores);
    const predictedWorkloads = this.simulateWorkloadChanges(operation, currentWorkloads, context);
    
    // Calculate changes for each member
    const allMemberIds = new Set([
      ...Object.keys(currentWorkloads),
      ...Object.keys(predictedWorkloads)
    ]);
    
    for (const memberId of allMemberIds) {
      const current = currentWorkloads[memberId] || { chores: 0, points: 0, difficulty: 0 };
      const predicted = predictedWorkloads[memberId] || { chores: 0, points: 0, difficulty: 0 };
      
      const choreChange = predicted.chores - current.chores;
      const pointsChange = predicted.points - current.points;
      const changePercentage = current.points > 0 
        ? (pointsChange / current.points) * 100 
        : predicted.points > 0 ? 100 : 0;
      
      changes.push({
        memberId,
        currentChoreCount: current.chores,
        newChoreCount: predicted.chores,
        currentPoints: current.points,
        newPoints: predicted.points,
        changePercentage
      });
    }
    
    return changes;
  }

  /**
   * Analyze schedule-related changes and conflicts
   */
  private analyzeScheduleChanges(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): ScheduleChange[] {
    const changes: ScheduleChange[] = [];
    
    if (operation.operation === 'reschedule_multiple' && operation.modifications?.newDueDate) {
      const newDate = new Date(operation.modifications.newDueDate);
      const affectedChores = context.activeChores.filter(chore => 
        operation.choreIds?.includes(chore.id)
      );
      
      // Group by assigned member
      const choresByMember: Record<string, any[]> = {};
      affectedChores.forEach(chore => {
        if (!choresByMember[chore.assignedTo]) {
          choresByMember[chore.assignedTo] = [];
        }
        choresByMember[chore.assignedTo].push(chore);
      });
      
      // Analyze schedule impact for each member
      Object.entries(choresByMember).forEach(([memberId, chores]) => {
        const conflictingTimeSlots = this.identifyTimeSlotConflicts(chores, newDate);
        const overlapCount = this.calculateOverlapCount(chores, newDate);
        const suggestedAdjustments = this.generateScheduleAdjustments(chores, newDate);
        
        changes.push({
          memberId,
          conflictingTimeSlots,
          overlapCount,
          suggestedAdjustments
        });
      });
    }
    
    return changes;
  }

  /**
   * Analyze difficulty appropriateness adjustments
   */
  private analyzeDifficultyAdjustments(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): DifficultyAdjustment[] {
    const adjustments: DifficultyAdjustment[] = [];
    
    if (operation.operation === 'assign_multiple' && operation.modifications?.assignTo) {
      const assigneeId = operation.modifications.assignTo;
      const affectedChores = context.activeChores.filter(chore => 
        operation.choreIds?.includes(chore.id)
      );
      
      const inappropriateAssignments = this.identifyInappropriateAssignments(
        assigneeId, 
        affectedChores, 
        context
      );
      
      const skillMismatches = this.analyzeSkillMismatches(
        assigneeId, 
        affectedChores, 
        context
      );
      
      const recommendations = this.generateDifficultyRecommendations(
        assigneeId, 
        affectedChores, 
        context
      );
      
      if (inappropriateAssignments.length > 0 || skillMismatches.length > 0) {
        adjustments.push({
          memberId: assigneeId,
          inappropriateAssignments,
          skillMismatches,
          recommendations
        });
      }
    }
    
    return adjustments;
  }

  /**
   * Generate AI-powered recommendations for improving the operation
   */
  private async generateRecommendations(
    operation: EnhancedBulkOperation,
    memberImpacts: MemberImpact[],
    context: AIRequestContext
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Generate automatic recommendations based on impact analysis
    const automaticRecs = this.generateAutomaticRecommendations(memberImpacts, operation);
    recommendations.push(...automaticRecs);
    
    // Get AI-powered recommendations for complex scenarios
    try {
      const aiRecommendations = await this.getAIRecommendations(
        operation, 
        memberImpacts, 
        context
      );
      recommendations.push(...aiRecommendations);
    } catch (error) {
      console.warn('AI recommendations failed:', error);
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Helper methods for impact analysis
   */
  private calculateCurrentWorkloads(chores: any[]): Record<string, WorkloadData> {
    const workloads: Record<string, WorkloadData> = {};
    
    chores.forEach(chore => {
      if (!workloads[chore.assignedTo]) {
        workloads[chore.assignedTo] = { chores: 0, points: 0, difficulty: 0 };
      }
      
      workloads[chore.assignedTo].chores++;
      workloads[chore.assignedTo].points += chore.points;
      workloads[chore.assignedTo].difficulty += this.getDifficultyValue(chore.difficulty);
    });
    
    return workloads;
  }

  private simulateWorkloadChanges(
    operation: EnhancedBulkOperation,
    currentWorkloads: Record<string, WorkloadData>,
    context: AIRequestContext
  ): Record<string, WorkloadData> {
    const newWorkloads = JSON.parse(JSON.stringify(currentWorkloads));
    
    switch (operation.operation) {
      case 'assign_multiple':
        this.simulateAssignmentChanges(operation, newWorkloads, context);
        break;
        
      case 'modify_multiple':
        this.simulateModificationChanges(operation, newWorkloads, context);
        break;
        
      case 'delete_multiple':
        this.simulateDeletionChanges(operation, newWorkloads, context);
        break;
        
      case 'create_multiple':
        this.simulateCreationChanges(operation, newWorkloads, context);
        break;
    }
    
    return newWorkloads;
  }

  private simulateAssignmentChanges(
    operation: EnhancedBulkOperation,
    workloads: Record<string, WorkloadData>,
    context: AIRequestContext
  ): void {
    const targetMember = operation.modifications?.assignTo;
    if (!targetMember) return;
    
    const choreIds = operation.choreIds || [];
    
    choreIds.forEach(choreId => {
      const chore = context.activeChores.find(c => c.id === choreId);
      if (chore) {
        // Remove from current assignee
        if (workloads[chore.assignedTo]) {
          workloads[chore.assignedTo].chores--;
          workloads[chore.assignedTo].points -= chore.points;
          workloads[chore.assignedTo].difficulty -= this.getDifficultyValue(chore.difficulty);
        }
        
        // Add to new assignee
        if (!workloads[targetMember]) {
          workloads[targetMember] = { chores: 0, points: 0, difficulty: 0 };
        }
        workloads[targetMember].chores++;
        workloads[targetMember].points += chore.points;
        workloads[targetMember].difficulty += this.getDifficultyValue(chore.difficulty);
      }
    });
  }

  private simulateModificationChanges(
    operation: EnhancedBulkOperation,
    workloads: Record<string, WorkloadData>,
    context: AIRequestContext
  ): void {
    const modifications = operation.modifications || {};
    const choreIds = operation.choreIds || [];
    
    choreIds.forEach(choreId => {
      const chore = context.activeChores.find(c => c.id === choreId);
      if (chore && workloads[chore.assignedTo]) {
        // Apply point changes
        if (modifications.points !== undefined) {
          const pointChange = modifications.points - chore.points;
          workloads[chore.assignedTo].points += pointChange;
        }
        
        if (modifications.pointsMultiplier !== undefined) {
          const newPoints = Math.round(chore.points * modifications.pointsMultiplier);
          const pointChange = newPoints - chore.points;
          workloads[chore.assignedTo].points += pointChange;
        }
      }
    });
  }

  private simulateDeletionChanges(
    operation: EnhancedBulkOperation,
    workloads: Record<string, WorkloadData>,
    context: AIRequestContext
  ): void {
    const choreIds = operation.choreIds || [];
    
    choreIds.forEach(choreId => {
      const chore = context.activeChores.find(c => c.id === choreId);
      if (chore && workloads[chore.assignedTo]) {
        workloads[chore.assignedTo].chores--;
        workloads[chore.assignedTo].points -= chore.points;
        workloads[chore.assignedTo].difficulty -= this.getDifficultyValue(chore.difficulty);
      }
    });
  }

  private simulateCreationChanges(
    operation: EnhancedBulkOperation,
    workloads: Record<string, WorkloadData>,
    context: AIRequestContext
  ): void {
    const choresToCreate = operation.choreData || [];
    
    choresToCreate.forEach(chore => {
      const assignee = chore.assignedTo || 'default-member';
      
      if (!workloads[assignee]) {
        workloads[assignee] = { chores: 0, points: 0, difficulty: 0 };
      }
      
      workloads[assignee].chores++;
      workloads[assignee].points += chore.points || 10;
      workloads[assignee].difficulty += this.getDifficultyValue(chore.difficulty || 'medium');
    });
  }

  private classifyImpact(workloadChange: number, currentWorkload: number): 'positive' | 'neutral' | 'negative' {
    if (workloadChange === 0) return 'neutral';
    
    const changeRatio = Math.abs(workloadChange) / Math.max(currentWorkload, 10);
    
    if (workloadChange > 0) {
      // Increased workload
      return changeRatio > 0.3 ? 'negative' : 'neutral';
    } else {
      // Decreased workload
      return changeRatio > 0.2 ? 'positive' : 'neutral';
    }
  }

  private async checkMemberScheduleConflicts(
    memberId: string,
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<string[]> {
    // Simplified schedule conflict checking
    const conflicts: string[] = [];
    
    if (operation.operation === 'reschedule_multiple' && operation.modifications?.newDueDate) {
      const newDate = new Date(operation.modifications.newDueDate);
      const isWeekend = [0, 6].includes(newDate.getDay());
      
      if (isWeekend) {
        conflicts.push('Weekend scheduling may conflict with family activities');
      }
    }
    
    return conflicts;
  }

  private checkSkillMismatches(
    memberId: string,
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): string[] {
    const mismatches: string[] = [];
    
    if (operation.operation === 'assign_multiple' && operation.modifications?.assignTo === memberId) {
      const affectedChores = context.activeChores.filter(chore => 
        operation.choreIds?.includes(chore.id)
      );
      
      // Simple age-based skill checking
      const memberAge = this.getMemberAge(memberId, context);
      
      affectedChores.forEach(chore => {
        if (chore.difficulty === 'hard' && memberAge < 12) {
          mismatches.push(`Hard chore "${chore.title}" may be too difficult for child`);
        }
      });
    }
    
    return mismatches;
  }

  private identifyMemberConcerns(
    memberId: string,
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): string[] {
    const concerns: string[] = [];
    
    // Add concerns based on operation type and member context
    if (operation.operation === 'assign_multiple' && operation.modifications?.assignTo === memberId) {
      const choreCount = operation.choreIds?.length || 0;
      if (choreCount > 5) {
        concerns.push('Large number of chores assigned simultaneously');
      }
    }
    
    return concerns;
  }

  private calculateOverallScore(
    memberImpacts: MemberImpact[],
    workloadChanges: WorkloadChange[],
    scheduleChanges: ScheduleChange[]
  ): number {
    let score = 100; // Start with perfect score
    
    // Deduct points for negative impacts
    memberImpacts.forEach(impact => {
      if (impact.impact === 'negative') {
        score -= 15;
      }
      score -= impact.concerns.length * 5;
      score -= impact.skillMismatches * 10;
    });
    
    // Deduct points for workload imbalances
    const maxChangePercentage = Math.max(...workloadChanges.map(c => Math.abs(c.changePercentage)));
    if (maxChangePercentage > 50) {
      score -= 20;
    } else if (maxChangePercentage > 30) {
      score -= 10;
    }
    
    // Deduct points for schedule conflicts
    const totalScheduleConflicts = scheduleChanges.reduce((sum, change) => sum + change.overlapCount, 0);
    score -= totalScheduleConflicts * 8;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateAutomaticRecommendations(
    memberImpacts: MemberImpact[],
    operation: EnhancedBulkOperation
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for workload imbalances
    const negativeImpacts = memberImpacts.filter(impact => impact.impact === 'negative');
    if (negativeImpacts.length > 0) {
      recommendations.push('Consider redistributing some chores to balance workload more evenly');
    }
    
    // Check for skill mismatches
    const skillIssues = memberImpacts.filter(impact => impact.skillMismatches > 0);
    if (skillIssues.length > 0) {
      recommendations.push('Review chore difficulty assignments for age-appropriateness');
    }
    
    // Check for schedule conflicts
    const scheduleIssues = memberImpacts.filter(impact => impact.scheduleConflicts > 0);
    if (scheduleIssues.length > 0) {
      recommendations.push('Consider spreading chores across multiple days to avoid conflicts');
    }
    
    return recommendations;
  }

  private async getAIRecommendations(
    operation: EnhancedBulkOperation,
    memberImpacts: MemberImpact[],
    context: AIRequestContext
  ): Promise<string[]> {
    // Check if AI is available for this family
    const aiAvailable = await geminiAIService.isAvailable(operation.familyId);
    if (!aiAvailable) {
      return [];
    }

    try {
      const response = await geminiAIService.assessFamilyImpact(
        { operation, memberImpacts },
        operation.familyId,
        context
      );
      
      if (response.success && response.analysis?.details.recommendations) {
        return response.analysis.details.recommendations;
      }
    } catch (error) {
      console.error('AI recommendations failed:', error);
    }
    
    return [];
  }

  /**
   * Utility methods
   */
  private getDifficultyValue(difficulty: string): number {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };
    return difficultyMap[difficulty] || 2;
  }

  private getMemberName(memberId: string, context: AIRequestContext): string {
    // In a full implementation, this would resolve member names from context
    return `Member ${memberId.substring(0, 8)}`;
  }

  private getMemberAge(memberId: string, context: AIRequestContext): number {
    // Simplified age resolution
    return context.memberAges[0] || 16;
  }

  private identifyTimeSlotConflicts(chores: any[], targetDate: Date): string[] {
    // Simplified time slot conflict detection
    return chores.length > 3 ? ['Busy day with multiple chores'] : [];
  }

  private calculateOverlapCount(chores: any[], targetDate: Date): number {
    // Simplified overlap calculation
    return Math.max(0, chores.length - 2);
  }

  private generateScheduleAdjustments(chores: any[], targetDate: Date): string[] {
    const adjustments: string[] = [];
    
    if (chores.length > 3) {
      adjustments.push('Spread some chores to adjacent days');
    }
    
    return adjustments;
  }

  private identifyInappropriateAssignments(
    memberId: string,
    chores: any[],
    context: AIRequestContext
  ): string[] {
    const inappropriate: string[] = [];
    const memberAge = this.getMemberAge(memberId, context);
    
    chores.forEach(chore => {
      if (chore.difficulty === 'hard' && memberAge < 12) {
        inappropriate.push(chore.title);
      }
    });
    
    return inappropriate;
  }

  private analyzeSkillMismatches(
    memberId: string,
    chores: any[],
    context: AIRequestContext
  ): { choreId: string; reason: string }[] {
    const mismatches: { choreId: string; reason: string }[] = [];
    const memberAge = this.getMemberAge(memberId, context);
    
    chores.forEach(chore => {
      if (chore.difficulty === 'hard' && memberAge < 12) {
        mismatches.push({
          choreId: chore.id,
          reason: 'High difficulty for young family member'
        });
      }
    });
    
    return mismatches;
  }

  private generateDifficultyRecommendations(
    memberId: string,
    chores: any[],
    context: AIRequestContext
  ): string[] {
    const recommendations: string[] = [];
    const memberAge = this.getMemberAge(memberId, context);
    
    if (memberAge < 12) {
      recommendations.push('Consider assigning easier or age-appropriate alternatives');
    }
    
    return recommendations;
  }

  private createEmptyAssessment(): FamilyImpactAssessment {
    return {
      memberImpacts: [],
      workloadChanges: [],
      scheduleChanges: [],
      difficultyAdjustments: [],
      overallScore: 50,
      recommendations: ['Unable to analyze impact - please try again']
    };
  }
}

// Supporting interfaces
interface WorkloadData {
  chores: number;
  points: number;
  difficulty: number;
}

// Export singleton instance
export const familyImpactAnalyzer = new FamilyImpactAnalyzer();