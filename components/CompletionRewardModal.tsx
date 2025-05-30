import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompletionReward } from '../types';

interface CompletionRewardModalProps {
  visible: boolean;
  reward: CompletionReward | null;
  choreTitle: string;
  onClose: () => void;
}

export const CompletionRewardModal: React.FC<CompletionRewardModalProps> = ({
  visible,
  reward,
  choreTitle,
  onClose,
}) => {
  if (!reward) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.celebrationText}>🎉</Text>
            <Text style={styles.title}>Chore Complete!</Text>
            <Text style={styles.choreTitle}>{choreTitle}</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Points Earned */}
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Ionicons name="star" size={24} color="#f59e0b" />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardLabel}>Points Earned</Text>
                <Text style={styles.rewardValue}>+{reward.pointsEarned}</Text>
              </View>
            </View>

            {/* XP Earned */}
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Ionicons name="flash" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardLabel}>XP Gained</Text>
                <Text style={styles.rewardValue}>+{reward.xpEarned}</Text>
              </View>
            </View>

            {/* Streak Bonus */}
            {reward.streakBonus && reward.streakBonus > 1 && (
              <View style={styles.rewardItem}>
                <View style={styles.rewardIcon}>
                  <Ionicons name="flame" size={24} color="#ef4444" />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Streak Bonus</Text>
                  <Text style={styles.rewardValue}>×{reward.streakBonus.toFixed(1)}</Text>
                </View>
              </View>
            )}

            {/* Level Up */}
            {reward.levelUp && (
              <View style={[styles.rewardItem, styles.levelUpItem]}>
                <View style={styles.rewardIcon}>
                  <Ionicons name="trending-up" size={24} color="#10b981" />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>Level Up!</Text>
                  <Text style={styles.levelUpText}>
                    Level {reward.levelUp.newLevel}: {reward.levelUp.title}
                  </Text>
                </View>
              </View>
            )}

            {/* Achievements */}
            {reward.achievementsUnlocked && reward.achievementsUnlocked.length > 0 && (
              <View style={styles.achievementsSection}>
                <View style={styles.achievementsHeader}>
                  <Text style={styles.achievementsTitle}>🏆 Achievements Unlocked!</Text>
                  <Text style={styles.achievementsSubtitle}>
                    {reward.achievementsUnlocked.length} new achievement{reward.achievementsUnlocked.length > 1 ? 's' : ''}!
                  </Text>
                </View>
                {reward.achievementsUnlocked.map((achievement, index) => (
                  <View key={achievement.id} style={[styles.achievementItem, styles.newAchievementItem]}>
                    <View style={styles.achievementIconContainer}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <View style={styles.achievementBadge}>
                        <Text style={styles.achievementBadgeText}>NEW</Text>
                      </View>
                    </View>
                    <View style={styles.achievementContent}>
                      <Text style={styles.achievementName}>{achievement.name}</Text>
                      <Text style={styles.achievementDescription}>{achievement.description}</Text>
                      <View style={styles.achievementReward}>
                        <Text style={styles.achievementXP}>+{achievement.xpReward} XP</Text>
                      </View>
                    </View>
                  </View>
                ))}
                <View style={styles.achievementsCelebration}>
                  <Text style={styles.celebrationEmojis}>✨ 🎉 ⭐ 🏆 ⭐ 🎉 ✨</Text>
                  <Text style={styles.celebrationMessage}>Keep up the amazing work!</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fdf2f8',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationText: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#831843',
    marginBottom: 4,
  },
  choreTitle: {
    fontSize: 16,
    color: '#be185d',
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    maxHeight: 300,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelUpItem: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rewardContent: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#831843',
  },
  levelUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  achievementsSection: {
    marginTop: 8,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
    textAlign: 'center',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef7ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#be185d',
    marginBottom: 4,
  },
  achievementXP: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  // Enhanced achievement styles
  achievementsHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  achievementsSubtitle: {
    fontSize: 14,
    color: '#be185d',
    fontWeight: '500',
    marginTop: 4,
  },
  newAchievementItem: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  achievementIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  achievementBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  achievementBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  achievementReward: {
    marginTop: 4,
  },
  achievementsCelebration: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
  },
  celebrationEmojis: {
    fontSize: 16,
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#be185d',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});