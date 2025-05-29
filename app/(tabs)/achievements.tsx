import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useAuth, useFamily } from '@/hooks/useZustandHooks';
import { XPProgressBar } from '@/components/ui/XPProgressBar';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { 
  calculateLevel, 
  getAllAchievements, 
  getAchievementProgress 
} from '@/services/gamification';
import { Achievement } from '@/types';

type AchievementCategory = 'all' | 'chores' | 'levels' | 'points' | 'streaks' | 'special' | 'teamwork';

interface AchievementCardProps {
  achievement: Achievement;
  isEarned: boolean;
  progress: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, isEarned, progress }) => {
  return (
    <View style={[styles.achievementCard, isEarned && styles.achievementCardEarned]}>
      <View style={styles.achievementHeader}>
        <View style={styles.achievementIcon}>
          <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
          {isEarned && (
            <View style={styles.earnedBadge}>
              <Text style={styles.earnedCheck}>✓</Text>
            </View>
          )}
        </View>
        
        {!isEarned && (
          <View style={styles.progressMeter}>
            <CircularProgress
              size={50}
              strokeWidth={4}
              progress={progress}
              showPercentage={true}
              colors={{
                background: '#f9a8d4',
                progress: ['#ef4444', '#f59e0b', '#10b981']
              }}
            />
          </View>
        )}
      </View>
      
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementName, isEarned && styles.achievementNameEarned]}>
          {achievement.name}
        </Text>
        <Text style={[styles.achievementDescription, isEarned && styles.achievementDescriptionEarned]}>
          {achievement.description}
        </Text>
        
        <View style={styles.xpReward}>
          <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
        </View>
      </View>
    </View>
  );
};

export default function AchievementsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');

  // Get user's current level and XP data
  const userXP = user?.xp?.total || 0;
  const { level, title } = calculateLevel(userXP);
  const userAchievements = user?.achievements || [];
  
  // Calculate user stats for achievement progress
  const userStats = useMemo(() => {
    const familyMember = family?.members?.find(m => m.uid === user?.uid);
    return {
      choreCompletions: familyMember?.level || 0, // Approximation based on level
      streakCurrent: familyMember?.streak?.current || 0,
      pointsLifetime: familyMember?.points?.lifetime || 0,
      level: familyMember?.level || level
    };
  }, [family, user, level]);

  // Get all achievements with progress
  const achievementProgress = useMemo(() => {
    return getAchievementProgress(
      userStats, 
      userAchievements,
      user?.streaks // Enhanced streaks data
    );
  }, [userStats, userAchievements, user?.streaks]);

  // Categorize achievements
  const categorizedAchievements = useMemo(() => {
    const categories = {
      chores: [] as typeof achievementProgress,
      levels: [] as typeof achievementProgress,
      points: [] as typeof achievementProgress,
      streaks: [] as typeof achievementProgress,
      special: [] as typeof achievementProgress,
      teamwork: [] as typeof achievementProgress,
    };

    achievementProgress.forEach(item => {
      const { achievement } = item;
      
      // Categorize based on criteria type and achievement name
      if (
        achievement.criteria.type === 'chores_completed' ||
        achievement.name.toLowerCase().includes('chore') ||
        achievement.name.toLowerCase().includes('worker')
      ) {
        categories.chores.push(item);
      } else if (
        achievement.criteria.type === 'level_reached' ||
        achievement.name.toLowerCase().includes('level') ||
        achievement.name.toLowerCase().includes('star') ||
        achievement.name.toLowerCase().includes('hero')
      ) {
        categories.levels.push(item);
      } else if (
        achievement.criteria.type === 'points_earned' ||
        achievement.name.toLowerCase().includes('point') ||
        achievement.name.toLowerCase().includes('score')
      ) {
        categories.points.push(item);
      } else if (
        achievement.criteria.type.includes('streak') ||
        achievement.name.toLowerCase().includes('streak') ||
        achievement.name.toLowerCase().includes('consistency') ||
        achievement.name.toLowerCase().includes('warrior') ||
        achievement.name.toLowerCase().includes('champion')
      ) {
        categories.streaks.push(item);
      } else if (
        achievement.name.toLowerCase().includes('early') ||
        achievement.name.toLowerCase().includes('morning') ||
        achievement.name.toLowerCase().includes('dawn') ||
        achievement.name.toLowerCase().includes('perfect') ||
        achievement.name.toLowerCase().includes('specialist')
      ) {
        categories.special.push(item);
      } else {
        // Default to special for any uncategorized
        categories.special.push(item);
      }
    });

    return categories;
  }, [achievementProgress]);

  // Filter achievements based on selected category
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return achievementProgress;
    }
    return categorizedAchievements[selectedCategory] || [];
  }, [selectedCategory, achievementProgress, categorizedAchievements]);

  const totalAchievements = getAllAchievements().length;
  const earnedCount = userAchievements.length;

  const categories = [
    { key: 'all' as const, label: 'All', count: totalAchievements },
    { key: 'chores' as const, label: 'Chores', count: categorizedAchievements.chores.length },
    { key: 'levels' as const, label: 'Levels', count: categorizedAchievements.levels.length },
    { key: 'points' as const, label: 'Points', count: categorizedAchievements.points.length },
    { key: 'streaks' as const, label: 'Streaks', count: categorizedAchievements.streaks.length },
    { key: 'special' as const, label: 'Special', count: categorizedAchievements.special.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Achievements</Text>
        </View>
        
        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileLevel}>{title}</Text>
            <Text style={styles.profileSubtitle}>Level {level}</Text>
            
            <View style={styles.xpProgressContainer}>
              <XPProgressBar 
                currentXP={userXP} 
                showLevel={false} 
                size="medium" 
                style={styles.xpProgress}
              />
            </View>
            
            <Text style={styles.achievementStats}>
              {earnedCount} / {totalAchievements} Achievements Unlocked
            </Text>
            
            <View style={styles.completionBar}>
              <View style={styles.completionProgress}>
                <View style={[styles.completionFill, { width: `${(earnedCount / totalAchievements) * 100}%` }]} />
              </View>
              <Text style={styles.completionText}>
                {Math.round((earnedCount / totalAchievements) * 100)}% Complete
              </Text>
            </View>
          </View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.key && styles.categoryButtonTextActive
                ]}>
                  {category.label}
                </Text>
                <Text style={[
                  styles.categoryCount,
                  selectedCategory === category.key && styles.categoryCountActive
                ]}>
                  {category.count}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Achievements Grid */}
          <View style={styles.achievementsGrid}>
            {filteredAchievements.map(({ achievement, progress, isCompleted }) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isEarned={isCompleted}
                progress={progress}
              />
            ))}
          </View>

          {filteredAchievements.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No achievements in this category</Text>
              <Text style={styles.emptySubtitle}>Try selecting a different category</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with 20px margin + 20px gap
const cardHeight = cardWidth * 1.2; // Make cards more square with slight height

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
  },
  content: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#be185d',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#f9a8d4',
    marginBottom: 12,
  },
  xpProgressContainer: {
    width: '100%',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  xpProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  achievementStats: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  completionBar: {
    width: '100%',
    alignItems: 'center',
  },
  completionProgress: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 0,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#be185d',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  categoryCount: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 2,
  },
  categoryCountActive: {
    color: '#f9a8d4',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  achievementCard: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    opacity: 0.7,
  },
  achievementCardEarned: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIcon: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  progressMeter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementEmoji: {
    fontSize: 28,
  },
  earnedBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#10b981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  achievementNameEarned: {
    color: '#10b981',
  },
  achievementDescription: {
    fontSize: 11,
    color: '#9f1239',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    flex: 1,
  },
  achievementDescriptionEarned: {
    color: '#059669',
  },
  xpReward: {
    alignItems: 'center',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#be185d',
    backgroundColor: '#fbcfe8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9f1239',
    textAlign: 'center',
  },
});