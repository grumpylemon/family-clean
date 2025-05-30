import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import UniversalIcon from './ui/UniversalIcon';
import { Chore } from '../types';
import { useFamilyStore } from '../stores/familyStore';
import Toast from './ui/Toast';

interface ChoreTakeoverModalProps {
  visible: boolean;
  chore: Chore | null;
  onClose: () => void;
  onTakeover: () => void;
}

export default function ChoreTakeoverModal({
  visible,
  chore,
  onClose,
  onTakeover,
}: ChoreTakeoverModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [takeoverReason, setTakeoverReason] = useState<string>('overdue');
  
  const { takeoverChore, checkTakeoverEligibility, getTakeoverStats } = useFamilyStore(
    (state) => state.chores
  );
  const family = useFamilyStore((state) => state.family.family);
  
  if (!chore || !family) return null;
  
  const { eligible, reason: ineligibleReason } = checkTakeoverEligibility(chore);
  const { dailyCount, canTakeoverMore } = getTakeoverStats();
  
  const takeoverSettings = family.settings.takeoverSettings || {
    takeoverBonusPercentage: 25,
    takeoverXPMultiplier: 2.0,
    maxDailyTakeovers: 2,
    highValueThreshold: 100,
  };
  
  const bonusPoints = Math.round(chore.points * (takeoverSettings.takeoverBonusPercentage / 100));
  const bonusXP = Math.round((chore.xpReward || chore.points) * (takeoverSettings.takeoverXPMultiplier - 1));
  const requiresAdminApproval = chore.points >= takeoverSettings.highValueThreshold;
  
  const handleTakeover = async () => {
    if (!eligible) {
      Alert.alert('Cannot Takeover', ineligibleReason || 'This chore cannot be taken over');
      return;
    }
    
    setIsProcessing(true);
    try {
      await takeoverChore(chore.id!, takeoverReason);
      
      if (Platform.OS === 'android') {
        Toast.show({
          type: 'success',
          text1: 'Chore Takeover Successful',
          text2: requiresAdminApproval 
            ? 'Pending admin approval' 
            : `You've taken over "${chore.title}"!`,
        });
      } else {
        Alert.alert(
          'Success',
          requiresAdminApproval 
            ? 'Takeover request sent for admin approval' 
            : `You've successfully taken over "${chore.title}"!`
        );
      }
      
      onTakeover();
      onClose();
    } catch (error) {
      console.error('Takeover error:', error);
      Alert.alert('Error', 'Failed to takeover chore. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderTakeoverReasons = () => (
    <View style={styles.reasonsContainer}>
      <Text style={styles.sectionTitle}>Reason for Takeover</Text>
      {[
        { value: 'overdue', label: 'Overdue - Helping the family', icon: 'time-outline' },
        { value: 'not_home', label: 'Assignee not home', icon: 'home-outline' },
        { value: 'unable', label: 'Assignee unable to complete', icon: 'alert-circle-outline' },
        { value: 'helping', label: 'Just helping out', icon: 'heart-outline' },
      ].map((reason) => (
        <TouchableOpacity
          key={reason.value}
          style={[
            styles.reasonOption,
            takeoverReason === reason.value && styles.reasonOptionSelected,
          ]}
          onPress={() => setTakeoverReason(reason.value)}
        >
          <UniversalIcon
            name={reason.icon as any}
            size={20}
            color={takeoverReason === reason.value ? '#be185d' : '#9f1239'}
          />
          <Text
            style={[
              styles.reasonText,
              takeoverReason === reason.value && styles.reasonTextSelected,
            ]}
          >
            {reason.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Takeover Chore</Text>
            <TouchableOpacity onPress={onClose}>
              <UniversalIcon name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            {/* Chore Info */}
            <View style={styles.choreInfo}>
              <Text style={styles.choreTitle}>{chore.title}</Text>
              <Text style={styles.choreDetails}>
                Originally assigned to: {chore.assignedToName || 'Unknown'}
              </Text>
              <Text style={styles.choreDetails}>
                Due: {new Date(chore.dueDate).toLocaleDateString()}
              </Text>
              {chore.description && (
                <Text style={styles.choreDescription}>{chore.description}</Text>
              )}
            </View>
            
            {/* Rewards Preview */}
            <View style={styles.rewardsContainer}>
              <Text style={styles.sectionTitle}>Takeover Rewards</Text>
              <View style={styles.rewardRow}>
                <View style={styles.rewardItem}>
                  <UniversalIcon name="star" size={24} color="#f59e0b" />
                  <Text style={styles.rewardValue}>{chore.points + bonusPoints}</Text>
                  <Text style={styles.rewardLabel}>Total Points</Text>
                  <Text style={styles.bonusText}>+{bonusPoints} bonus</Text>
                </View>
                <View style={styles.rewardItem}>
                  <UniversalIcon name="sparkles" size={24} color="#10b981" />
                  <Text style={styles.rewardValue}>
                    {(chore.xpReward || chore.points) + bonusXP}
                  </Text>
                  <Text style={styles.rewardLabel}>Total XP</Text>
                  <Text style={styles.bonusText}>+{bonusXP} bonus</Text>
                </View>
              </View>
            </View>
            
            {/* Takeover Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                Daily Takeovers: {dailyCount}/{takeoverSettings.maxDailyTakeovers}
              </Text>
              {!canTakeoverMore && (
                <Text style={styles.warningText}>
                  You&apos;ve reached your daily takeover limit
                </Text>
              )}
            </View>
            
            {/* Reason Selection */}
            {renderTakeoverReasons()}
            
            {/* Admin Approval Notice */}
            {requiresAdminApproval && (
              <View style={styles.noticeContainer}>
                <UniversalIcon name="information-circle" size={20} color="#f59e0b" />
                <Text style={styles.noticeText}>
                  This high-value chore requires admin approval for takeover
                </Text>
              </View>
            )}
            
            {/* Eligibility Warning */}
            {!eligible && (
              <View style={[styles.noticeContainer, styles.errorNotice]}>
                <UniversalIcon name="alert-circle" size={20} color="#ef4444" />
                <Text style={[styles.noticeText, styles.errorText]}>
                  {ineligibleReason}
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.takeoverButton,
                (!eligible || isProcessing) && styles.buttonDisabled,
              ]}
              onPress={handleTakeover}
              disabled={!eligible || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <UniversalIcon name="hand-right" size={20} color="white" />
                  <Text style={styles.takeoverButtonText}>Take Over</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fbcfe8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  choreInfo: {
    marginBottom: 24,
  },
  choreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  choreDetails: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 4,
  },
  choreDescription: {
    fontSize: 14,
    color: '#831843',
    marginTop: 8,
    fontStyle: 'italic',
  },
  rewardsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardItem: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginTop: 8,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
  },
  bonusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  reasonsContainer: {
    marginBottom: 24,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#fdf2f8',
    borderColor: '#be185d',
  },
  reasonText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#9f1239',
  },
  reasonTextSelected: {
    color: '#be185d',
    fontWeight: '600',
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    marginBottom: 16,
  },
  errorNotice: {
    backgroundColor: '#fee2e2',
  },
  noticeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  errorText: {
    color: '#991b1b',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#fdf2f8',
  },
  cancelButtonText: {
    color: '#be185d',
    fontSize: 16,
    fontWeight: '600',
  },
  takeoverButton: {
    backgroundColor: '#be185d',
  },
  takeoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});