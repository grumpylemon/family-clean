import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Chore } from '../../types';
import { UniversalIcon } from '../ui/UniversalIcon';

interface Props {
  chore: Chore;
  currentUserId: string;
  familyMembers?: { uid: string; name: string }[];
  onPress: () => void;
  onComplete?: () => void;
  onClaim?: () => void;
  onTakeover?: () => void;
  onRequestHelp?: () => void;
  onProposeTrade?: () => void;
  isLocked?: boolean;
  canRequestHelp?: boolean;
  canProposeTrade?: boolean;
}

const BasicChoreCard: React.FC<Props> = ({
  chore,
  currentUserId,
  familyMembers = [],
  onPress,
  onComplete,
  onClaim,
  onTakeover,
  onRequestHelp,
  onProposeTrade,
  isLocked = false,
  canRequestHelp = false,
  canProposeTrade = false
}) => {
  const getChoreTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return 'person-outline';
      case 'family': return 'people-outline';
      case 'pet': return 'paw-outline';
      case 'shared': return 'git-network-outline';
      case 'room': return 'home-outline';
      default: return 'checkbox-outline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const isAssignedToCurrentUser = chore.assignedTo === currentUserId;
  const isUnassigned = !chore.assignedTo;
  const isAssignedToOther = chore.assignedTo && chore.assignedTo !== currentUserId;

  const getAssigneeName = () => {
    if (!chore.assignedTo) return null;
    if (chore.assignedTo === currentUserId) return 'You';
    const member = familyMembers.find(m => m.uid === chore.assignedTo);
    return member?.name || 'Unknown';
  };

  return (
    <TouchableOpacity
      style={styles.choreCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.choreHeader}>
        <View style={styles.choreTypeIcon}>
          <UniversalIcon 
            name={getChoreTypeIcon(chore.type) as any} 
            size={20} 
            color="#be185d" 
          />
        </View>
        <View style={styles.choreHeaderInfo}>
          <Text style={styles.choreTitle}>{chore.title}</Text>
          {chore.description && (
            <Text style={styles.choreDescription}>{chore.description}</Text>
          )}
        </View>
        <View style={styles.chorePointsBadge}>
          <Text style={styles.chorePoints}>{chore.points}</Text>
          <Text style={styles.chorePointsLabel}>pts</Text>
        </View>
      </View>

      <View style={styles.choreDetails}>
        <View style={styles.choreDetailRow}>
          <UniversalIcon name="calendar-outline" size={16} color="#9f1239" />
          <Text style={styles.choreDetailText}>
            Due: {new Date(chore.dueDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.choreDetailRow}>
          <View 
            style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(chore.difficulty) }]} 
          />
          <Text style={styles.choreDetailText}>
            {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)}
          </Text>
        </View>

        {chore.assignedTo && (
          <View style={styles.choreDetailRow}>
            <UniversalIcon name="person-outline" size={16} color="#9f1239" />
            <Text style={styles.choreDetailText}>
              {getAssigneeName()}
              {chore.takenOverBy && (
                <Text style={{ color: '#f59e0b' }}> (taken over)</Text>
              )}
            </Text>
          </View>
        )}

        {chore.originalAssignee && chore.originalAssignee !== chore.assignedTo && (
          <View style={styles.choreDetailRow}>
            <UniversalIcon name="time-outline" size={16} color="#f59e0b" />
            <Text style={[styles.choreDetailText, { color: '#f59e0b' }]}>
              Originally: {familyMembers.find(m => m.uid === chore.originalAssignee)?.name || 'Unknown'}
            </Text>
          </View>
        )}

        {chore.status === 'completed' && chore.completedAt && (
          <View style={styles.choreDetailRow}>
            <UniversalIcon name="checkmark-circle" size={16} color="#10b981" />
            <Text style={[styles.choreDetailText, { color: '#10b981' }]}>
              Completed {new Date(chore.completedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {isLocked && (
        <View style={styles.lockedSection}>
          <UniversalIcon name="lock-closed" size={16} color="#ef4444" />
          <Text style={styles.lockedText}>
            Locked until {new Date(chore.lockedUntil!).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Quick Action Buttons */}
      {chore.status === 'open' && !isLocked && (
        <View style={styles.choreActions}>
          {isAssignedToCurrentUser ? (
            <>
              <TouchableOpacity
                style={[styles.choreActionButton, styles.completeButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  onComplete?.();
                }}
              >
                <UniversalIcon name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
              {canRequestHelp && onRequestHelp && (
                <TouchableOpacity
                  style={[styles.choreActionButton, styles.helpButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onRequestHelp();
                  }}
                >
                  <UniversalIcon name="help-circle" size={20} color="#8b5cf6" />
                  <Text style={styles.helpButtonText}>Need Help</Text>
                </TouchableOpacity>
              )}
            </>
          ) : isUnassigned ? (
            <TouchableOpacity
              style={[styles.choreActionButton, styles.claimButton]}
              onPress={(e) => {
                e.stopPropagation();
                onClaim?.();
              }}
            >
              <UniversalIcon name="hand-right" size={20} color="#be185d" />
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          ) : isAssignedToOther ? (
            <>
              <TouchableOpacity
                style={[styles.choreActionButton, styles.takeoverButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  onTakeover?.();
                }}
              >
                <UniversalIcon name="swap-horizontal" size={20} color="#f59e0b" />
                <Text style={styles.takeoverButtonText}>Take Over</Text>
              </TouchableOpacity>
              {canProposeTrade && onProposeTrade && (
                <TouchableOpacity
                  style={[styles.choreActionButton, styles.tradeButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onProposeTrade();
                  }}
                >
                  <UniversalIcon name="git-compare" size={20} color="#06b6d4" />
                  <Text style={styles.tradeButtonText}>Trade</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </View>
      )}

      {/* Tap indicator */}
      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Tap for details</Text>
        <UniversalIcon name="chevron-forward" size={16} color="#be185d" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  choreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  choreHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  choreTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  choreHeaderInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#831843',
  },
  choreDescription: {
    fontSize: 14,
    color: '#9f1239',
    lineHeight: 20,
  },
  chorePointsBadge: {
    backgroundColor: '#be185d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  chorePoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  chorePointsLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  choreDetails: {
    gap: 10,
    marginBottom: 16,
  },
  choreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choreDetailText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  lockedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 4,
  },
  lockedText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  choreActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  choreActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 100,
  },
  completeButton: {
    backgroundColor: '#be185d',
  },
  completeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  claimButton: {
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  claimButtonText: {
    color: '#be185d',
    fontWeight: '600',
    fontSize: 14,
  },
  takeoverButton: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  takeoverButtonText: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 14,
  },
  helpButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  helpButtonText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 14,
  },
  tradeButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  tradeButtonText: {
    color: '#06b6d4',
    fontWeight: '600',
    fontSize: 14,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
    gap: 6,
  },
  tapText: {
    fontSize: 12,
    color: '#be185d',
    fontWeight: '500',
  },
});

export default BasicChoreCard;