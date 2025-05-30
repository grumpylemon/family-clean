import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useFamilyStore } from '../../stores/hooks';
import { ChoreTakeover } from '../../types';

interface PendingTakeover extends ChoreTakeover {
  selected?: boolean;
}

export default function TakeoverApprovalQueue() {
  const { family } = useFamilyStore((state) => state.family);
  const [pendingTakeovers, setPendingTakeovers] = useState<PendingTakeover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from Firebase
    const mockPendingTakeovers: PendingTakeover[] = [
      {
        id: 'takeover_1',
        choreId: 'chore_1',
        choreTitle: 'Deep Clean Garage',
        originalAssigneeId: 'user_1',
        originalAssigneeName: 'John',
        newAssigneeId: 'user_2',
        newAssigneeName: 'Sarah',
        familyId: family?.id || '',
        takenOverAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reason: 'overdue',
        bonusPoints: 38,
        bonusXP: 75,
        requiresAdminApproval: true,
        overdueHours: 48,
        selected: false,
      },
      {
        id: 'takeover_2',
        choreId: 'chore_2',
        choreTitle: 'Organize Basement Storage',
        originalAssigneeId: 'user_3',
        originalAssigneeName: 'Mike',
        newAssigneeId: 'user_2',
        newAssigneeName: 'Sarah',
        familyId: family?.id || '',
        takenOverAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        reason: 'not_home',
        bonusPoints: 31,
        bonusXP: 62,
        requiresAdminApproval: true,
        overdueHours: 72,
        selected: false,
      },
      {
        id: 'takeover_3',
        choreId: 'chore_3',
        choreTitle: 'Holiday Decoration Setup',
        originalAssigneeId: 'user_1',
        originalAssigneeName: 'John',
        newAssigneeId: 'user_4',
        newAssigneeName: 'Emma',
        familyId: family?.id || '',
        takenOverAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        reason: 'helping',
        bonusPoints: 44,
        bonusXP: 88,
        requiresAdminApproval: true,
        overdueHours: 24,
        selected: false,
      },
    ];

    setTimeout(() => {
      setPendingTakeovers(mockPendingTakeovers);
      setIsLoading(false);
    }, 1000);
  }, [family?.id]);

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setPendingTakeovers(prev => 
      prev.map(takeover => ({ ...takeover, selected: newSelectAll }))
    );
  };

  const toggleTakeoverSelection = (takeoverId: string) => {
    setPendingTakeovers(prev => 
      prev.map(takeover => 
        takeover.id === takeoverId 
          ? { ...takeover, selected: !takeover.selected }
          : takeover
      )
    );
  };

  const getSelectedTakeovers = () => {
    return pendingTakeovers.filter(takeover => takeover.selected);
  };

  const handleBulkAction = async (action: 'approve' | 'deny') => {
    const selectedTakeovers = getSelectedTakeovers();
    
    if (selectedTakeovers.length === 0) {
      Alert.alert('No Selection', 'Please select at least one takeover request.');
      return;
    }

    const actionText = action === 'approve' ? 'approve' : 'deny';
    const confirmMessage = `Are you sure you want to ${actionText} ${selectedTakeovers.length} takeover request(s)?`;

    Alert.alert(
      `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'deny' ? 'destructive' : 'default',
          onPress: () => processBulkAction(action, selectedTakeovers),
        },
      ]
    );
  };

  const processBulkAction = async (
    action: 'approve' | 'deny',
    takeovers: PendingTakeover[]
  ) => {
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove processed takeovers from the list
      const processedIds = takeovers.map(t => t.id);
      setPendingTakeovers(prev => 
        prev.filter(takeover => !processedIds.includes(takeover.id))
      );
      
      setSelectAll(false);
      
      const actionText = action === 'approve' ? 'approved' : 'denied';
      Alert.alert(
        'Success',
        `${takeovers.length} takeover request(s) ${actionText} successfully.`
      );
      
    } catch (error) {
      console.error('Bulk action error:', error);
      Alert.alert('Error', 'Failed to process bulk action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getUrgencyColor = (overdueHours: number): string => {
    if (overdueHours >= 72) return '#ef4444'; // Red for 3+ days
    if (overdueHours >= 48) return '#f59e0b'; // Orange for 2+ days
    if (overdueHours >= 24) return '#eab308'; // Yellow for 1+ day
    return '#10b981'; // Green for less than 1 day
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#be185d" />
        <Text style={styles.loadingText}>Loading approval queue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Takeover Approval Queue</Text>
        <Text style={styles.subtitle}>
          {pendingTakeovers.length} request(s) pending approval
        </Text>
      </View>

      {pendingTakeovers.length === 0 ? (
        <View style={styles.emptyState}>
          <WebIcon name="checkmark-done-circle" size={64} color="#10b981" />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            No takeover requests require approval right now.
          </Text>
        </View>
      ) : (
        <>
          {/* Bulk Actions */}
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <WebIcon 
                name={selectAll ? "checkbox" : "square-outline"} 
                size={20} 
                color="#be185d" 
              />
              <Text style={styles.selectAllText}>
                {selectAll ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.bulkButton,
                  styles.approveButton,
                  getSelectedTakeovers().length === 0 && styles.disabledButton
                ]}
                onPress={() => handleBulkAction('approve')}
                disabled={getSelectedTakeovers().length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <WebIcon name="checkmark" size={20} color="white" />
                    <Text style={styles.buttonText}>
                      Approve ({getSelectedTakeovers().length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.bulkButton,
                  styles.denyButton,
                  getSelectedTakeovers().length === 0 && styles.disabledButton
                ]}
                onPress={() => handleBulkAction('deny')}
                disabled={getSelectedTakeovers().length === 0 || isProcessing}
              >
                <WebIcon name="close" size={20} color="white" />
                <Text style={styles.buttonText}>
                  Deny ({getSelectedTakeovers().length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Takeover List */}
          <ScrollView style={styles.takeoverList} showsVerticalScrollIndicator={false}>
            {pendingTakeovers.map((takeover) => (
              <TouchableOpacity
                key={takeover.id}
                style={[
                  styles.takeoverCard,
                  takeover.selected && styles.selectedCard
                ]}
                onPress={() => toggleTakeoverSelection(takeover.id)}
                disabled={isProcessing}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <WebIcon 
                      name={takeover.selected ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={takeover.selected ? "#be185d" : "#9ca3af"} 
                    />
                    <View style={styles.choreInfo}>
                      <Text style={styles.choreTitle}>{takeover.choreTitle}</Text>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberText}>
                          {takeover.newAssigneeName} → {takeover.originalAssigneeName}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.cardRight}>
                    <View 
                      style={[
                        styles.urgencyBadge,
                        { backgroundColor: `${getUrgencyColor(takeover.overdueHours || 0)}20` }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.urgencyText,
                          { color: getUrgencyColor(takeover.overdueHours || 0) }
                        ]}
                      >
                        {Math.round(takeover.overdueHours || 0)}h overdue
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <WebIcon name="time" size={16} color="#9f1239" />
                    <Text style={styles.detailText}>
                      Requested {getTimeAgo(takeover.takenOverAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <WebIcon name="help-circle" size={16} color="#9f1239" />
                    <Text style={styles.detailText}>
                      Reason: {takeover.reason.replace('_', ' ')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <WebIcon name="star" size={16} color="#f59e0b" />
                    <Text style={styles.detailText}>
                      Bonus: {takeover.bonusPoints} pts, {takeover.bonusXP} XP
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9f1239',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9f1239',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#fbcfe8',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#be185d',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  denyButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  takeoverList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  takeoverCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#be185d',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedCard: {
    borderColor: '#be185d',
    backgroundColor: '#fef7ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: {
    fontSize: 14,
    color: '#9f1239',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#9f1239',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    lineHeight: 24,
  },
});