// Network Service - Handles network detection and sync operations
// Integrates with Zustand store for offline-first functionality

import { Platform } from 'react-native';
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
  private onlineStatus = true;
  
  // Simple callback-based approach to avoid circular dependencies
  private statusUpdateCallback: ((isOnline: boolean) => void) | null = null;
  
  // Set callback to update store without direct reference
  setStatusUpdateCallback(callback: (isOnline: boolean) => void) {
    this.statusUpdateCallback = callback;
    console.log('🌐 NetworkService: Status update callback set');
  }
  
  // Update online status
  private updateOnlineStatus(isOnline: boolean) {
    if (this.onlineStatus !== isOnline) {
      this.onlineStatus = isOnline;
      console.log(`🌐 NetworkService: Status changed to ${isOnline ? 'online' : 'offline'}`);
      
      if (this.statusUpdateCallback) {
        try {
          this.statusUpdateCallback(isOnline);
        } catch (error) {
          console.warn('🌐 NetworkService: Error updating status', error);
        }
      }
    }
  }

  // Simple network status update without store dependency
  private updateNetworkStatus(isOnline: boolean) {
    this.updateOnlineStatus(isOnline);
  }

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
          
          console.log('🌐 Network status changed:', isConnected ? 'online' : 'offline');
          this.updateNetworkStatus(Boolean(isConnected));
        });
      }).catch(err => {
        console.warn('NetInfo not available:', err);
      });
    } else {
      // Use navigator.onLine for web (only if window is available)
      if (typeof window !== 'undefined') {
        const updateNetworkStatus = () => {
          this.updateNetworkStatus(navigator.onLine);
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
        this.updateNetworkStatus(true);
      }
    }
    
    // Log successful initialization
    console.log('🌐 NetworkService: Network monitoring initialized successfully');
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
    console.log('🌐 NetworkService: Cleanup completed');
  }
}

// Export singleton instance
export const networkService = new NetworkService();