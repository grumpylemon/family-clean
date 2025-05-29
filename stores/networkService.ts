// Network Service - Handles network detection and sync operations
// Integrates with Zustand store for offline-first functionality

import { Platform } from 'react-native';
import { useFamilyStore } from './familyStore';
import { OfflineAction, NetworkStatus } from './types';

// Import Firebase services
import {
  completeChore,
  createChore,
  updateChore,
  deleteChore,
  redeemReward,
  updateFamilyMember,
  updateFamily
} from '@/services/firestore';

// Import enhanced sync service
import { enhancedSyncService } from './enhancedSyncService';

class NetworkService {
  private unsubscribe: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Initialize network monitoring
  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log('🌐 NetworkService: Initializing network monitoring');
    
    if (Platform.OS !== 'web') {
      // Use NetInfo for React Native - dynamically import to avoid web issues
      import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
        this.unsubscribe = NetInfo.addEventListener(state => {
          const isConnected = state.isConnected && state.isInternetReachable;
          const networkStatus: NetworkStatus = isConnected ? 'online' : 'offline';
          
          console.log('🌐 Network status changed:', networkStatus);
          useFamilyStore.getState().offline.setOnlineStatus(networkStatus === 'online');
        });
      }).catch(err => {
        console.warn('NetInfo not available:', err);
      });
    } else {
      // Use navigator.onLine for web (only if window is available)
      if (typeof window !== 'undefined') {
        const updateNetworkStatus = () => {
          const networkStatus: NetworkStatus = navigator.onLine ? 'online' : 'offline';
          useFamilyStore.getState().offline.setOnlineStatus(networkStatus === 'online');
        };
        
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        
        // Set initial status
        updateNetworkStatus();
        
        this.unsubscribe = () => {
          window.removeEventListener('online', updateNetworkStatus);
          window.removeEventListener('offline', updateNetworkStatus);
        };
      } else {
        // Server-side rendering fallback
        console.log('🌐 NetworkService: Window not available, assuming online');
        useFamilyStore.getState().offline.setOnlineStatus(true);
      }
    }
    
    // Start periodic sync check
    this.startPeriodicSync();
  }

  // Cleanup network monitoring
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.isInitialized = false;
  }

  // Start periodic sync attempts
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      const store = useFamilyStore.getState();
      if (store.offline.isOnline && store.offline.pendingActions.length > 0) {
        this.syncPendingActions();
      }
    }, 30000);
  }

  // Execute pending actions with enhanced sync capabilities
  async syncPendingActions(): Promise<void> {
    console.log('🌐 Using enhanced sync service for improved conflict resolution');
    
    try {
      const result = await enhancedSyncService.performEnhancedSync();
      
      // Update store with enhanced sync results
      const store = useFamilyStore.getState();
      store.offline.updateSyncStatus({
        isActive: false,
        totalActions: result.syncedActions + result.failedActions,
        syncedActions: result.syncedActions,
        failedActions: result.failedActions,
        progress: 100,
        lastSyncTime: new Date(),
        lastError: result.errors.length > 0 ? result.errors[0] : undefined
      });
      
      console.log(`🔄 Enhanced sync completed: ${result.syncedActions} synced, ${result.failedActions} failed, ${result.conflicts.length} conflicts resolved`);
      
      // Handle any conflicts that need user attention
      if (result.conflicts.length > 0) {
        console.warn('🔄 Some conflicts require manual resolution:', result.conflicts);
      }
      
    } catch (error) {
      console.error('🔄 Enhanced sync failed, falling back to basic sync:', error);
      // Fallback to basic sync if enhanced sync fails
      await this.basicSyncPendingActions();
    }
  }

  // Fallback basic sync method
  private async basicSyncPendingActions(): Promise<void> {
    const store = useFamilyStore.getState();
    
    if (!store.offline.isOnline || store.offline.syncStatus.isActive) {
      console.log('🌐 Sync skipped: offline or already syncing');
      return;
    }
    
    const actionsToSync = store.offline.getActionsForSync();
    if (actionsToSync.length === 0) {
      console.log('🌐 No actions to sync');
      return;
    }
    
    console.log(`🔄 Starting basic sync of ${actionsToSync.length} actions`);
    
    // Update sync status
    store.offline.updateSyncStatus({
      isActive: true,
      totalActions: actionsToSync.length,
      syncedActions: 0,
      failedActions: 0,
      progress: 0,
      lastError: undefined
    });
    
    let syncedCount = 0;
    let failedCount = 0;
    
    // Process actions sequentially to avoid conflicts
    for (const action of actionsToSync) {
      try {
        console.log(`🔄 Syncing action: ${action.type} (${action.id})`);
        
        const success = await this.executeAction(action);
        
        if (success) {
          store.offline.removePendingAction(action.id);
          syncedCount++;
          console.log(`✅ Action synced successfully: ${action.id}`);
        } else {
          store.offline.movePendingToFailed(action.id, 'Sync failed - unknown error');
          failedCount++;
          console.log(`❌ Action sync failed: ${action.id}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        store.offline.movePendingToFailed(action.id, errorMessage);
        failedCount++;
        console.error(`❌ Action sync error:`, error);
      }
      
      // Update progress
      const progress = Math.round(((syncedCount + failedCount) / actionsToSync.length) * 100);
      store.offline.updateSyncStatus({
        progress,
        syncedActions: syncedCount,
        failedActions: failedCount
      });
    }
    
    // Final sync status update
    store.offline.updateSyncStatus({
      isActive: false,
      lastSyncTime: new Date(),
      lastError: failedCount > 0 ? `${failedCount} actions failed to sync` : undefined
    });
    
    console.log(`🔄 Basic sync completed: ${syncedCount} success, ${failedCount} failed`);
  }

  // Execute individual action
  private async executeAction(action: OfflineAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'COMPLETE_CHORE':
          return await this.executeCompleteChore(action);
        
        case 'CREATE_CHORE':
          return await this.executeCreateChore(action);
        
        case 'UPDATE_CHORE':
          return await this.executeUpdateChore(action);
        
        case 'DELETE_CHORE':
          return await this.executeDeleteChore(action);
        
        case 'REDEEM_REWARD':
          return await this.executeRedeemReward(action);
        
        case 'UPDATE_MEMBER':
          return await this.executeUpdateMember(action);
        
        case 'UPDATE_FAMILY':
          return await this.executeUpdateFamily(action);
        
        default:
          console.warn(`🌐 Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`🌐 Error executing action ${action.type}:`, error);
      return false;
    }
  }

  // Action execution methods
  private async executeCompleteChore(action: OfflineAction): Promise<boolean> {
    const { choreId, userId } = action.payload;
    const result = await completeChore(choreId, userId);
    
    if (result.success) {
      // Remove from pending completions
      useFamilyStore.getState().chores.removePendingCompletion(choreId);
      
      // Refresh chores data
      // Note: In a full implementation, we'd refresh from server here
      console.log(`✅ Chore ${choreId} completed successfully`);
      return true;
    }
    
    return false;
  }

  private async executeCreateChore(action: OfflineAction): Promise<boolean> {
    const choreData = action.payload;
    const choreId = await createChore(choreData);
    return !!choreId;
  }

  private async executeUpdateChore(action: OfflineAction): Promise<boolean> {
    const { choreId, updates } = action.payload;
    return await updateChore(choreId, updates);
  }

  private async executeDeleteChore(action: OfflineAction): Promise<boolean> {
    const { choreId } = action.payload;
    return await deleteChore(choreId);
  }

  private async executeRedeemReward(action: OfflineAction): Promise<boolean> {
    const { rewardId } = action.payload;
    const result = await redeemReward(rewardId, action.userId);
    return result.success;
  }

  private async executeUpdateMember(action: OfflineAction): Promise<boolean> {
    const { familyId, userId, updates } = action.payload;
    return await updateFamilyMember(familyId, userId, updates);
  }

  private async executeUpdateFamily(action: OfflineAction): Promise<boolean> {
    const { familyId, updates } = action.payload;
    return await updateFamily(familyId, updates);
  }

  // Manual sync trigger
  async triggerSync(): Promise<void> {
    console.log('🔄 Manual sync triggered');
    await this.syncPendingActions();
  }

  // Check if device is online
  async checkConnectivity(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }
    
    try {
      const { default: NetInfo } = await import('@react-native-community/netinfo');
      const state = await NetInfo.fetch();
      return !!(state.isConnected && state.isInternetReachable);
    } catch (error) {
      console.error('🌐 Error checking connectivity:', error);
      return false;
    }
  }
}

// Export singleton instance
export const networkService = new NetworkService();

// Auto-initialize when imported (only if not in SSR)
if (typeof window !== 'undefined') {
  if (Platform.OS !== 'web') {
    // Import NetInfo for React Native
    import('@react-native-community/netinfo').then(() => {
      networkService.init();
    }).catch(error => {
      console.error('🌐 Failed to initialize NetInfo:', error);
      // Fallback to basic initialization without NetInfo
      networkService.init();
    });
  } else {
    // Web doesn't need dynamic import
    networkService.init();
  }

  // Cleanup on app termination
  if (Platform.OS === 'web') {
    window.addEventListener('beforeunload', () => {
      networkService.cleanup();
    });
  }
}