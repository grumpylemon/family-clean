import { Achievement, LevelConfig, User, FamilyMember, CompletionReward, UserAchievement, Badge } from '@/types';
import { createOrUpdateUserProfile, getUserProfile } from './firestore';

// Level configuration system
const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, xpRequired: 0, title: 'Novice Helper' },
  { level: 2, xpRequired: 100, title: 'Eager Assistant' },
  { level: 3, xpRequired: 250, title: 'Reliable Helper' },
  { level: 4, xpRequired: 500, title: 'Dedicated Worker' },
  { level: 5, xpRequired: 850, title: 'Expert Helper' },
  { level: 6, xpRequired: 1300, title: 'Master Organizer' },
  { level: 7, xpRequired: 1850, title: 'Chore Champion' },
  { level: 8, xpRequired: 2500, title: 'Household Hero' },
  { level: 9, xpRequired: 3250, title: 'Cleaning Legend' },
  { level: 10, xpRequired: 4100, title: 'Ultimate Family Helper' },
];

// Pre-defined achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_chore',
    name: 'Getting Started',
    description: 'Complete your first chore',
    icon: '🎯',
    xpReward: 25,
    criteria: { type: 'chores_completed', value: 1 }
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Complete chores for 3 days in a row',
    icon: '🔥',
    xpReward: 50,
    criteria: { type: 'streak_days', value: 3 }
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete chores for 7 days in a row',
    icon: '⚡',
    xpReward: 100,
    criteria: { type: 'streak_days', value: 7 }
  },
  {
    id: 'streak_30',
    name: 'Consistency King',
    description: 'Complete chores for 30 days in a row',
    icon: '👑',
    xpReward: 500,
    criteria: { type: 'streak_days', value: 30 }
  },
  {
    id: 'chores_10',
    name: 'Hard Worker',
    description: 'Complete 10 chores',
    icon: '💪',
    xpReward: 75,
    criteria: { type: 'chores_completed', value: 10 }
  },
  {
    id: 'chores_50',
    name: 'Productivity Pro',
    description: 'Complete 50 chores',
    icon: '🚀',
    xpReward: 200,
    criteria: { type: 'chores_completed', value: 50 }
  },
  {
    id: 'chores_100',
    name: 'Century Club',
    description: 'Complete 100 chores',
    icon: '🏆',
    xpReward: 500,
    criteria: { type: 'chores_completed', value: 100 }
  },
  {
    id: 'points_1000',
    name: 'Point Collector',
    description: 'Earn 1000 lifetime points',
    icon: '💎',
    xpReward: 150,
    criteria: { type: 'points_earned', value: 1000 }
  },
  {
    id: 'points_5000',
    name: 'Score Master',
    description: 'Earn 5000 lifetime points',
    icon: '🌟',
    xpReward: 300,
    criteria: { type: 'points_earned', value: 5000 }
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
    xpReward: 100,
    criteria: { type: 'level_reached', value: 5 }
  },
  {
    id: 'level_10',
    name: 'Max Level Hero',
    description: 'Reach the maximum level',
    icon: '🎊',
    xpReward: 1000,
    criteria: { type: 'level_reached', value: 10 }
  }
];

/**
 * Calculate XP based on chore difficulty
 */
export const calculateXP = (difficulty: 'easy' | 'medium' | 'hard', basePoints: number): number => {
  const xpMultipliers = {
    easy: 0.5,
    medium: 1.0,
    hard: 1.5
  };
  
  // Base XP is 50% of points, modified by difficulty
  return Math.round(basePoints * 0.5 * xpMultipliers[difficulty]);
};

/**
 * Calculate user level based on total XP
 */
export const calculateLevel = (totalXP: number): { level: number; xpToNext: number; title: string } => {
  let currentLevel = 1;
  let xpToNext = LEVEL_CONFIGS[1].xpRequired;
  
  for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_CONFIGS[i].xpRequired) {
      currentLevel = LEVEL_CONFIGS[i].level;
      
      // Calculate XP to next level
      if (i < LEVEL_CONFIGS.length - 1) {
        xpToNext = LEVEL_CONFIGS[i + 1].xpRequired - totalXP;
      } else {
        xpToNext = 0; // Max level reached
      }
      break;
    }
  }
  
  const levelConfig = LEVEL_CONFIGS.find(config => config.level === currentLevel);
  return {
    level: currentLevel,
    xpToNext,
    title: levelConfig?.title || 'Helper'
  };
};

/**
 * Calculate streak bonus multiplier
 */
export const calculateStreakBonus = (streakDays: number): number => {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
};

/**
 * Check for achievements based on user stats
 */
export const checkAchievements = (
  userStats: {
    choreCompletions: number;
    streakCurrent: number;
    pointsLifetime: number;
    level: number;
  },
  existingAchievements: string[] = []
): Achievement[] => {
  const newAchievements: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    // Skip if already earned
    if (existingAchievements.includes(achievement.id)) continue;
    
    let earned = false;
    
    switch (achievement.criteria.type) {
      case 'chores_completed':
        earned = userStats.choreCompletions >= achievement.criteria.value;
        break;
      case 'streak_days':
        earned = userStats.streakCurrent >= achievement.criteria.value;
        break;
      case 'points_earned':
        earned = userStats.pointsLifetime >= achievement.criteria.value;
        break;
      case 'level_reached':
        earned = userStats.level >= achievement.criteria.value;
        break;
    }
    
    if (earned) {
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
};

/**
 * Process chore completion and calculate all rewards
 */
export const processChoreCompletion = async (
  userId: string,
  chorePoints: number,
  choreDifficulty: 'easy' | 'medium' | 'hard',
  choreCompletionCount?: number
): Promise<CompletionReward> => {
  try {
    // Get current user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    // Calculate base rewards
    const baseXP = calculateXP(choreDifficulty, chorePoints);
    const streakDays = userProfile.streak?.current || 0;
    const streakBonus = calculateStreakBonus(streakDays);
    
    // Apply streak bonus to points and XP
    const finalPoints = Math.round(chorePoints * streakBonus);
    const finalXP = Math.round(baseXP * streakBonus);
    
    // Calculate new totals
    const newTotalXP = (userProfile.xp?.total || 0) + finalXP;
    const newLifetimePoints = (userProfile.points?.lifetime || 0) + finalPoints;
    
    // Calculate level progression
    const oldLevel = userProfile.level || 1;
    const { level: newLevel, xpToNext, title } = calculateLevel(newTotalXP);
    
    // Check for achievements
    const userStats = {
      choreCompletions: (choreCompletionCount || 0) + 1,
      streakCurrent: streakDays,
      pointsLifetime: newLifetimePoints,
      level: newLevel
    };
    
    const newAchievements = checkAchievements(userStats, userProfile.achievements);
    
    // Calculate total XP from achievements
    const achievementXP = newAchievements.reduce((total, achievement) => total + achievement.xpReward, 0);
    
    // Update final XP total with achievement bonuses
    const finalTotalXP = newTotalXP + achievementXP;
    const finalLevelInfo = calculateLevel(finalTotalXP);
    
    // Build completion reward
    const reward: CompletionReward = {
      pointsEarned: finalPoints,
      xpEarned: finalXP + achievementXP,
      streakBonus: streakBonus > 1 ? streakBonus : undefined,
      achievementsUnlocked: newAchievements,
      levelUp: newLevel > oldLevel ? {
        newLevel: finalLevelInfo.level,
        title: finalLevelInfo.title
      } : undefined
    };
    
    return reward;
  } catch (error) {
    console.error('Error processing chore completion:', error);
    // Return basic reward on error
    return {
      pointsEarned: chorePoints,
      xpEarned: calculateXP(choreDifficulty, chorePoints)
    };
  }
};

/**
 * Update user profile with completion rewards
 */
export const applyCompletionRewards = async (
  userId: string,
  reward: CompletionReward,
  currentStreak: number
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) return false;
    
    // Calculate new XP structure
    const newTotalXP = (userProfile.xp?.total || 0) + reward.xpEarned;
    const { level, xpToNext } = calculateLevel(newTotalXP);
    
    // Update user profile with all rewards
    const updates: Partial<User> = {
      points: {
        current: (userProfile.points?.current || 0) + reward.pointsEarned,
        lifetime: (userProfile.points?.lifetime || 0) + reward.pointsEarned,
        weekly: (userProfile.points?.weekly || 0) + reward.pointsEarned
      },
      xp: {
        current: xpToNext > 0 ? newTotalXP - LEVEL_CONFIGS.find(c => c.level === level)!.xpRequired : 0,
        toNextLevel: xpToNext,
        total: newTotalXP
      },
      level,
      achievements: [
        ...(userProfile.achievements || []),
        ...(reward.achievementsUnlocked?.map(a => a.id) || [])
      ],
      updatedAt: new Date()
    };
    
    return await createOrUpdateUserProfile(userId, updates);
  } catch (error) {
    console.error('Error applying completion rewards:', error);
    return false;
  }
};

/**
 * Get all available achievements
 */
export const getAllAchievements = (): Achievement[] => {
  return ACHIEVEMENTS;
};

/**
 * Get level configuration
 */
export const getLevelConfig = (level: number): LevelConfig | undefined => {
  return LEVEL_CONFIGS.find(config => config.level === level);
};

/**
 * Get user progress towards next achievement
 */
export const getAchievementProgress = (
  userStats: {
    choreCompletions: number;
    streakCurrent: number;
    pointsLifetime: number;
    level: number;
  },
  existingAchievements: string[] = []
): Array<{ achievement: Achievement; progress: number; isCompleted: boolean }> => {
  return ACHIEVEMENTS.map(achievement => {
    const isCompleted = existingAchievements.includes(achievement.id);
    let progress = 0;
    
    if (!isCompleted) {
      switch (achievement.criteria.type) {
        case 'chores_completed':
          progress = Math.min(userStats.choreCompletions / achievement.criteria.value, 1);
          break;
        case 'streak_days':
          progress = Math.min(userStats.streakCurrent / achievement.criteria.value, 1);
          break;
        case 'points_earned':
          progress = Math.min(userStats.pointsLifetime / achievement.criteria.value, 1);
          break;
        case 'level_reached':
          progress = Math.min(userStats.level / achievement.criteria.value, 1);
          break;
      }
    } else {
      progress = 1;
    }
    
    return {
      achievement,
      progress,
      isCompleted
    };
  });
};