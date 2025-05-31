/**
 * Conflict Detection and Resolution Service for Enhanced Bulk Operations
 * Identifies and resolves conflicts in chore assignments, scheduling, and workload distribution
 */

import { 
  ConflictAnalysis, 
  OperationConflict, 
  ConflictResolution,
  EnhancedBulkOperation,
  AIRequestContext,
  FamilyScheduleContext
} from '../types/ai';
import { Chore, Family, FamilyMember } from '../types';
import { geminiAIService } from './geminiAIService';

export class ConflictDetectionService {
  
  /**
   * Analyze a bulk operation for potential conflicts
   */
  public async analyzeOperation(
    operation: EnhancedBulkOperation,
    familyContext: AIRequestContext
  ): Promise<ConflictAnalysis> {
    try {
      const conflicts: OperationConflict[] = [];
      
      // Run different conflict detection algorithms
      const scheduleConflicts = await this.detectScheduleConflicts(operation, familyContext);
      const workloadConflicts = this.detectWorkloadConflicts(operation, familyContext);
      const skillConflicts = this.detectSkillMismatches(operation, familyContext);
      const resourceConflicts = this.detectResourceConflicts(operation, familyContext);
      const dependencyConflicts = this.detectDependencyConflicts(operation, familyContext);
      
      conflicts.push(
        ...scheduleConflicts,
        ...workloadConflicts,
        ...skillConflicts,
        ...resourceConflicts,
        ...dependencyConflicts
      );
      
      // Determine overall severity
      const severity = this.calculateSeverity(conflicts);
      
      // Check if conflicts can be auto-resolved
      const autoResolutionAvailable = conflicts.every(conflict => conflict.autoFixable);
      
      // Generate resolution suggestions
      const suggestedResolutions = await this.generateResolutions(conflicts, familyContext, operation.familyId);
      
      return {
        conflicts,
        severity,
        autoResolutionAvailable,
        suggestedResolutions
      };
      
    } catch (error) {
      console.error('Error analyzing operation conflicts:', error);
      return {
        conflicts: [],
        severity: 'none',
        autoResolutionAvailable: false,
        suggestedResolutions: []
      };
    }
  }

  /**
   * Detect scheduling conflicts (overlapping time assignments, impossible deadlines)
   */
  private async detectScheduleConflicts(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<OperationConflict[]> {
    const conflicts: OperationConflict[] = [];
    
    if (!context.currentSchedule) {
      return conflicts;
    }
    
    // Analyze time-based conflicts for assignment and reschedule operations
    if (['assign_multiple', 'reschedule_multiple'].includes(operation.operation)) {
      const timeConflicts = this.analyzeTimeConflicts(operation, context.currentSchedule);
      conflicts.push(...timeConflicts);
    }
    
    // Check for deadline impossibilities
    if (operation.operation === 'reschedule_multiple') {
      const deadlineConflicts = this.analyzeDeadlineConflicts(operation, context);
      conflicts.push(...deadlineConflicts);
    }
    
    return conflicts;
  }

  /**
   * Detect workload imbalances (unfair distribution among family members)
   */
  private detectWorkloadConflicts(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<OperationConflict[]> {
    const conflicts: OperationConflict[] = [];
    
    // Calculate current workload distribution
    const currentWorkload = this.calculateMemberWorkloads(context.activeChores);
    
    // Simulate the operation to predict new workload
    const predictedWorkload = this.simulateWorkloadChanges(operation, currentWorkload, context);
    
    // Check for imbalances
    const imbalances = this.identifyWorkloadImbalances(predictedWorkload, context.familySize);
    
    if (imbalances.length > 0) {
      conflicts.push({
        type: 'workload',
        choreIds: operation.choreIds || [],
        memberIds: imbalances.map(i => i.memberId),
        description: `Workload imbalance detected: ${imbalances.map(i => 
          `${i.memberName} would have ${i.newWorkload}% of total workload`
        ).join(', ')}`,
        severity: this.classifyWorkloadSeverity(imbalances),
        autoFixable: true
      });
    }
    
    return Promise.resolve(conflicts);
  }

  /**
   * Detect skill-difficulty mismatches
   */
  private detectSkillMismatches(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<OperationConflict[]> {
    const conflicts: OperationConflict[] = [];
    
    if (operation.operation !== 'assign_multiple') {
      return Promise.resolve(conflicts);
    }
    
    const assignTo = operation.modifications?.assignTo;
    if (!assignTo) {
      return Promise.resolve(conflicts);
    }
    
    // Get assigned chores and check difficulty appropriateness
    const assignedChores = context.activeChores.filter(chore => 
      operation.choreIds?.includes(chore.id)
    );
    
    const skillMismatches = this.identifySkillMismatches(assignedChores, assignTo, context);
    
    if (skillMismatches.length > 0) {
      conflicts.push({
        type: 'skill',
        choreIds: skillMismatches.map(m => m.choreId),
        memberIds: [assignTo],
        description: `Skill mismatches detected: ${skillMismatches.map(m => m.reason).join(', ')}`,
        severity: 'major',
        autoFixable: false
      });
    }
    
    return Promise.resolve(conflicts);
  }

  /**
   * Detect resource conflicts (shared spaces, equipment)
   */
  private detectResourceConflicts(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<OperationConflict[]> {
    const conflicts: OperationConflict[] = [];
    
    if (operation.operation === 'reschedule_multiple') {
      const resourceConflicts = this.analyzeResourceUsage(operation, context);
      conflicts.push(...resourceConflicts);
    }
    
    return Promise.resolve(conflicts);
  }

  /**
   * Detect dependency conflicts (chores that depend on others)
   */
  private detectDependencyConflicts(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): Promise<OperationConflict[]> {
    const conflicts: OperationConflict[] = [];
    
    // Check for chore dependencies that would be broken
    if (operation.operation === 'delete_multiple') {
      const dependencyConflicts = this.analyzeDependencyBreaks(operation, context);
      conflicts.push(...dependencyConflicts);
    }
    
    return Promise.resolve(conflicts);
  }

  /**
   * Generate AI-powered resolution suggestions
   */
  private async generateResolutions(
    conflicts: OperationConflict[],
    context: AIRequestContext,
    familyId: string
  ): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];
    
    // Generate automatic resolutions for simple conflicts
    for (const conflict of conflicts) {
      if (conflict.autoFixable) {
        const autoResolution = this.generateAutoResolution(conflict, context);
        if (autoResolution) {
          resolutions.push(autoResolution);
        }
      }
    }
    
    // Use AI for complex conflicts
    const complexConflicts = conflicts.filter(c => !c.autoFixable);
    if (complexConflicts.length > 0) {
      try {
        const aiResolutions = await this.getAIResolutions(complexConflicts, context, familyId);
        resolutions.push(...aiResolutions);
      } catch (error) {
        console.warn('AI resolution generation failed:', error);
      }
    }
    
    return resolutions;
  }

  /**
   * Helper methods for conflict analysis
   */
  private analyzeTimeConflicts(
    operation: EnhancedBulkOperation,
    schedule: FamilyScheduleContext
  ): OperationConflict[] {
    const conflicts: OperationConflict[] = [];
    
    // Simplified time conflict detection
    // In a full implementation, this would analyze the detailed schedule
    if (operation.modifications?.newDueDate) {
      const targetDate = new Date(operation.modifications.newDueDate);
      const dayOfWeek = targetDate.getDay();
      
      // Check if it's a particularly busy day (weekend for families)
      if ([6, 0].includes(dayOfWeek) && operation.choreIds && operation.choreIds.length > 5) {
        conflicts.push({
          type: 'schedule',
          choreIds: operation.choreIds,
          description: 'High volume of chores scheduled for weekend',
          severity: 'minor',
          autoFixable: true
        });
      }
    }
    
    return conflicts;
  }

  private analyzeDeadlineConflicts(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): OperationConflict[] {
    const conflicts: OperationConflict[] = [];
    
    if (!operation.modifications?.newDueDate) {
      return conflicts;
    }
    
    const newDate = new Date(operation.modifications.newDueDate);
    const now = new Date();
    
    // Check for past due dates
    if (newDate < now) {
      conflicts.push({
        type: 'schedule',
        choreIds: operation.choreIds || [],
        description: 'Cannot schedule chores in the past',
        severity: 'blocking',
        autoFixable: true
      });
    }
    
    return conflicts;
  }

  private calculateMemberWorkloads(chores: any[]): Record<string, WorkloadData> {
    const workloads: Record<string, WorkloadData> = {};
    
    chores.forEach(chore => {
      if (!workloads[chore.assignedTo]) {
        workloads[chore.assignedTo] = {
          choreCount: 0,
          totalPoints: 0,
          averageDifficulty: 0
        };
      }
      
      workloads[chore.assignedTo].choreCount++;
      workloads[chore.assignedTo].totalPoints += chore.points;
    });
    
    return workloads;
  }

  private simulateWorkloadChanges(
    operation: EnhancedBulkOperation,
    currentWorkload: Record<string, WorkloadData>,
    context: AIRequestContext
  ): Record<string, WorkloadData> {
    const newWorkload = JSON.parse(JSON.stringify(currentWorkload));
    
    if (operation.operation === 'assign_multiple' && operation.modifications?.assignTo) {
      const targetMember = operation.modifications.assignTo;
      const choreIds = operation.choreIds || [];
      
      // Remove chores from current assignees and add to target
      choreIds.forEach(choreId => {
        const chore = context.activeChores.find(c => c.id === choreId);
        if (chore) {
          // Remove from current assignee
          if (newWorkload[chore.assignedTo]) {
            newWorkload[chore.assignedTo].choreCount--;
            newWorkload[chore.assignedTo].totalPoints -= chore.points;
          }
          
          // Add to new assignee
          if (!newWorkload[targetMember]) {
            newWorkload[targetMember] = { choreCount: 0, totalPoints: 0, averageDifficulty: 0 };
          }
          newWorkload[targetMember].choreCount++;
          newWorkload[targetMember].totalPoints += chore.points;
        }
      });
    }
    
    return newWorkload;
  }

  private identifyWorkloadImbalances(
    workloads: Record<string, WorkloadData>,
    familySize: number
  ): WorkloadImbalance[] {
    const imbalances: WorkloadImbalance[] = [];
    const totalPoints = Object.values(workloads).reduce((sum, w) => sum + w.totalPoints, 0);
    const fairShare = totalPoints / familySize;
    
    Object.entries(workloads).forEach(([memberId, workload]) => {
      const variance = Math.abs(workload.totalPoints - fairShare) / fairShare;
      
      if (variance > 0.3) { // 30% variance threshold
        imbalances.push({
          memberId,
          memberName: memberId, // Would need to resolve from context
          currentWorkload: (workload.totalPoints / totalPoints) * 100,
          newWorkload: (workload.totalPoints / totalPoints) * 100,
          variance
        });
      }
    });
    
    return imbalances;
  }

  private classifyWorkloadSeverity(imbalances: WorkloadImbalance[]): 'minor' | 'major' | 'blocking' {
    const maxVariance = Math.max(...imbalances.map(i => i.variance));
    
    if (maxVariance > 0.8) return 'blocking';
    if (maxVariance > 0.5) return 'major';
    return 'minor';
  }

  private identifySkillMismatches(
    chores: any[],
    assigneeId: string,
    context: AIRequestContext
  ): SkillMismatch[] {
    const mismatches: SkillMismatch[] = [];
    
    // Simple age-based skill checking
    const memberAge = context.memberAges[0] || 16; // Simplified
    
    chores.forEach(chore => {
      if (chore.difficulty === 'hard' && memberAge < 12) {
        mismatches.push({
          choreId: chore.id,
          reason: `Hard difficulty chore assigned to child under 12`
        });
      }
    });
    
    return mismatches;
  }

  private analyzeResourceUsage(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): OperationConflict[] {
    const conflicts: OperationConflict[] = [];
    
    // Group chores by room/resource
    const choresByRoom: Record<string, string[]> = {};
    
    operation.choreIds?.forEach(choreId => {
      const chore = context.activeChores.find(c => c.id === choreId);
      if (chore?.room) {
        if (!choresByRoom[chore.room]) {
          choresByRoom[chore.room] = [];
        }
        choresByRoom[chore.room].push(choreId);
      }
    });
    
    // Check for rooms with too many simultaneous chores
    Object.entries(choresByRoom).forEach(([room, choreIds]) => {
      if (choreIds.length > 2) { // More than 2 chores in same room
        conflicts.push({
          type: 'resource',
          choreIds,
          description: `Too many chores scheduled simultaneously in ${room}`,
          severity: 'minor',
          autoFixable: true
        });
      }
    });
    
    return conflicts;
  }

  private analyzeDependencyBreaks(
    operation: EnhancedBulkOperation,
    context: AIRequestContext
  ): OperationConflict[] {
    const conflicts: OperationConflict[] = [];
    
    // Simplified dependency checking
    // In full implementation, this would check actual chore dependencies
    const choresToDelete = operation.choreIds || [];
    
    if (choresToDelete.length > context.activeChores.length * 0.5) {
      conflicts.push({
        type: 'dependency',
        choreIds: choresToDelete,
        description: 'Deleting more than 50% of active chores may disrupt family routine',
        severity: 'major',
        autoFixable: false
      });
    }
    
    return conflicts;
  }

  private calculateSeverity(conflicts: OperationConflict[]): 'none' | 'minor' | 'major' | 'blocking' {
    if (conflicts.length === 0) return 'none';
    
    const severities = conflicts.map(c => c.severity);
    
    if (severities.includes('blocking')) return 'blocking';
    if (severities.includes('major')) return 'major';
    return 'minor';
  }

  private generateAutoResolution(
    conflict: OperationConflict,
    context: AIRequestContext
  ): ConflictResolution | null {
    switch (conflict.type) {
      case 'schedule':
        return {
          conflictId: `${conflict.type}-${Date.now()}`,
          strategy: 'reschedule',
          description: 'Spread chores across multiple days to avoid overload',
          modifications: {
            distributeAcrossDays: 3
          },
          confidence: 0.8
        };
        
      case 'workload':
        return {
          conflictId: `${conflict.type}-${Date.now()}`,
          strategy: 'reassign',
          description: 'Redistribute chores to balance workload more evenly',
          modifications: {
            rebalanceWorkload: true
          },
          confidence: 0.9
        };
        
      case 'resource':
        return {
          conflictId: `${conflict.type}-${Date.now()}`,
          strategy: 'reschedule',
          description: 'Stagger chores in the same room to avoid conflicts',
          modifications: {
            staggerByHours: 2
          },
          confidence: 0.85
        };
        
      default:
        return null;
    }
  }

  private async getAIResolutions(
    conflicts: OperationConflict[],
    context: AIRequestContext,
    familyId: string
  ): Promise<ConflictResolution[]> {
    // Check if AI is available for this family
    const aiAvailable = await geminiAIService.isAvailable(familyId);
    if (!aiAvailable) {
      return [];
    }

    try {
      const response = await geminiAIService.analyzeConflicts(
        { conflicts },
        familyId,
        context
      );
      
      if (response.success && response.analysis?.details.resolutions) {
        return response.analysis.details.resolutions;
      }
    } catch (error) {
      console.error('AI resolution generation failed:', error);
    }
    
    return [];
  }
}

// Supporting interfaces
interface WorkloadData {
  choreCount: number;
  totalPoints: number;
  averageDifficulty: number;
}

interface WorkloadImbalance {
  memberId: string;
  memberName: string;
  currentWorkload: number;
  newWorkload: number;
  variance: number;
}

interface SkillMismatch {
  choreId: string;
  reason: string;
}

// Export singleton instance
export const conflictDetectionService = new ConflictDetectionService();