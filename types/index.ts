// User & Family Types
export type UserRole = 'admin' | 'member';
export type FamilyRole = 'parent' | 'child' | 'other';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  familyId?: string;
  role?: UserRole;
  familyRole?: FamilyRole;
  points?: {
    current: number;
    lifetime: number;
    weekly: number;
  };
  streak?: {
    current: number;
    longest: number;
    lastCompletedDate?: string;
  };
  level?: number;
  xp?: {
    current: number;
    toNextLevel: number;
    total: number;
  };
  achievements?: string[]; // Achievement IDs
  badges?: Badge[];
  preferences?: {
    celebrationsEnabled: boolean;
    soundEffectsEnabled: boolean;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FamilyMember {
  uid: string;
  name: string;
  email: string | null;
  role: UserRole;
  familyRole: FamilyRole;
  points: {
    current: number;
    lifetime: number;
    weekly: number;
  };
  streak?: {
    current: number;
    longest: number;
    lastCompletedDate?: string;
  };
  level?: number;
  xp?: {
    current: number;
    toNextLevel: number;
    total: number;
  };
  achievements?: string[];
  badges?: Badge[];
  photoURL?: string;
  joinedAt: Date | string;
  isActive: boolean;
}

export interface Family {
  id?: string;
  name: string;
  adminId: string;
  joinCode: string;
  members: FamilyMember[];
  settings: FamilySettings;
  createdAt: Date | string;
  updatedAt: Date | string;
  memberRotationOrder?: string[];
  nextFamilyChoreAssigneeIndex?: number;
}

export interface FamilySettings {
  defaultChorePoints: number;
  defaultChoreCooldownHours: number;
  allowPointTransfers: boolean;
  weekStartDay: number; // 0-6, Sunday to Saturday
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// Chore Types
export type ChoreType = 'individual' | 'family' | 'shared' | 'pet';
export type ChoreDifficulty = 'easy' | 'medium' | 'hard';
export type ChoreStatus = 'open' | 'completed' | 'overdue';

export interface Chore {
  id?: string;
  title: string;
  description?: string;
  type: ChoreType;
  difficulty: ChoreDifficulty;
  points: number;
  xpReward?: number; // XP separate from points
  assignedTo: string; // User ID
  assignedToName?: string;
  completedBy?: string;
  completedAt?: Date | string;
  dueDate: Date | string;
  createdAt: Date | string;
  createdBy: string;
  familyId: string;
  status: ChoreStatus;
  recurring?: {
    enabled: boolean;
    frequencyDays: number;
  };
  cooldownHours?: number;
  lockedUntil?: Date | string;
  completionCount?: number; // Track how many times completed
  bonusMultiplier?: number; // For special events or streaks
}

// Reward Types
export interface Reward {
  id?: string;
  name: string;
  description?: string;
  pointsCost: number;
  imageUrl?: string;
  familyId: string;
  createdBy: string;
  createdAt: Date | string;
  isActive: boolean;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  criteria: {
    type: 'chores_completed' | 'streak_days' | 'points_earned' | 'level_reached';
    value: number;
  };
}

// Utility Types
export interface ChoreCompletionRecord {
  choreId: string;
  userId: string;
  completedAt: Date | string;
  pointsEarned: number;
  xpEarned: number;
  streakDay: number;
  bonusMultiplier?: number;
  achievementsUnlocked?: string[];
  familyId: string;
}

// New types for enhanced gamification
export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date | string;
}

export interface UserAchievement {
  id?: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date | string;
  progress: number;
  xpEarned: number;
}

export interface LevelConfig {
  level: number;
  xpRequired: number;
  title: string;
  perks?: string[];
}

export interface CompletionReward {
  pointsEarned: number;
  xpEarned: number;
  streakBonus?: number;
  achievementsUnlocked?: Achievement[];
  levelUp?: {
    newLevel: number;
    title: string;
  };
}

export interface Notification {
  id?: string;
  type: 'chore_assigned' | 'chore_completed' | 'achievement_unlocked' | 'family_invite';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date | string;
  data?: any;
}