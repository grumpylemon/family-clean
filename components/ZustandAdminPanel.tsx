// Zustand Remote Admin Panel - Advanced store management for administrators
// Provides comprehensive control over offline functionality and store state

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useFamilyStore } from '@/stores/familyStore';
import { useOfflineStatus } from '@/stores/hooks';
import { enhancedSyncService } from '@/stores/enhancedSyncService';
import { cacheService } from '@/stores/cacheService';
import { cacheIntegration } from '@/stores/cacheIntegration';

interface ZustandAdminPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function ZustandAdminPanel({ visible, onClose }: ZustandAdminPanelProps) {
  const [debugMode, setDebugMode] = useState(false);
  const [cacheStats, setCacheStats] = useState(() => {
    try {
      return cacheService.getStats();
    } catch (error) {
      console.error('Failed to get initial cache stats:', error);
      return {
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        evictionCount: 0,
        compressionRatio: 1,
        averageAccessTime: 0,
        cacheEfficiency: 0,
        priorityDistribution: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };
    }
  });
  
  const {
    isOnline,
    networkStatus,
    pendingActions,
    failedActions,
    syncStatus,
    manualSync,
    clearFailedActions,
    retryFailedAction
  } = useOfflineStatus();

  const {
    family,
    chores,
    rewards,
    user,
    reset: resetStore,
    calculateCacheSize,
    cleanupCache,
    invalidateCache
  } = useFamilyStore();

  // Store statistics
  const cacheSize = calculateCacheSize();
  const totalActions = pendingActions.length + failedActions.length;
  const hasStaleData = [family, chores, rewards].some(data => 
    data?.metadata?.isStale || false
  );

  if (!visible) return null;

  const handleForceOffline = () => {
    Alert.alert(
      'Force Offline Mode',
      'This will simulate offline conditions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Force Offline', 
          style: 'destructive',
          onPress: () => {
            const store = useFamilyStore.getState();
            if (store.offline && store.offline.setOnlineStatus) {
              store.offline.setOnlineStatus(false);
            } else {
              console.error('setOnlineStatus method not available');
            }
            Alert.alert('Success', 'Forced offline mode enabled');
          }
        }
      ]
    );
  };

  const handleForceOnline = () => {
    const store = useFamilyStore.getState();
    if (store.offline && store.offline.setOnlineStatus) {
      store.offline.setOnlineStatus(true);
    } else {
      console.error('setOnlineStatus method not available');
    }
    Alert.alert('Success', 'Network status reset to online');
  };

  const handleEnhancedSync = async () => {
    try {
      Alert.alert('Enhanced Sync', 'Starting enhanced sync with conflict resolution...');
      
      if (enhancedSyncService && typeof enhancedSyncService.performEnhancedSync === 'function') {
        const result = await enhancedSyncService.performEnhancedSync();
        
        const message = `Enhanced sync completed:\n• ${result.syncedActions} actions synced\n• ${result.failedActions} actions failed\n• ${result.conflicts.length} conflicts resolved\n• Duration: ${result.metrics.duration}ms`;
        
        Alert.alert(
          result.success ? 'Enhanced Sync Success' : 'Enhanced Sync Completed with Issues',
          message,
          [{ text: 'OK', style: 'default' }]
        );
        
        if (result.conflicts.length > 0) {
          console.log('🔄 Enhanced sync conflicts:', result.conflicts);
        }
      } else {
        throw new Error('Enhanced sync service not available');
      }
    } catch (error) {
      console.error('🔄 Enhanced sync error:', error);
      Alert.alert('Enhanced Sync Error', `Failed to perform enhanced sync: ${error}`);
    }
  };

  const handleResetStore = () => {
    Alert.alert(
      'Reset Store',
      'This will clear all cached data and pending actions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Store', 
          style: 'destructive',
          onPress: () => {
            resetStore();
            Alert.alert('Success', 'Zustand store has been reset');
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data but preserve pending actions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          onPress: () => {
            cleanupCache();
            invalidateCache();
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const handleExportState = () => {
    const state = useFamilyStore.getState();
    const exportData = {
      timestamp: new Date().toISOString(),
      user: state.user?.uid,
      familyId: state.family?.data.id,
      cacheSize,
      pendingActions: pendingActions.length,
      failedActions: failedActions.length,
      networkStatus,
      storeVersion: '1.0'
    };
    
    console.log('🔧 Store State Export:', JSON.stringify(exportData, null, 2));
    Alert.alert('Store Exported', 'Check console for detailed state information');
  };

  const handleWarmupCache = async () => {
    try {
      const state = useFamilyStore.getState();
      const userId = state.user?.uid || null;
      const familyId = state.family?.data.id || null;
      
      Alert.alert('Cache Warmup', 'Starting cache warmup process...');
      if (cacheIntegration && typeof cacheIntegration.warmupCache === 'function') {
        await cacheIntegration.warmupCache(userId, familyId);
      } else {
        throw new Error('Cache warmup method not available');
      }
      Alert.alert('Success', 'Cache warmup completed');
      
      // Refresh stats
      setCacheStats(cacheService.getStats());
    } catch {
      Alert.alert('Error', 'Failed to warmup cache');
    }
  };

  const handleClearByPriority = () => {
    Alert.alert(
      'Clear Low Priority Cache',
      'This will clear all low and medium priority cache entries. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            if (cacheService && typeof cacheService.clear === 'function') {
              await cacheService.clear({ keepPriority: ['critical', 'high'] });
            } else {
              throw new Error('Cache clear method not available');
            }
            setCacheStats(cacheService.getStats());
            Alert.alert('Success', 'Low priority cache cleared');
          }
        }
      ]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Zustand Remote Admin</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Store Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Store Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusCard}>
                <Text style={styles.statusValue}>{networkStatus}</Text>
                <Text style={styles.statusLabel}>Network</Text>
              </View>
              <View style={styles.statusCard}>
                <Text style={styles.statusValue}>{formatBytes(cacheSize)}</Text>
                <Text style={styles.statusLabel}>Cache Size</Text>
              </View>
              <View style={styles.statusCard}>
                <Text style={styles.statusValue}>{totalActions}</Text>
                <Text style={styles.statusLabel}>Total Actions</Text>
              </View>
              <View style={styles.statusCard}>
                <Text style={styles.statusValue}>{hasStaleData ? 'Yes' : 'No'}</Text>
                <Text style={styles.statusLabel}>Stale Data</Text>
              </View>
            </View>
          </View>

          {/* Network Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Network Controls</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.warningButton]} 
                onPress={handleForceOffline}
              >
                <Text style={styles.buttonText}>Force Offline</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.successButton]} 
                onPress={handleForceOnline}
              >
                <Text style={styles.buttonText}>Force Online</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={manualSync}
                disabled={!isOnline || syncStatus.isActive}
              >
                <Text style={styles.buttonText}>
                  {syncStatus.isActive ? 'Syncing...' : 'Basic Sync'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, { backgroundColor: '#7c3aed' }]} 
                onPress={handleEnhancedSync}
                disabled={!isOnline || syncStatus.isActive}
              >
                <Text style={styles.buttonText}>
                  {syncStatus.isActive ? 'Syncing...' : 'Enhanced Sync'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Offline Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Offline Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Debug Mode</Text>
              <Switch
                value={debugMode}
                onValueChange={setDebugMode}
                trackColor={{ false: '#f9a8d4', true: '#be185d' }}
                thumbColor={debugMode ? '#ffffff' : '#831843'}
              />
            </View>
            <Text style={styles.settingDescription}>
              {debugMode ? 'Enhanced logging enabled' : 'Standard logging mode'}
            </Text>
          </View>

          {/* Action Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Action Management</Text>
            {pendingActions && pendingActions.length > 0 && (
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>
                  📤 {pendingActions.length} Pending Actions
                </Text>
                {pendingActions.slice(0, 3).map((action, index) => (
                  <Text key={action.id} style={styles.actionItem}>
                    • {action.type} ({new Date(action.timestamp).toLocaleTimeString()})
                  </Text>
                ))}
                {pendingActions.length > 3 && (
                  <Text style={styles.actionMore}>
                    +{pendingActions.length - 3} more...
                  </Text>
                )}
              </View>
            )}

            {failedActions && failedActions.length > 0 && (
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>
                  ❌ {failedActions.length} Failed Actions
                </Text>
                {failedActions.slice(0, 3).map((action, index) => (
                  <View key={action.id} style={styles.failedActionRow}>
                    <Text style={styles.actionItem}>
                      • {action.type} (Retry {action.retryCount})
                    </Text>
                    <TouchableOpacity 
                      style={styles.retryButton}
                      onPress={() => retryFailedAction(action.id)}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  style={[styles.button, styles.dangerButton]} 
                  onPress={clearFailedActions}
                >
                  <Text style={styles.buttonText}>Clear Failed Actions</Text>
                </TouchableOpacity>
              </View>
            )}

            {totalActions === 0 && (
              <Text style={styles.emptyState}>No pending or failed actions</Text>
            )}
          </View>

          {/* Cache Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Cache Management</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.warningButton]} 
                onPress={handleClearCache}
              >
                <Text style={styles.buttonText}>Clear Cache</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={() => invalidateCache()}
              >
                <Text style={styles.buttonText}>Invalidate All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Advanced Cache Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Advanced Cache Analytics</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                try {
                  setCacheStats(cacheService.getStats());
                } catch (error) {
                  console.error('Failed to refresh cache stats:', error);
                  Alert.alert('Error', 'Failed to refresh cache statistics');
                }
              }}
            >
              <Text style={styles.refreshButtonText}>Refresh Stats</Text>
            </TouchableOpacity>
            
            <View style={styles.cacheStatsGrid}>
              <View style={styles.cacheStatCard}>
                <Text style={styles.cacheStatValue}>
                  {((cacheStats.cacheEfficiency || 0) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.cacheStatLabel}>Hit Rate</Text>
              </View>
              <View style={styles.cacheStatCard}>
                <Text style={styles.cacheStatValue}>
                  {formatBytes(cacheStats.totalSize)}
                </Text>
                <Text style={styles.cacheStatLabel}>Total Size</Text>
              </View>
              <View style={styles.cacheStatCard}>
                <Text style={styles.cacheStatValue}>
                  {cacheStats.entryCount}
                </Text>
                <Text style={styles.cacheStatLabel}>Entries</Text>
              </View>
              <View style={styles.cacheStatCard}>
                <Text style={styles.cacheStatValue}>
                  {cacheStats.averageAccessTime.toFixed(0)}ms
                </Text>
                <Text style={styles.cacheStatLabel}>Avg Access</Text>
              </View>
            </View>

            <View style={styles.cachePriorityBreakdown}>
              <Text style={styles.cacheBreakdownTitle}>Priority Distribution</Text>
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Critical:</Text>
                <Text style={styles.priorityValue}>{cacheStats.priorityDistribution.critical}</Text>
              </View>
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>High:</Text>
                <Text style={styles.priorityValue}>{cacheStats.priorityDistribution.high}</Text>
              </View>
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Medium:</Text>
                <Text style={styles.priorityValue}>{cacheStats.priorityDistribution.medium}</Text>
              </View>
              <View style={styles.priorityRow}>
                <Text style={styles.priorityLabel}>Low:</Text>
                <Text style={styles.priorityValue}>{cacheStats.priorityDistribution.low}</Text>
              </View>
            </View>

            <View style={styles.cacheActions}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleWarmupCache}
              >
                <Text style={styles.buttonText}>Warmup Cache</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.warningButton]} 
                onPress={handleClearByPriority}
              >
                <Text style={styles.buttonText}>Clear Low Priority</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗃️ Store Management</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleExportState}
              >
                <Text style={styles.buttonText}>Export State</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton]} 
                onPress={handleResetStore}
              >
                <Text style={styles.buttonText}>Reset Store</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Debug Info */}
          {debugMode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🐛 Debug Information</Text>
              <View style={styles.debugCard}>
                <Text style={styles.debugText}>User ID: {user?.uid || 'Not logged in'}</Text>
                <Text style={styles.debugText}>Family ID: {family?.data.id || 'No family'}</Text>
                <Text style={styles.debugText}>Store Version: 1.0</Text>
                <Text style={styles.debugText}>
                  Last Sync: {syncStatus.lastSyncTime?.toLocaleString() || 'Never'}
                </Text>
                <Text style={styles.debugText}>
                  Cache Items: Family({family ? '✓' : '✗'}), 
                  Chores({chores ? '✓' : '✗'}), 
                  Rewards({rewards ? '✓' : '✗'})
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9a8d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#831843',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#be185d',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#831843',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9f1239',
    fontStyle: 'italic',
  },
  actionCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 13,
    color: '#9f1239',
    marginBottom: 4,
  },
  actionMore: {
    fontSize: 12,
    color: '#9f1239',
    fontStyle: 'italic',
    marginTop: 4,
  },
  failedActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#be185d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    fontSize: 14,
    color: '#9f1239',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  debugCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  cacheStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  cacheStatCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  cacheStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 2,
  },
  cacheStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#831843',
    textAlign: 'center',
  },
  refreshButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cachePriorityBreakdown: {
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  cacheBreakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#9f1239',
  },
  priorityValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#be185d',
  },
  cacheActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});