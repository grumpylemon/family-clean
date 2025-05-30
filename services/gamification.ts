import { 
  Achievement, LevelConfig, User, FamilyMember, CompletionReward, UserAchievement, Badge,
  StreakType, StreakCategory, StreakData, EnhancedStreak, StreakMultiplier, StreakBonus, StreakMilestone,
  Chore, ChoreType, ChoreDifficulty
} from '../types';

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
  },
  {
    id: 'helper_hero',
    name: 'Helper Hero',
    description: 'Take over 10 chores from family members',
    icon: '🦸',
    xpReward: 150,
    criteria: { type: 'chores_taken_over', value: 10 }
  }
];

// Enhanced Streak System Configuration
const STREAK_MULTIPLIERS: StreakMultiplier[] = [
  // Overall streak multipliers (enhanced)
  { type: 'overall', days: 3, multiplier: 1.1 },
  { type: 'overall', days: 7, multiplier: 1.25 },
  { type: 'overall', days: 14, multiplier: 1.5 },
  { type: 'overall', days: 30, multiplier: 2.0 },
  { type: 'overall', days: 60, multiplier: 2.5 },
  { type: 'overall', days: 100, multiplier: 3.0 },
  
  // Category-specific streaks
  { type: 'category', days: 5, multiplier: 1.15, category: 'kitchen' },
  { type: 'category', days: 10, multiplier: 1.3, category: 'kitchen' },
  { type: 'category', days: 5, multiplier: 1.2, category: 'outdoor' },
  { type: 'category', days: 10, multiplier: 1.4, category: 'outdoor' },
  { type: 'category', days: 5, multiplier: 1.1, category: 'pet' },
  { type: 'category', days: 10, multiplier: 1.25, category: 'pet' },
  
  // Perfect day streaks (all assigned chores completed)
  { type: 'perfect_day', days: 3, multiplier: 1.3 },
  { type: 'perfect_day', days: 7, multiplier: 1.6 },
  { type: 'perfect_day', days: 14, multiplier: 2.0 },
  
  // Early bird streaks (completed before noon)
  { type: 'early_bird', days: 3, multiplier: 1.2 },
  { type: 'early_bird', days: 7, multiplier: 1.4 },
  { type: 'early_bird', days: 14, multiplier: 1.8 },
];

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: 'Momentum Builder', description: 'Complete chores for 3 days straight', bonusPoints: 20, bonusXP: 15 },
  { days: 7, title: 'Week Warrior', description: 'Maintain a 7-day streak', bonusPoints: 50, bonusXP: 40, badge: 'week_warrior' },
  { days: 14, title: 'Fortnight Champion', description: 'Two weeks of consistency', bonusPoints: 100, bonusXP: 75 },
  { days: 30, title: 'Monthly Master', description: 'Complete chores every day for a month', bonusPoints: 250, bonusXP: 200, badge: 'monthly_master' },
  { days: 60, title: 'Habit Hero', description: 'Two months of dedication', bonusPoints: 500, bonusXP: 400 },
  { days: 100, title: 'Century Achiever', description: 'Complete chores for 100 days straight', bonusPoints: 1000, bonusXP: 750, badge: 'century_achiever', isSpecial: true },
  { days: 365, title: 'Year-Long Legend', description: 'A full year of consistency', bonusPoints: 5000, bonusXP: 3000, badge: 'year_legend', isSpecial: true },
];

// Enhanced achievements for new streak types
const ENHANCED_ACHIEVEMENTS: Achievement[] = [
  ...ACHIEVEMENTS, // Include existing achievements
  
  // Category-specific streak achievements
  {
    id: 'kitchen_streak_7',
    name: 'Kitchen Specialist',
    description: 'Complete kitchen chores for 7 days in a row',
    icon: '🍳',
    xpReward: 75,
    criteria: { type: 'category_streak', value: 7, category: 'kitchen' }
  },
  {
    id: 'outdoor_streak_5',
    name: 'Nature Lover',
    description: 'Complete outdoor chores for 5 days in a row',
    icon: '🌱',
    xpReward: 60,
    criteria: { type: 'category_streak', value: 5, category: 'outdoor' }
  },
  {
    id: 'pet_streak_10',
    name: 'Pet Whisperer',
    description: 'Take care of pets for 10 days straight',
    icon: '🐕',
    xpReward: 100,
    criteria: { type: 'category_streak', value: 10, category: 'pet' }
  },
  
  // Perfect day achievements
  {
    id: 'perfect_day_3',
    name: 'Perfectionist',
    description: 'Complete all assigned chores for 3 perfect days',
    icon: '✨',
    xpReward: 100,
    criteria: { type: 'perfect_day_streak', value: 3 }
  },
  {
    id: 'perfect_day_7',
    name: 'Flawless Week',
    description: 'Complete all assigned chores for a perfect week',
    icon: '💫',
    xpReward: 250,
    criteria: { type: 'perfect_day_streak', value: 7 }
  },
  
  // Early bird achievements
  {
    id: 'early_bird_5',
    name: 'Morning Champion',
    description: 'Complete chores before noon for 5 days',
    icon: '🌅',
    xpReward: 80,
    criteria: { type: 'early_bird_streak', value: 5, timeRequirement: '12:00' }
  },
  {
    id: 'early_bird_14',
    name: 'Dawn Warrior',
    description: 'Complete chores before noon for 2 weeks',
    icon: '☀️',
    xpReward: 200,
    criteria: { type: 'early_bird_streak', value: 14, timeRequirement: '12:00' }
  },
  
  // Streak recovery and resilience
  {
    id: 'streak_recovery_3',
    name: 'Comeback Kid',
    description: 'Rebuild your streak 3 times after breaking it',
    icon: '🔄',
    xpReward: 150,
    criteria: { type: 'streak_recovery', value: 3 }
  },
  
  // Multiple streak management
  {
    id: 'multiple_streaks_3',
    name: 'Multi-Tasker',
    description: 'Maintain 3 different streak types simultaneously',
    icon: '🎯',
    xpReward: 200,
    criteria: { type: 'multiple_streaks', value: 3 }
  },
  
  // Major streak milestones
  {
    id: 'streak_milestone_100',
    name: 'Centurion',
    description: 'Achieve a 100-day streak milestone',
    icon: '🏛️',
    xpReward: 1000,
    criteria: { type: 'streak_milestone', value: 100 }
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
 * Calculate streak bonus multiplier (legacy - kept for backward compatibility)
 */
export const calculateStreakBonus = (streakDays: number): number => {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
};

// Enhanced Streak System Functions

/**
 * Get category for a chore based on its properties
 */
export const getChoreCategory = (chore: Chore): StreakCategory => {
  // Check room-based category first
  if (chore.roomType) {
    switch (chore.roomType) {
      case 'kitchen':
      case 'dining_room':
        return 'kitchen';
      case 'bathroom':
        return 'bathroom';
      case 'bedroom':
      case 'living_room':
      case 'study_room':
        return 'bedroom';
      case 'garage':
      case 'yard':
      case 'garden':
        return 'outdoor';
      default:
        return 'general';
    }
  }
  
  // Check chore type
  if (chore.type === 'pet') {
    return 'pet';
  }
  
  // Check category field or title for hints
  const category = chore.category?.toLowerCase() || chore.title.toLowerCase();
  if (category.includes('kitchen') || category.includes('cooking') || category.includes('dishes')) {
    return 'kitchen';
  }
  if (category.includes('bathroom') || category.includes('toilet') || category.includes('shower')) {
    return 'bathroom';
  }
  if (category.includes('outdoor') || category.includes('yard') || category.includes('garden')) {
    return 'outdoor';
  }
  if (category.includes('pet') || category.includes('dog') || category.includes('cat')) {
    return 'pet';
  }
  
  return 'general';
};

/**
 * Calculate enhanced streak multiplier for a specific streak type and days
 */
export const calculateEnhancedStreakMultiplier = (
  streakType: StreakType,
  days: number,
  category?: StreakCategory,
  roomId?: string
): number => {
  const applicableMultipliers = STREAK_MULTIPLIERS.filter(multiplier => {
    if (multiplier.type !== streakType) return false;
    if (multiplier.category && multiplier.category !== category) return false;
    if (multiplier.roomId && multiplier.roomId !== roomId) return false;
    return days >= multiplier.days;
  });
  
  // Return the highest applicable multiplier
  const bestMultiplier = applicableMultipliers.reduce((best, current) => {
    return current.multiplier > best.multiplier ? current : best;
  }, { multiplier: 1.0 });
  
  return bestMultiplier.multiplier;
};

/**
 * Calculate compound multiplier from multiple streak types
 */
export const calculateCompoundStreakMultiplier = (streaks: EnhancedStreak): number => {
  const multipliers: number[] = [];
  
  // Overall streak
  if (streaks.overall.current > 0) {
    multipliers.push(calculateEnhancedStreakMultiplier('overall', streaks.overall.current));
  }
  
  // Category streaks
  Object.entries(streaks.categories).forEach(([category, streakData]) => {
    if (streakData && streakData.current > 0) {
      multipliers.push(calculateEnhancedStreakMultiplier('category', streakData.current, category as StreakCategory));
    }
  });
  
  // Perfect day streak
  if (streaks.perfectDay.current > 0) {
    multipliers.push(calculateEnhancedStreakMultiplier('perfect_day', streaks.perfectDay.current));
  }
  
  // Early bird streak
  if (streaks.earlyBird.current > 0) {
    multipliers.push(calculateEnhancedStreakMultiplier('early_bird', streaks.earlyBird.current));
  }
  
  // Room streaks
  Object.entries(streaks.rooms).forEach(([roomId, streakData]) => {
    if (streakData.current > 0) {
      multipliers.push(calculateEnhancedStreakMultiplier('room', streakData.current, undefined, roomId));
    }
  });
  
  // Apply compound multiplier logic
  if (multipliers.length === 0) return 1.0;
  if (multipliers.length === 1) return multipliers[0];
  
  // For multiple streaks, average the multipliers and add a bonus for maintaining multiple streaks
  const averageMultiplier = multipliers.reduce((sum, mult) => sum + mult, 0) / multipliers.length;
  const multipleStreakBonus = Math.min(multipliers.length * 0.1, 0.5); // Up to 50% bonus for 5+ streaks
  
  return Math.min(averageMultiplier + multipleStreakBonus, 3.0); // Cap at 3.0x
};

/**
 * Initialize enhanced streak data for a new user
 */
export const initializeEnhancedStreak = (): EnhancedStreak => {
  return {
    overall: { current: 0, longest: 0 },
    categories: {},
    perfectDay: { current: 0, longest: 0 },
    earlyBird: { current: 0, longest: 0 },
    rooms: {},
    analytics: {
      totalStreakDays: 0,
      streakMilestones: []
    },
    milestones: {}
  };
};

/**
 * Update streak data based on chore completion
 */
export const updateEnhancedStreak = (
  currentStreaks: EnhancedStreak | undefined,
  chore: Chore,
  completionTime: Date,
  isAllChoresCompleted?: boolean
): EnhancedStreak => {
  const streaks = currentStreaks || initializeEnhancedStreak();
  const today = new Date(completionTime).toDateString();
  
  // Helper function to update individual streak data
  const updateStreakData = (streakData: StreakData, lastCompletedDate?: string): StreakData => {
    const yesterday = new Date(completionTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    // If no previous completion date, start new streak
    if (!lastCompletedDate) {
      return {
        current: 1,
        longest: Math.max(1, streakData.longest),
        lastCompletedDate: today
      };
    }
    
    // If completed today already, don't update
    if (lastCompletedDate === today) {
      return streakData;
    }
    
    // If completed yesterday, continue streak
    if (lastCompletedDate === yesterdayString) {
      const newCurrent = streakData.current + 1;
      return {
        current: newCurrent,
        longest: Math.max(newCurrent, streakData.longest),
        lastCompletedDate: today
      };
    }
    
    // Otherwise, reset streak
    return {
      current: 1,
      longest: Math.max(1, streakData.longest),
      lastCompletedDate: today
    };
  };
  
  // Update overall streak
  streaks.overall = updateStreakData(streaks.overall, streaks.overall.lastCompletedDate);
  
  // Update category streak
  const choreCategory = getChoreCategory(chore);
  if (!streaks.categories[choreCategory]) {
    streaks.categories[choreCategory] = { current: 0, longest: 0 };
  }
  streaks.categories[choreCategory] = updateStreakData(
    streaks.categories[choreCategory]!,
    streaks.categories[choreCategory]?.lastCompletedDate
  );
  
  // Update room streak if applicable
  if (chore.roomId) {
    if (!streaks.rooms[chore.roomId]) {
      streaks.rooms[chore.roomId] = { current: 0, longest: 0 };
    }
    streaks.rooms[chore.roomId] = updateStreakData(
      streaks.rooms[chore.roomId],
      streaks.rooms[chore.roomId].lastCompletedDate
    );
  }
  
  // Update perfect day streak if all chores completed
  if (isAllChoresCompleted) {
    streaks.perfectDay = updateStreakData(streaks.perfectDay, streaks.perfectDay.lastCompletedDate);
  }
  
  // Update early bird streak if completed before noon
  const completionHour = completionTime.getHours();
  if (completionHour < 12) {
    streaks.earlyBird = updateStreakData(streaks.earlyBird, streaks.earlyBird.lastCompletedDate);
  }
  
  // Update analytics
  if (!streaks.analytics) {
    streaks.analytics = { totalStreakDays: 0, streakMilestones: [] };
  }
  streaks.analytics.totalStreakDays = (streaks.analytics.totalStreakDays || 0) + 1;
  
  return streaks;
};

/**
 * Check for streak milestone achievements
 */
export const checkStreakMilestones = (streaks: EnhancedStreak): StreakMilestone[] => {
  const achievedMilestones: StreakMilestone[] = [];
  
  // Check overall streak milestones
  const currentStreak = streaks.overall.current;
  
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone.days) {
      // Check if milestone was already achieved
      const milestoneKey = milestone.days;
      if (!streaks.milestones?.[milestoneKey]?.achieved) {
        achievedMilestones.push(milestone);
        
        // Mark as achieved
        if (!streaks.milestones) streaks.milestones = {};
        streaks.milestones[milestoneKey] = {
          achieved: true,
          achievedAt: new Date(),
          bonusAwarded: milestone.bonusPoints + milestone.bonusXP
        };
      }
    }
  }
  
  return achievedMilestones;
};

/**
 * Check for achievements based on user stats (enhanced version)
 */
export const checkAchievements = (
  userStats: {
    choreCompletions: number;
    streakCurrent: number;
    pointsLifetime: number;
    level: number;
  },
  existingAchievements: string[] = [],
  enhancedStreaks?: EnhancedStreak
): Achievement[] => {
  const newAchievements: Achievement[] = [];
  
  for (const achievement of ENHANCED_ACHIEVEMENTS) {
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
      
      // Enhanced streak achievements
      case 'category_streak':
        if (enhancedStreaks && achievement.criteria.category) {
          const categoryStreak = enhancedStreaks.categories[achievement.criteria.category];
          earned = (categoryStreak?.current || 0) >= achievement.criteria.value;
        }
        break;
      case 'perfect_day_streak':
        if (enhancedStreaks) {
          earned = enhancedStreaks.perfectDay.current >= achievement.criteria.value;
        }
        break;
      case 'early_bird_streak':
        if (enhancedStreaks) {
          earned = enhancedStreaks.earlyBird.current >= achievement.criteria.value;
        }
        break;
      case 'room_streak':
        if (enhancedStreaks && achievement.criteria.roomId) {
          const roomStreak = enhancedStreaks.rooms[achievement.criteria.roomId];
          earned = (roomStreak?.current || 0) >= achievement.criteria.value;
        }
        break;
      case 'streak_recovery':
        // This would require tracking streak recovery count in analytics
        if (enhancedStreaks?.analytics) {
          // For now, use a simple heuristic based on total streak days vs longest streak
          const recoveryEstimate = Math.max(0, (enhancedStreaks.analytics.totalStreakDays || 0) - enhancedStreaks.overall.longest);
          earned = recoveryEstimate >= achievement.criteria.value * 7; // Assume 7 days per recovery
        }
        break;
      case 'multiple_streaks':
        if (enhancedStreaks) {
          const activeStreaks = countActiveStreaks(enhancedStreaks);
          earned = activeStreaks >= achievement.criteria.value;
        }
        break;
      case 'streak_milestone':
        if (enhancedStreaks?.milestones) {
          earned = !!enhancedStreaks.milestones[achievement.criteria.value]?.achieved;
        }
        break;
    }
    
    if (earned) {
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
};

/**
 * Count active streaks (streaks with current > 0)
 */
export const countActiveStreaks = (streaks: EnhancedStreak): number => {
  let count = 0;
  
  // Overall streak
  if (streaks.overall.current > 0) count++;
  
  // Category streaks
  Object.values(streaks.categories).forEach(streakData => {
    if (streakData && streakData.current > 0) count++;
  });
  
  // Perfect day streak
  if (streaks.perfectDay.current > 0) count++;
  
  // Early bird streak
  if (streaks.earlyBird.current > 0) count++;
  
  // Room streaks
  Object.values(streaks.rooms).forEach(streakData => {
    if (streakData.current > 0) count++;
  });
  
  return count;
};

/**
 * Process chore completion and calculate all rewards
 */
export const processChoreCompletion = async (
  userId: string,
  chorePoints: number,
  choreDifficulty: 'easy' | 'medium' | 'hard',
  choreCompletionCount?: number,
  getUserProfileFn?: (userId: string) => Promise<User | null>,
  enhancedStreaks?: EnhancedStreak
): Promise<CompletionReward> => {
  try {
    // Get current user profile - use passed function to avoid circular dependency
    if (!getUserProfileFn) {
      throw new Error('getUserProfile function not provided');
    }
    const userProfile = await getUserProfileFn(userId);
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
    const { level: newLevel } = calculateLevel(newTotalXP);
    
    // Check for achievements (enhanced version with streaks data)
    const userStats = {
      choreCompletions: (choreCompletionCount || 0) + 1,
      streakCurrent: streakDays,
      pointsLifetime: newLifetimePoints,
      level: newLevel
    };
    
    // Use enhanced achievement checking with streaks data
    const newAchievements = checkAchievements(
      userStats, 
      userProfile.achievements, 
      enhancedStreaks || userProfile.streaks
    );
    
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
  _currentStreak: number,
  getUserProfileFn?: (userId: string) => Promise<User | null>,
  updateUserProfileFn?: (userId: string, updates: Partial<User>) => Promise<boolean>,
  enhancedStreaks?: EnhancedStreak
): Promise<boolean> => {
  try {
    if (!getUserProfileFn || !updateUserProfileFn) {
      throw new Error('Required functions not provided');
    }
    const userProfile = await getUserProfileFn(userId);
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
    
    return await updateUserProfileFn(userId, updates);
  } catch (error) {
    console.error('Error applying completion rewards:', error);
    return false;
  }
};

/**
 * Get all available achievements (enhanced version)
 */
export const getAllAchievements = (): Achievement[] => {
  return ENHANCED_ACHIEVEMENTS;
};

/**
 * Get streak milestones
 */
export const getStreakMilestones = (): StreakMilestone[] => {
  return STREAK_MILESTONES;
};

/**
 * Get level configuration
 */
export const getLevelConfig = (level: number): LevelConfig | undefined => {
  return LEVEL_CONFIGS.find(config => config.level === level);
};

/**
 * Get user progress towards next achievement (enhanced version)
 */
export const getAchievementProgress = (
  userStats: {
    choreCompletions: number;
    streakCurrent: number;
    pointsLifetime: number;
    level: number;
  },
  existingAchievements: string[] = [],
  enhancedStreaks?: EnhancedStreak
): Array<{ achievement: Achievement; progress: number; isCompleted: boolean }> => {
  return ENHANCED_ACHIEVEMENTS.map(achievement => {
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
        
        // Enhanced streak achievements
        case 'category_streak':
          if (enhancedStreaks && achievement.criteria.category) {
            const categoryStreak = enhancedStreaks.categories[achievement.criteria.category];
            progress = Math.min((categoryStreak?.current || 0) / achievement.criteria.value, 1);
          }
          break;
        case 'perfect_day_streak':
          if (enhancedStreaks) {
            progress = Math.min(enhancedStreaks.perfectDay.current / achievement.criteria.value, 1);
          }
          break;
        case 'early_bird_streak':
          if (enhancedStreaks) {
            progress = Math.min(enhancedStreaks.earlyBird.current / achievement.criteria.value, 1);
          }
          break;
        case 'room_streak':
          if (enhancedStreaks && achievement.criteria.roomId) {
            const roomStreak = enhancedStreaks.rooms[achievement.criteria.roomId];
            progress = Math.min((roomStreak?.current || 0) / achievement.criteria.value, 1);
          }
          break;
        case 'streak_recovery':
          if (enhancedStreaks?.analytics) {
            const recoveryEstimate = Math.max(0, (enhancedStreaks.analytics.totalStreakDays || 0) - enhancedStreaks.overall.longest);
            progress = Math.min(recoveryEstimate / (achievement.criteria.value * 7), 1);
          }
          break;
        case 'multiple_streaks':
          if (enhancedStreaks) {
            const activeStreaks = countActiveStreaks(enhancedStreaks);
            progress = Math.min(activeStreaks / achievement.criteria.value, 1);
          }
          break;
        case 'streak_milestone':
          if (enhancedStreaks?.milestones) {
            progress = enhancedStreaks.milestones[achievement.criteria.value]?.achieved ? 1 : 0;
          }
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