/**
 * Operation History and Rollback Service for Enhanced Bulk Operations
 * Tracks all bulk operations and provides rollback capabilities
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as fbLimit,
  getDocs,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, safeCollection } from '../config/firebase';
import { 
  EnhancedBulkOperation,
  FamilyOperationFeedback,
  BulkOperationRollback
} from '../types/ai';
import { Chore } from '../types';

interface BulkOperationRecord {
  id: string;
  familyId: string;
  executedBy: string;
  executedAt: string;
  
  // Operation Details
  operation: EnhancedBulkOperation;
  affectedChoreIds: string[];
  originalChoreStates: any[];
  finalChoreStates: any[];
  
  // AI Integration
  aiAssisted: boolean;
  aiRequestId?: string;
  aiSuggestionUsed?: boolean;
  naturalLanguageCommand?: string;
  
  // Execution Results
  success: boolean;
  errors?: string[];
  warnings?: string[];
  executionDuration: number;
  rollbackAvailable: boolean;
  
  // Family Impact
  memberFeedback?: FamilyOperationFeedback[];
  impactActual?: any;
  satisfactionScore?: number;
  
  // Metadata
  rollbackHistory?: BulkOperationRollback[];
  relatedOperations?: string[];
  notes?: string;
}

export class OperationHistoryService {
  private static instance: OperationHistoryService;
  private readonly COLLECTION_NAME = 'bulkOperationHistory';
  private readonly ROLLBACK_WINDOW_HOURS = 24;

  public static getInstance(): OperationHistoryService {
    if (!OperationHistoryService.instance) {
      OperationHistoryService.instance = new OperationHistoryService();
    }
    return OperationHistoryService.instance;
  }

  /**
   * Record a bulk operation execution
   */
  public async recordOperation(
    operation: EnhancedBulkOperation,
    originalStates: any[],
    finalStates: any[],
    executionResult: {
      success: boolean;
      errors?: string[];
      warnings?: string[];
      duration: number;
    }
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const operationId = this.generateOperationId();
      const now = new Date().toISOString();

      const record: BulkOperationRecord = {
        id: operationId,
        familyId: operation.familyId,
        executedBy: user.uid,
        executedAt: now,
        
        operation,
        affectedChoreIds: operation.choreIds || [],
        originalChoreStates: originalStates,
        finalChoreStates: finalStates,
        
        aiAssisted: operation.aiAssisted || false,
        aiRequestId: operation.naturalLanguageRequest ? `ai_${Date.now()}` : undefined,
        aiSuggestionUsed: operation.aiSuggestions && operation.aiSuggestions.length > 0,
        naturalLanguageCommand: operation.naturalLanguageRequest,
        
        success: executionResult.success,
        errors: executionResult.errors,
        warnings: executionResult.warnings,
        executionDuration: executionResult.duration,
        rollbackAvailable: this.isRollbackAvailable(operation, executionResult.success),
        
        rollbackHistory: [],
        relatedOperations: []
      };

      const recordDoc = doc(safeCollection(this.COLLECTION_NAME), operationId);
      await setDoc(recordDoc, record);

      return operationId;
      
    } catch (error) {
      console.error('Error recording operation:', error);
      throw error;
    }
  }

  /**
   * Get operation history for a family
   */
  public async getFamilyOperationHistory(
    familyId: string,
    limit: number = 50
  ): Promise<BulkOperationRecord[]> {
    try {
      const historyQuery = query(
        safeCollection(this.COLLECTION_NAME),
        where('familyId', '==', familyId),
        orderBy('executedAt', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(historyQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BulkOperationRecord[];
      
    } catch (error) {
      console.error('Error fetching operation history:', error);
      return [];
    }
  }

  /**
   * Get a specific operation record
   */
  public async getOperationRecord(operationId: string): Promise<BulkOperationRecord | null> {
    try {
      const recordDoc = doc(safeCollection(this.COLLECTION_NAME), operationId);
      const recordSnap = await getDoc(recordDoc);
      
      if (recordSnap.exists()) {
        return { id: recordSnap.id, ...recordSnap.data() } as BulkOperationRecord;
      }
      
      return null;
      
    } catch (error) {
      console.error('Error fetching operation record:', error);
      return null;
    }
  }

  /**
   * Rollback a bulk operation
   */
  public async rollbackOperation(
    operationId: string,
    reason: string,
    partialRollback: boolean = false,
    selectedChoreIds?: string[]
  ): Promise<{ success: boolean; message: string; affectedChores: number }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Get the operation record
      const record = await this.getOperationRecord(operationId);
      if (!record) {
        return { success: false, message: 'Operation record not found', affectedChores: 0 };
      }

      // Check if rollback is still available
      if (!this.canRollback(record)) {
        return { 
          success: false, 
          message: 'Rollback window has expired (24 hours)', 
          affectedChores: 0 
        };
      }

      // Determine which chores to rollback
      const choresToRollback = partialRollback && selectedChoreIds
        ? record.affectedChoreIds.filter(id => selectedChoreIds.includes(id))
        : record.affectedChoreIds;

      // Execute the rollback
      const rollbackResult = await this.executeRollback(record, choresToRollback);

      // Record the rollback
      const rollbackRecord: BulkOperationRollback = {
        rolledBackAt: new Date().toISOString(),
        rolledBackBy: user.uid,
        reason,
        partialRollback,
        affectedChoreIds: choresToRollback,
        success: rollbackResult.success
      };

      // Update the operation record
      await this.updateOperationRecord(operationId, {
        rollbackHistory: [...(record.rollbackHistory || []), rollbackRecord],
        rollbackAvailable: false
      });

      return {
        success: rollbackResult.success,
        message: rollbackResult.success 
          ? `Successfully rolled back ${choresToRollback.length} chore${choresToRollback.length === 1 ? '' : 's'}`
          : 'Rollback failed: ' + rollbackResult.error,
        affectedChores: choresToRollback.length
      };
      
    } catch (error) {
      console.error('Error during rollback:', error);
      return { 
        success: false, 
        message: 'Rollback failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        affectedChores: 0
      };
    }
  }

  /**
   * Add feedback for an operation
   */
  public async addOperationFeedback(
    operationId: string,
    feedback: FamilyOperationFeedback
  ): Promise<boolean> {
    try {
      const record = await this.getOperationRecord(operationId);
      if (!record) {
        return false;
      }

      const existingFeedback = record.memberFeedback || [];
      const updatedFeedback = [
        ...existingFeedback.filter(f => f.memberId !== feedback.memberId),
        feedback
      ];

      // Calculate average satisfaction score
      const averageScore = updatedFeedback.reduce((sum, f) => sum + f.rating, 0) / updatedFeedback.length;

      await this.updateOperationRecord(operationId, {
        memberFeedback: updatedFeedback,
        satisfactionScore: averageScore
      });

      return true;
      
    } catch (error) {
      console.error('Error adding operation feedback:', error);
      return false;
    }
  }

  /**
   * Get operations that can be rolled back
   */
  public async getRollbackableOperations(familyId: string): Promise<BulkOperationRecord[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.ROLLBACK_WINDOW_HOURS);

      const historyQuery = query(
        safeCollection(this.COLLECTION_NAME),
        where('familyId', '==', familyId),
        where('rollbackAvailable', '==', true),
        where('executedAt', '>', cutoffTime.toISOString()),
        orderBy('executedAt', 'desc'),
        fbLimit(20)
      );

      const querySnapshot = await getDocs(historyQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BulkOperationRecord[];
      
    } catch (error) {
      console.error('Error fetching rollbackable operations:', error);
      return [];
    }
  }

  /**
   * Get operation analytics and patterns
   */
  public async getOperationAnalytics(familyId: string): Promise<OperationAnalytics> {
    try {
      const history = await this.getFamilyOperationHistory(familyId, 100);
      
      const analytics: OperationAnalytics = {
        totalOperations: history.length,
        successRate: this.calculateSuccessRate(history),
        averageSatisfaction: this.calculateAverageSatisfaction(history),
        mostCommonOperations: this.getMostCommonOperations(history),
        aiUsageRate: this.calculateAIUsageRate(history),
        rollbackRate: this.calculateRollbackRate(history),
        operationsByDay: this.groupOperationsByDay(history),
        memberActivity: this.analyzeMemberActivity(history)
      };

      return analytics;
      
    } catch (error) {
      console.error('Error calculating operation analytics:', error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Helper methods
   */
  private executeRollback(
    record: BulkOperationRecord,
    choreIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise(async (resolve) => {
      try {
        const batch = writeBatch(safeCollection('').firestore);
        
        for (const choreId of choreIds) {
          const originalStateIndex = record.affectedChoreIds.indexOf(choreId);
          if (originalStateIndex >= 0 && record.originalChoreStates[originalStateIndex]) {
            const originalState = record.originalChoreStates[originalStateIndex];
            const choreDoc = doc(safeCollection('chores'), choreId);
            
            // Restore original state
            batch.update(choreDoc, {
              ...originalState,
              lastModified: new Date().toISOString(),
              rolledBack: true,
              rollbackAt: new Date().toISOString()
            });
          }
        }
        
        await batch.commit();
        resolve({ success: true });
        
      } catch (error) {
        console.error('Rollback execution error:', error);
        resolve({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  private canRollback(record: BulkOperationRecord): boolean {
    if (!record.rollbackAvailable || !record.success) {
      return false;
    }

    const executedAt = new Date(record.executedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - executedAt.getTime()) / (1000 * 60 * 60);

    return hoursDiff <= this.ROLLBACK_WINDOW_HOURS;
  }

  private isRollbackAvailable(operation: EnhancedBulkOperation, success: boolean): boolean {
    // Rollback is available for successful operations that modify existing chores
    return success && ['modify_multiple', 'assign_multiple', 'reschedule_multiple'].includes(operation.operation || '');
  }

  private async updateOperationRecord(operationId: string, updates: Partial<BulkOperationRecord>): Promise<void> {
    const recordDoc = doc(safeCollection(this.COLLECTION_NAME), operationId);
    await updateDoc(recordDoc, updates);
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Analytics helper methods
  private calculateSuccessRate(history: BulkOperationRecord[]): number {
    if (history.length === 0) return 0;
    const successCount = history.filter(op => op.success).length;
    return (successCount / history.length) * 100;
  }

  private calculateAverageSatisfaction(history: BulkOperationRecord[]): number {
    const operationsWithFeedback = history.filter(op => op.satisfactionScore !== undefined);
    if (operationsWithFeedback.length === 0) return 0;
    
    const totalSatisfaction = operationsWithFeedback.reduce((sum, op) => sum + (op.satisfactionScore || 0), 0);
    return totalSatisfaction / operationsWithFeedback.length;
  }

  private getMostCommonOperations(history: BulkOperationRecord[]): Array<{ operation: string; count: number }> {
    const operationCounts: Record<string, number> = {};
    
    history.forEach(record => {
      const operation = record.operation.operation || 'unknown';
      operationCounts[operation] = (operationCounts[operation] || 0) + 1;
    });

    return Object.entries(operationCounts)
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateAIUsageRate(history: BulkOperationRecord[]): number {
    if (history.length === 0) return 0;
    const aiAssistedCount = history.filter(op => op.aiAssisted).length;
    return (aiAssistedCount / history.length) * 100;
  }

  private calculateRollbackRate(history: BulkOperationRecord[]): number {
    if (history.length === 0) return 0;
    const rollbackCount = history.filter(op => op.rollbackHistory && op.rollbackHistory.length > 0).length;
    return (rollbackCount / history.length) * 100;
  }

  private groupOperationsByDay(history: BulkOperationRecord[]): Record<string, number> {
    const operationsByDay: Record<string, number> = {};
    
    history.forEach(record => {
      const date = new Date(record.executedAt).toDateString();
      operationsByDay[date] = (operationsByDay[date] || 0) + 1;
    });

    return operationsByDay;
  }

  private analyzeMemberActivity(history: BulkOperationRecord[]): Array<{ memberId: string; operationCount: number }> {
    const memberActivity: Record<string, number> = {};
    
    history.forEach(record => {
      memberActivity[record.executedBy] = (memberActivity[record.executedBy] || 0) + 1;
    });

    return Object.entries(memberActivity)
      .map(([memberId, operationCount]) => ({ memberId, operationCount }))
      .sort((a, b) => b.operationCount - a.operationCount);
  }

  private getEmptyAnalytics(): OperationAnalytics {
    return {
      totalOperations: 0,
      successRate: 0,
      averageSatisfaction: 0,
      mostCommonOperations: [],
      aiUsageRate: 0,
      rollbackRate: 0,
      operationsByDay: {},
      memberActivity: []
    };
  }
}

// Supporting interfaces
interface OperationAnalytics {
  totalOperations: number;
  successRate: number;
  averageSatisfaction: number;
  mostCommonOperations: Array<{ operation: string; count: number }>;
  aiUsageRate: number;
  rollbackRate: number;
  operationsByDay: Record<string, number>;
  memberActivity: Array<{ memberId: string; operationCount: number }>;
}

// Export singleton instance
export const operationHistoryService = OperationHistoryService.getInstance();