// Offline Status Indicator - Shows network status and pending actions
// Demonstrates Zustand offline functionality

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOfflineStatus } from '../stores/hooks';

export function OfflineStatusIndicator() {
  const {
    isOnline,
    networkStatus,
    pendingActions,
    failedActions,
    syncStatus,
    hasPendingActions,
    hasFailedActions,
    manualSync,
    clearFailedActions
  } = useOfflineStatus();

  const getStatusColor = () => {
    switch (networkStatus) {
      case 'online': return '#10b981'; // Green
      case 'offline': return '#ef4444'; // Red
      case 'syncing': return '#f59e0b'; // Amber
      default: return '#6b7280'; // Gray
    }
  };

  const getStatusText = () => {
    if (networkStatus === 'syncing') {
      return `Syncing ${syncStatus.progress}%`;
    }
    return networkStatus.charAt(0).toUpperCase() + networkStatus.slice(1);
  };

  return (
    <View style={styles.container}>
      {/* Network Status */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Pending Actions */}
      {hasPendingActions && (
        <View style={styles.actionsRow}>
          <Text style={styles.actionsText}>
            📤 {pendingActions.length} pending action{pendingActions.length !== 1 ? 's' : ''}
          </Text>
          {isOnline && (
            <TouchableOpacity style={styles.syncButton} onPress={manualSync}>
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Failed Actions */}
      {hasFailedActions && (
        <View style={styles.actionsRow}>
          <Text style={styles.failedText}>
            ❌ {failedActions.length} failed action{failedActions.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearFailedActions}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync Status */}
      {syncStatus.isActive && (
        <View style={styles.syncProgress}>
          <Text style={styles.syncText}>
            Syncing: {syncStatus.syncedActions}/{syncStatus.totalActions} completed
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${syncStatus.progress}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Last Sync Time */}
      {syncStatus.lastSyncTime && !syncStatus.isActive && (
        <Text style={styles.lastSyncText}>
          Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  actionsText: {
    fontSize: 14,
    color: '#831843',
    flex: 1,
  },
  failedText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  syncButton: {
    backgroundColor: '#be185d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncProgress: {
    marginTop: 8,
  },
  syncText: {
    fontSize: 14,
    color: '#831843',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f9a8d4',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#be185d',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#9f1239',
    textAlign: 'center',
    marginTop: 8,
  },
});