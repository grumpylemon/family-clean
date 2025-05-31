/**
 * Bulk Operation History Component
 * Displays operation history with rollback capabilities and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { UniversalIcon } from './ui/UniversalIcon';
import { Toast } from './ui/Toast';
import { operationHistoryService } from '../services/operationHistoryService';
import { useFamily } from '../hooks/useZustandHooks';

interface BulkOperationRecord {
  id: string;
  familyId: string;
  executedBy: string;
  executedAt: string;
  operation: any;
  affectedChoreIds: string[];
  success: boolean;
  errors?: string[];
  warnings?: string[];
  aiAssisted: boolean;
  naturalLanguageCommand?: string;
  rollbackAvailable: boolean;
  satisfactionScore?: number;
  rollbackHistory?: any[];
}

interface BulkOperationHistoryProps {
  visible: boolean;
  onClose: () => void;
}

export function BulkOperationHistory({ visible, onClose }: BulkOperationHistoryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { family } = useFamily();
  
  const [history, setHistory] = useState<BulkOperationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'recent' | 'rollbackable' | 'analytics'>('recent');

  useEffect(() => {
    if (visible && family?.id) {
      loadHistory();
    }
  }, [visible, family?.id, selectedTab]);

  const loadHistory = async () => {
    if (!family?.id) return;
    
    setLoading(true);
    try {
      let records: BulkOperationRecord[] = [];
      
      switch (selectedTab) {
        case 'recent':
          records = await operationHistoryService.getFamilyOperationHistory(family.id, 50);
          break;
        case 'rollbackable':
          records = await operationHistoryService.getRollbackableOperations(family.id);
          break;
        case 'analytics':
          records = await operationHistoryService.getFamilyOperationHistory(family.id, 100);
          break;
      }
      
      setHistory(records);
    } catch (error) {
      console.error('Error loading operation history:', error);
      Toast.show('Failed to load operation history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleRollback = (record: BulkOperationRecord) => {
    const message = `This will undo the ${record.operation.operation?.replace('_', ' ')} operation affecting ${record.affectedChoreIds.length} chore${record.affectedChoreIds.length === 1 ? '' : 's'}.\n\nAre you sure you want to continue?`;
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Rollback Operation\n\n${message}`);
      if (confirmed) {
        executeRollback(record.id);
      }
    } else {
      Alert.alert(
        'Rollback Operation',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Rollback', 
            style: 'destructive',
            onPress: () => executeRollback(record.id)
          }
        ]
      );
    }
  };

  const executeRollback = async (operationId: string) => {
    try {
      const result = await operationHistoryService.rollbackOperation(
        operationId,
        'Manual rollback requested by user'
      );
      
      if (result.success) {
        Toast.show(result.message, 'success');
        loadHistory(); // Refresh the list
      } else {
        Toast.show(result.message, 'error');
      }
    } catch (error) {
      console.error('Rollback error:', error);
      Toast.show('Failed to rollback operation', 'error');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOperationIcon = (operationType: string): string => {
    const iconMap: Record<string, string> = {
      'modify_multiple': 'create',
      'assign_multiple': 'person-add',
      'reschedule_multiple': 'calendar',
      'delete_multiple': 'trash',
      'create_multiple': 'add-circle'
    };
    return iconMap[operationType] || 'documents';
  };

  const getOperationColor = (operationType: string, success: boolean): string => {
    if (!success) return colors.error;
    
    const colorMap: Record<string, string> = {
      'modify_multiple': colors.primary,
      'assign_multiple': colors.secondary,
      'reschedule_multiple': colors.warning,
      'delete_multiple': colors.error,
      'create_multiple': colors.success
    };
    return colorMap[operationType] || colors.primary;
  };

  const renderOperationCard = (record: BulkOperationRecord) => {
    const operationType = record.operation.operation || 'unknown';
    const operationColor = getOperationColor(operationType, record.success);
    const operationIcon = getOperationIcon(operationType);
    
    return (
      <View key={record.id} style={[styles.operationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.operationHeader}>
          <View style={[styles.operationIcon, { backgroundColor: operationColor + '20' }]}>
            <UniversalIcon name={operationIcon} size={20} color={operationColor} />
          </View>
          
          <View style={styles.operationInfo}>
            <Text style={[styles.operationTitle, { color: colors.text }]}>
              {operationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={[styles.operationSubtitle, { color: colors.textSecondary }]}>
              {record.affectedChoreIds.length} chore{record.affectedChoreIds.length === 1 ? '' : 's'} • {formatDate(record.executedAt)}
            </Text>
            
            {record.naturalLanguageCommand && (
              <Text style={[styles.naturalLanguageCommand, { color: colors.primary }]}>
                &quot;{record.naturalLanguageCommand}&quot;
              </Text>
            )}
          </View>
          
          <View style={styles.operationStatus}>
            {record.success ? (
              <UniversalIcon name="checkmark-circle" size={24} color={colors.success} />
            ) : (
              <UniversalIcon name="close-circle" size={24} color={colors.error} />
            )}
          </View>
        </View>
        
        <View style={styles.operationDetails}>
          <View style={styles.operationTags}>
            {record.aiAssisted && (
              <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>AI Assisted</Text>
              </View>
            )}
            
            {record.rollbackHistory && record.rollbackHistory.length > 0 && (
              <View style={[styles.tag, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.tagText, { color: colors.warning }]}>Rolled Back</Text>
              </View>
            )}
            
            {record.satisfactionScore !== undefined && (
              <View style={[styles.tag, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.tagText, { color: colors.success }]}>
                  ⭐ {record.satisfactionScore.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          
          {record.errors && record.errors.length > 0 && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                Error: {record.errors[0]}
              </Text>
            </View>
          )}
          
          {record.rollbackAvailable && (
            <TouchableOpacity
              style={[styles.rollbackButton, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}
              onPress={() => handleRollback(record)}
            >
              <UniversalIcon name="arrow-undo" size={16} color={colors.warning} />
              <Text style={[styles.rollbackButtonText, { color: colors.warning }]}>
                Rollback
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTabButton = (tab: string, label: string) => {
    const isActive = selectedTab === tab;
    
    return (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tabButton,
          isActive && { backgroundColor: colors.primary + '20' }
        ]}
        onPress={() => setSelectedTab(tab as any)}
      >
        <Text style={[
          styles.tabButtonText,
          { color: isActive ? colors.primary : colors.textSecondary }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    let message = 'No operations found';
    let icon = 'documents-outline';
    
    switch (selectedTab) {
      case 'rollbackable':
        message = 'No operations available for rollback';
        icon = 'arrow-undo-outline';
        break;
      case 'analytics':
        message = 'Not enough data for analytics';
        icon = 'analytics-outline';
        break;
    }
    
    return (
      <View style={styles.emptyState}>
        <UniversalIcon name={icon} size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
          {message}
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
          Operation history will appear here once you start using bulk operations
        </Text>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <UniversalIcon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Operation History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {renderTabButton('recent', 'Recent')}
        {renderTabButton('rollbackable', 'Rollbackable')}
        {renderTabButton('analytics', 'Analytics')}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {history.length > 0 ? (
          <View style={styles.operationsList}>
            {history.map(renderOperationCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  operationsList: {
    padding: 20,
    gap: 16,
  },
  operationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  operationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationInfo: {
    flex: 1,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  operationSubtitle: {
    fontSize: 14,
  },
  naturalLanguageCommand: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  operationStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationDetails: {
    gap: 8,
  },
  operationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: 12,
  },
  rollbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  rollbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});