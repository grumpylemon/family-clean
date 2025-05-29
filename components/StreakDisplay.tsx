import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedStreak, StreakCategory, StreakMilestone } from '@/types';
import { getStreakMilestones, calculateCompoundStreakMultiplier, countActiveStreaks } from '@/services/gamification';

interface StreakDisplayProps {
  streaks: EnhancedStreak;
  showDetailed?: boolean;
  onStreakPress?: (streakType: string) => void;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streaks, showDetailed = false, onStreakPress }) => {
  const [showModal, setShowModal] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animation for fire effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const overallStreak = streaks.overall.current;
  const compoundMultiplier = calculateCompoundStreakMultiplier(streaks);
  const activeStreaks = countActiveStreaks(streaks);
  const milestones = getStreakMilestones();

  // Get next milestone
  const nextMilestone = milestones.find(m => m.days > overallStreak);
  const currentMilestone = milestones.filter(m => m.days <= overallStreak).pop();

  // Animation styles for fire effect
  const getFireEmoji = () => {
    if (overallStreak === 0) return '💭';
    if (overallStreak < 3) return '🔥';
    if (overallStreak < 7) return animationPhase === 0 ? '🔥' : '🔥';
    if (overallStreak < 30) return animationPhase === 0 ? '🔥🔥' : animationPhase === 1 ? '🔥🔥🔥' : '🔥🔥';
    return animationPhase === 0 ? '🔥🔥🔥' : animationPhase === 1 ? '🚀🔥🔥🔥' : '🔥🔥🔥🚀';
  };

  const getStreakColor = () => {
    if (overallStreak === 0) return '#9ca3af';
    if (overallStreak < 3) return '#f59e0b';
    if (overallStreak < 7) return '#ef4444';
    if (overallStreak < 30) return '#8b5cf6';
    return '#be185d';
  };

  const renderCompactView = () => (
    <TouchableOpacity 
      style={[styles.compactContainer, { borderColor: getStreakColor() }]}
      onPress={() => onStreakPress?.('overall') || setShowModal(true)}
    >
      <View style={styles.streakRow}>
        <Text style={styles.fireEmoji}>{getFireEmoji()}</Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakNumber, { color: getStreakColor() }]}>
            {overallStreak}
          </Text>
          <Text style={styles.streakLabel}>day streak</Text>
          {compoundMultiplier > 1 && (
            <Text style={styles.multiplier}>
              {compoundMultiplier.toFixed(1)}x bonus
            </Text>
          )}
        </View>
        {activeStreaks > 1 && (
          <View style={styles.activeStreaksBadge}>
            <Text style={styles.activeStreaksText}>{activeStreaks}</Text>
          </View>
        )}
      </View>
      
      {nextMilestone && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(overallStreak / nextMilestone.days) * 100}%`,
                  backgroundColor: getStreakColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {overallStreak}/{nextMilestone.days} to {nextMilestone.title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDetailedView = () => (
    <View style={styles.detailedContainer}>
      {/* Overall Streak Header */}
      <View style={styles.headerSection}>
        <Text style={styles.fireEmoji}>{getFireEmoji()}</Text>
        <View style={styles.headerInfo}>
          <Text style={[styles.streakNumber, { color: getStreakColor() }]}>
            {overallStreak} Day Streak
          </Text>
          {currentMilestone && (
            <Text style={styles.milestoneTitle}>
              🏆 {currentMilestone.title}
            </Text>
          )}
          <Text style={styles.multiplierText}>
            {compoundMultiplier.toFixed(1)}x Total Multiplier
          </Text>
        </View>
      </View>

      {/* Progress to Next Milestone */}
      {nextMilestone && (
        <View style={styles.milestoneSection}>
          <Text style={styles.sectionTitle}>Next Milestone</Text>
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneTarget}>
              {nextMilestone.title} ({nextMilestone.days} days)
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(overallStreak / nextMilestone.days) * 100}%`,
                      backgroundColor: getStreakColor()
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {overallStreak}/{nextMilestone.days} 
                ({Math.max(0, nextMilestone.days - overallStreak)} days to go)
              </Text>
            </View>
            <Text style={styles.milestoneReward}>
              Reward: {nextMilestone.bonusPoints} points + {nextMilestone.bonusXP} XP
            </Text>
          </View>
        </View>
      )}

      {/* Category Streaks */}
      {Object.keys(streaks.categories).length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Category Streaks</Text>
          <View style={styles.categoryGrid}>
            {Object.entries(streaks.categories).map(([category, streakData]) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryCard}
                onPress={() => onStreakPress?.(category)}
              >
                <Text style={styles.categoryEmoji}>
                  {getCategoryEmoji(category as StreakCategory)}
                </Text>
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.categoryStreak}>
                  {streakData?.current || 0} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Special Streaks */}
      <View style={styles.specialSection}>
        <Text style={styles.sectionTitle}>Special Streaks</Text>
        <View style={styles.specialGrid}>
          <View style={styles.specialCard}>
            <Text style={styles.specialEmoji}>✨</Text>
            <Text style={styles.specialName}>Perfect Days</Text>
            <Text style={styles.specialStreak}>
              {streaks.perfectDay.current} days
            </Text>
          </View>
          <View style={styles.specialCard}>
            <Text style={styles.specialEmoji}>🌅</Text>
            <Text style={styles.specialName}>Early Bird</Text>
            <Text style={styles.specialStreak}>
              {streaks.earlyBird.current} days
            </Text>
          </View>
        </View>
      </View>

      {/* Streak Statistics */}
      {streaks.analytics && (
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Streak Analytics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>
                {streaks.overall.longest}
              </Text>
              <Text style={styles.analyticsLabel}>Best Streak</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>
                {streaks.analytics.totalStreakDays || 0}
              </Text>
              <Text style={styles.analyticsLabel}>Total Days</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>
                {activeStreaks}
              </Text>
              <Text style={styles.analyticsLabel}>Active Streaks</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const getCategoryEmoji = (category: StreakCategory): string => {
    switch (category) {
      case 'kitchen': return '🍳';
      case 'bathroom': return '🚿';
      case 'bedroom': return '🛏️';
      case 'outdoor': return '🌱';
      case 'pet': return '🐕';
      case 'general': return '🏠';
      default: return '📋';
    }
  };

  if (showDetailed) {
    return renderDetailedView();
  }

  return (
    <>
      {renderCompactView()}
      
      {/* Detailed Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Streak Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          {renderDetailedView()}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginVertical: 8,
    borderWidth: 2,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  fireEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  
  streakInfo: {
    flex: 1,
  },
  
  streakNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  
  streakLabel: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
  },
  
  multiplier: {
    fontSize: 12,
    color: '#be185d',
    fontWeight: '600',
    marginTop: 2,
  },
  
  activeStreaksBadge: {
    backgroundColor: '#be185d',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  
  activeStreaksText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  progressContainer: {
    marginTop: 8,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: '#f9a8d4',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  progressText: {
    fontSize: 12,
    color: '#831843',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Detailed View Styles
  detailedContainer: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    padding: 20,
  },
  
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  
  milestoneTitle: {
    fontSize: 16,
    color: '#be185d',
    fontWeight: '600',
    marginTop: 4,
  },
  
  multiplierText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
    marginTop: 4,
  },
  
  milestoneSection: {
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  
  milestoneCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  milestoneTarget: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 12,
  },
  
  milestoneReward: {
    fontSize: 14,
    color: '#be185d',
    fontWeight: '600',
    marginTop: 8,
  },
  
  categorySection: {
    marginBottom: 20,
  },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  
  categoryStreak: {
    fontSize: 16,
    fontWeight: '700',
    color: '#be185d',
  },
  
  specialSection: {
    marginBottom: 20,
  },
  
  specialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  specialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  
  specialEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  
  specialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  
  specialStreak: {
    fontSize: 16,
    fontWeight: '700',
    color: '#be185d',
  },
  
  analyticsSection: {
    marginBottom: 20,
  },
  
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  analyticsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 4,
  },
  
  analyticsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#831843',
    textAlign: 'center',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  
  closeButton: {
    padding: 8,
  },
});

export default StreakDisplay;