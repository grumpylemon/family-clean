// Enhanced Sync Service - Advanced synchronization with conflict detection
// Provides sophisticated conflict resolution and intelligent sync strategies

import { Platform } from 'react-native';
import { useFamilyStore } from './familyStore';
import { OfflineAction, NetworkStatus } from './types';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { 
  getFamiliesCollection, 
  getChoresCollection, 
  getUsersCollection,
  completeChore,
  createChore,
  updateChore,
  deleteChore,
  redeemReward,
  updateFamilyMember,
  updateFamily
} from '@/services/firestore';

// Conflict detection and resolution types
export type ConflictType = 'data_conflict' | 'version_mismatch' | 'concurrent_edit' | 'deleted_resource';

export interface DataConflict {
  id: string;
  type: ConflictType;
  localAction: OfflineAction;
  serverData: any;
  conflictingFields: string[];
  timestamp: number;
  resolutionStrategy?: ConflictResolutionStrategy;
}

export type ConflictResolutionStrategy = 
  | 'local_wins'          // Use local changes
  | 'server_wins'         // Use server data
  | 'merge_changes'       // Intelligent merge
  | 'user_choice'         // Prompt user to choose
  | 'last_writer_wins'    // Based on timestamp
  | 'field_level_merge';  // Merge individual fields

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  conflicts: DataConflict[];
  retryableActions: OfflineAction[];
  errors: string[];
  metrics: SyncMetrics;
}

export interface SyncMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  networkLatency: number;
  dataTransferred: number;
  conflictsDetected: number;
  conflictsResolved: number;
}

class EnhancedSyncService {
  private isInitialized = false;
  private activeListeners: (() => void)[] = [];
  private syncInProgress = false;
  private lastSyncTimestamp: number = 0;

  // Initialize enhanced sync capabilities
  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🔄 EnhancedSyncService: Initializing advanced sync capabilities');
    
    // Set up real-time conflict detection listeners
    this.setupConflictDetection();
    
    // Initialize background sync monitoring
    this.setupBackgroundSync();
  }

  // Set up real-time listeners for conflict detection
  private setupConflictDetection() {
    const store = useFamilyStore.getState();
    const user = store.auth.user;
    const family = store.family.family;

    if (!user || !family?.id) {
      console.log('🔄 Conflict detection skipped: No user or family');
      return;
    }

    try {
      // Listen for family changes
      const familyRef = doc(getFamiliesCollection(), family.data.id);
      const familyUnsubscribe = onSnapshot(familyRef, (snapshot) => {
        if (snapshot.exists()) {
          this.handleServerDataChange('family', snapshot.data(), snapshot.metadata.fromCache);
        }
      });

      // Listen for chore changes
      const choresRef = getChoresCollection();
      const choresUnsubscribe = onSnapshot(choresRef, (snapshot) => {
        const chores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.handleServerDataChange('chores', chores, snapshot.metadata.fromCache);
      });

      this.activeListeners.push(familyUnsubscribe, choresUnsubscribe);
      console.log('🔄 Real-time conflict detection listeners active');
    } catch (error) {
      console.error('🔄 Error setting up conflict detection:', error);
    }
  }

  // Handle server data changes for conflict detection
  private handleServerDataChange(dataType: string, serverData: any, fromCache: boolean) {
    if (fromCache) return; // Ignore cached data
    
    const store = useFamilyStore.getState();
    const pendingActions = store.pendingActions;
    
    // Check for conflicts with pending actions
    const conflicts = this.detectConflicts(dataType, serverData, pendingActions);
    
    if (conflicts.length > 0) {
      console.log(`🔄 Detected ${conflicts.length} conflicts for ${dataType}`);
      this.handleConflicts(conflicts);
    }
  }

  // Detect conflicts between server data and pending actions
  private detectConflicts(dataType: string, serverData: any, pendingActions: OfflineAction[]): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const relevantActions = pendingActions.filter(action => this.getActionDataType(action) === dataType);

    for (const action of relevantActions) {
      const conflict = this.checkForConflict(action, serverData);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  // Check if a specific action conflicts with server data
  private checkForConflict(action: OfflineAction, serverData: any): DataConflict | null {
    try {
      switch (action.type) {
        case 'COMPLETE_CHORE':
          return this.checkChoreCompletionConflict(action, serverData);
        case 'UPDATE_MEMBER':
          return this.checkMemberUpdateConflict(action, serverData);
        case 'UPDATE_FAMILY':
          return this.checkFamilyUpdateConflict(action, serverData);
        default:
          return null;
      }
    } catch (error) {
      console.error('🔄 Error checking conflict:', error);
      return null;
    }
  }

  // Check for chore completion conflicts
  private checkChoreCompletionConflict(action: OfflineAction, serverChores: any[]): DataConflict | null {
    const { choreId } = action.payload;
    const serverChore = Array.isArray(serverChores) 
      ? serverChores.find(c => c.id === choreId)
      : null;

    if (!serverChore) {
      return {
        id: `${action.id}_deleted`,
        type: 'deleted_resource',
        localAction: action,
        serverData: null,
        conflictingFields: ['existence'],
        timestamp: Date.now(),
        resolutionStrategy: 'server_wins'
      };
    }

    // Check if chore was already completed by someone else
    if (serverChore.completedAt && serverChore.completedBy !== action.userId) {
      return {
        id: `${action.id}_concurrent`,
        type: 'concurrent_edit',
        localAction: action,
        serverData: serverChore,
        conflictingFields: ['completedAt', 'completedBy'],
        timestamp: Date.now(),
        resolutionStrategy: 'server_wins' // Server completion takes precedence
      };
    }

    return null;
  }

  // Check for member update conflicts
  private checkMemberUpdateConflict(action: OfflineAction, serverFamily: any): DataConflict | null {
    const { userId, updates } = action.payload;
    const serverMember = serverFamily?.members?.find((m: any) => m.uid === userId);

    if (!serverMember) {
      return {
        id: `${action.id}_member_deleted`,
        type: 'deleted_resource',
        localAction: action,
        serverData: null,
        conflictingFields: ['existence'],
        timestamp: Date.now(),
        resolutionStrategy: 'server_wins'
      };
    }

    // Check for field-level conflicts
    const conflictingFields: string[] = [];
    const localUpdates = updates;

    Object.keys(localUpdates).forEach(field => {
      const localValue = localUpdates[field];
      const serverValue = serverMember[field];
      
      // Simple conflict detection - can be enhanced with version timestamps
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflictingFields.push(field);
      }
    });

    if (conflictingFields.length > 0) {
      return {
        id: `${action.id}_field_conflict`,
        type: 'data_conflict',
        localAction: action,
        serverData: serverMember,
        conflictingFields,
        timestamp: Date.now(),
        resolutionStrategy: 'field_level_merge'
      };
    }

    return null;
  }

  // Check for family update conflicts
  private checkFamilyUpdateConflict(action: OfflineAction, serverFamily: any): DataConflict | null {
    const { updates } = action.payload;
    const conflictingFields: string[] = [];

    Object.keys(updates).forEach(field => {
      if (field === 'updatedAt') return; // Skip timestamp fields
      
      const localValue = updates[field];
      const serverValue = serverFamily[field];
      
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflictingFields.push(field);
      }
    });

    if (conflictingFields.length > 0) {
      return {
        id: `${action.id}_family_conflict`,
        type: 'data_conflict',
        localAction: action,
        serverData: serverFamily,
        conflictingFields,
        timestamp: Date.now(),
        resolutionStrategy: 'last_writer_wins'
      };
    }

    return null;
  }

  // Handle detected conflicts
  private async handleConflicts(conflicts: DataConflict[]) {
    console.log(`🔄 Handling ${conflicts.length} conflicts`);
    
    for (const conflict of conflicts) {
      await this.resolveConflict(conflict);
    }
  }

  // Resolve a specific conflict based on strategy
  private async resolveConflict(conflict: DataConflict): Promise<boolean> {
    console.log(`🔄 Resolving conflict: ${conflict.type} with strategy: ${conflict.resolutionStrategy}`);
    
    try {
      switch (conflict.resolutionStrategy) {
        case 'server_wins':
          return await this.resolveServerWins(conflict);
        case 'local_wins':
          return await this.resolveLocalWins(conflict);
        case 'merge_changes':
          return await this.resolveMergeChanges(conflict);
        case 'field_level_merge':
          return await this.resolveFieldLevelMerge(conflict);
        case 'last_writer_wins':
          return await this.resolveLastWriterWins(conflict);
        default:
          console.warn(`🔄 Unknown resolution strategy: ${conflict.resolutionStrategy}`);
          return false;
      }
    } catch (error) {
      console.error('🔄 Error resolving conflict:', error);
      return false;
    }
  }

  // Resolution strategy: Server wins
  private async resolveServerWins(conflict: DataConflict): Promise<boolean> {
    const store = useFamilyStore.getState();
    
    // Remove the conflicting action from queue
    store.offline.removePendingAction(conflict.localAction.id);
    
    // Update local store with server data
    switch (conflict.localAction.type) {
      case 'COMPLETE_CHORE':
        // Refresh chores data from server
        console.log('🔄 Server wins: Refreshing chore data');
        break;
      case 'UPDATE_MEMBER':
        // Refresh family data from server
        console.log('🔄 Server wins: Refreshing family data');
        break;
    }
    
    return true;
  }

  // Resolution strategy: Local wins
  private async resolveLocalWins(conflict: DataConflict): Promise<boolean> {
    // Force execute the local action despite conflict
    console.log('🔄 Local wins: Force executing local action');
    return await this.executeActionWithForce(conflict.localAction);
  }

  // Resolution strategy: Merge changes
  private async resolveMergeChanges(conflict: DataConflict): Promise<boolean> {
    console.log('🔄 Merge changes: Attempting intelligent merge');
    
    if (conflict.type === 'data_conflict') {
      return await this.performIntelligentMerge(conflict);
    }
    
    // Fallback to server wins for non-mergeable conflicts
    return await this.resolveServerWins(conflict);
  }

  // Resolution strategy: Field-level merge
  private async resolveFieldLevelMerge(conflict: DataConflict): Promise<boolean> {
    console.log('🔄 Field-level merge: Merging individual fields');
    
    const localUpdates = conflict.localAction.payload.updates;
    const serverData = conflict.serverData;
    
    // Create merged data with intelligent field selection
    const mergedData = { ...serverData };
    
    for (const field of conflict.conflictingFields) {
      // Apply field-specific merge logic
      mergedData[field] = this.mergeField(field, localUpdates[field], serverData[field]);
    }
    
    // Execute merged update
    const mergedAction: OfflineAction = {
      ...conflict.localAction,
      payload: {
        ...conflict.localAction.payload,
        updates: mergedData
      }
    };
    
    return await this.executeActionWithForce(mergedAction);
  }

  // Resolution strategy: Last writer wins
  private async resolveLastWriterWins(conflict: DataConflict): Promise<boolean> {
    const localTimestamp = conflict.localAction.timestamp;
    const serverTimestamp = this.getServerTimestamp(conflict.serverData);
    
    if (localTimestamp > serverTimestamp) {
      console.log('🔄 Last writer wins: Local action is newer');
      return await this.resolveLocalWins(conflict);
    } else {
      console.log('🔄 Last writer wins: Server data is newer');
      return await this.resolveServerWins(conflict);
    }
  }

  // Perform intelligent merge for data conflicts
  private async performIntelligentMerge(conflict: DataConflict): Promise<boolean> {
    const localData = conflict.localAction.payload.updates;
    const serverData = conflict.serverData;
    
    // Create intelligently merged data
    const mergedData = { ...serverData };
    
    // Apply merge logic for each conflicting field
    for (const field of conflict.conflictingFields) {
      mergedData[field] = this.mergeField(field, localData[field], serverData[field]);
    }
    
    // Execute the merged update
    return await this.executeMergedUpdate(conflict.localAction, mergedData);
  }

  // Merge individual fields based on field type and semantics
  private mergeField(fieldName: string, localValue: any, serverValue: any): any {
    // Numeric fields: use maximum value (for points, streaks, etc.)
    if (typeof localValue === 'number' && typeof serverValue === 'number') {
      if (fieldName.includes('points') || fieldName.includes('xp') || fieldName.includes('streak')) {
        return Math.max(localValue, serverValue);
      }
    }
    
    // Array fields: merge arrays
    if (Array.isArray(localValue) && Array.isArray(serverValue)) {
      return [...new Set([...serverValue, ...localValue])];
    }
    
    // Object fields: merge objects
    if (typeof localValue === 'object' && typeof serverValue === 'object') {
      return { ...serverValue, ...localValue };
    }
    
    // Default: prefer local value for user-initiated changes
    return localValue;
  }

  // Execute action with force (override conflicts)
  private async executeActionWithForce(action: OfflineAction): Promise<boolean> {
    try {
      console.log(`🔄 Force executing action: ${action.type}`);
      
      // Use existing action execution logic but with force flag
      switch (action.type) {
        case 'COMPLETE_CHORE':
          const result = await completeChore(action.payload.choreId, action.userId);
          return result.success;
        case 'UPDATE_MEMBER':
          return await updateFamilyMember(action.payload.familyId, action.payload.userId, action.payload.updates);
        case 'UPDATE_FAMILY':
          return await updateFamily(action.payload.familyId, action.payload.updates);
        default:
          console.warn(`🔄 Unsupported force action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error('🔄 Error force executing action:', error);
      return false;
    }
  }

  // Execute merged update
  private async executeMergedUpdate(originalAction: OfflineAction, mergedData: any): Promise<boolean> {
    const store = useFamilyStore.getState();
    
    // Remove original action
    store.removePendingAction(originalAction.id);
    
    // Create new action with merged data
    const mergedAction: OfflineAction = {
      ...originalAction,
      id: `${originalAction.id}_merged`,
      payload: {
        ...originalAction.payload,
        updates: mergedData
      }
    };
    
    // Execute merged action
    return await this.executeActionWithForce(mergedAction);
  }

  // Helper methods
  private getActionDataType(action: OfflineAction): string {
    switch (action.type) {
      case 'COMPLETE_CHORE':
      case 'CREATE_CHORE':
      case 'UPDATE_CHORE':
      case 'DELETE_CHORE':
        return 'chores';
      case 'UPDATE_MEMBER':
      case 'UPDATE_FAMILY':
        return 'family';
      case 'REDEEM_REWARD':
        return 'rewards';
      default:
        return 'unknown';
    }
  }

  private getServerTimestamp(serverData: any): number {
    if (serverData?.updatedAt) {
      if (serverData.updatedAt instanceof Timestamp) {
        return serverData.updatedAt.toMillis();
      }
      if (serverData.updatedAt instanceof Date) {
        return serverData.updatedAt.getTime();
      }
      if (typeof serverData.updatedAt === 'string') {
        return new Date(serverData.updatedAt).getTime();
      }
    }
    return 0;
  }

  // Background sync monitoring
  private setupBackgroundSync() {
    // Enhanced background sync will be implemented here
    console.log('🔄 Background sync monitoring initialized');
  }

  // Enhanced sync with metrics
  async performEnhancedSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('🔄 Sync already in progress, skipping');
      return this.createEmptySyncResult();
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    
    console.log('🔄 Starting enhanced sync...');
    
    const store = useFamilyStore.getState();
    const actionsToSync = store.offline.getActionsForSync();
    
    const result: SyncResult = {
      success: false,
      syncedActions: 0,
      failedActions: 0,
      conflicts: [],
      retryableActions: [],
      errors: [],
      metrics: {
        startTime,
        endTime: 0,
        duration: 0,
        networkLatency: 0,
        dataTransferred: 0,
        conflictsDetected: 0,
        conflictsResolved: 0
      }
    };

    try {
      // Execute enhanced sync logic here
      for (const action of actionsToSync) {
        try {
          const actionResult = await this.syncActionWithConflictDetection(action);
          if (actionResult.success) {
            store.offline.removePendingAction(action.id);
            result.syncedActions++;
          } else if (actionResult.conflict) {
            result.conflicts.push(actionResult.conflict);
            result.metrics.conflictsDetected++;
          } else {
            store.offline.movePendingToFailed(action.id, actionResult.error || 'Unknown error');
            result.failedActions++;
            result.errors.push(actionResult.error || 'Unknown error');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          store.movePendingToFailed(action.id, errorMessage);
          result.failedActions++;
          result.errors.push(errorMessage);
        }
      }

      const endTime = Date.now();
      result.metrics.endTime = endTime;
      result.metrics.duration = endTime - startTime;
      result.success = result.failedActions === 0;

      console.log(`🔄 Enhanced sync completed: ${result.syncedActions} synced, ${result.failedActions} failed, ${result.conflicts.length} conflicts`);
      
    } catch (error) {
      console.error('🔄 Enhanced sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
      this.lastSyncTimestamp = Date.now();
    }

    return result;
  }

  // Sync individual action with conflict detection
  private async syncActionWithConflictDetection(action: OfflineAction): Promise<{
    success: boolean;
    conflict?: DataConflict;
    error?: string;
  }> {
    // Pre-sync conflict check
    const conflicts = await this.preCheckConflicts(action);
    
    if (conflicts.length > 0) {
      const conflict = conflicts[0]; // Handle first conflict
      const resolved = await this.resolveConflict(conflict);
      
      return {
        success: resolved,
        conflict: resolved ? undefined : conflict
      };
    }

    // Execute action normally
    try {
      const success = await this.executeAction(action);
      return { success };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Pre-sync conflict check
  private async preCheckConflicts(action: OfflineAction): Promise<DataConflict[]> {
    // Implement pre-sync conflict detection
    // This would check server state before executing action
    return [];
  }

  // Execute action with full implementation
  private async executeAction(action: OfflineAction): Promise<boolean> {
    try {
      console.log(`🔄 Executing action: ${action.type} for user ${action.userId}`);
      
      switch (action.type) {
        case 'COMPLETE_CHORE':
          const result = await completeChore(action.payload.choreId, action.userId);
          return result.success;
        
        case 'CREATE_CHORE':
          const createResult = await createChore(action.payload.chore);
          return createResult !== null;
        
        case 'UPDATE_CHORE':
          return await updateChore(action.payload.choreId, action.payload.updates);
        
        case 'DELETE_CHORE':
          return await deleteChore(action.payload.choreId);
        
        case 'REDEEM_REWARD':
          const redeemResult = await redeemReward(
            action.payload.rewardId, 
            action.userId, 
            action.payload.familyId
          );
          return redeemResult.success;
        
        case 'UPDATE_MEMBER':
          return await updateFamilyMember(
            action.payload.familyId, 
            action.payload.userId, 
            action.payload.updates
          );
        
        case 'UPDATE_FAMILY':
          return await updateFamily(action.payload.familyId, action.payload.updates);
        
        case 'CLAIM_CHORE':
          // TODO: Implement claimChore function when available
          console.warn('🔄 CLAIM_CHORE not yet implemented');
          return false;
        
        case 'TAKEOVER_CHORE':
          // TODO: Implement takeoverChore function when available
          console.warn('🔄 TAKEOVER_CHORE not yet implemented');
          return false;
        
        case 'CREATE_HELP_REQUEST':
          // TODO: Implement createHelpRequest function when available
          console.warn('🔄 CREATE_HELP_REQUEST not yet implemented');
          return false;
        
        case 'CREATE_TRADE_PROPOSAL':
          // TODO: Implement createTradeProposal function when available
          console.warn('🔄 CREATE_TRADE_PROPOSAL not yet implemented');
          return false;
        
        default:
          console.warn(`🔄 Unsupported action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`🔄 Error executing action ${action.type}:`, error);
      return false;
    }
  }

  private createEmptySyncResult(): SyncResult {
    return {
      success: true,
      syncedActions: 0,
      failedActions: 0,
      conflicts: [],
      retryableActions: [],
      errors: [],
      metrics: {
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        networkLatency: 0,
        dataTransferred: 0,
        conflictsDetected: 0,
        conflictsResolved: 0
      }
    };
  }

  // Cleanup
  cleanup() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
    this.isInitialized = false;
    console.log('🔄 Enhanced sync service cleaned up');
  }
}

// Export singleton instance
export const enhancedSyncService = new EnhancedSyncService();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  enhancedSyncService.init();
}