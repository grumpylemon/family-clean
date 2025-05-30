// User & Family Types
export type UserRole = 'admin' | 'member';
export type FamilyRole = 'parent' | 'child' | 'other';

// Streak System Types
export type StreakType = 'overall' | 'category' | 'perfect_day' | 'early_bird' | 'room' | 'pet_care';
export type StreakCategory = 'kitchen' | 'bathroom' | 'bedroom' | 'outdoor' | 'pet' | 'general';

// Streak Multiplier System
export interface StreakMultiplier {
  type: StreakType;
  days: number;
  multiplier: number;
  category?: StreakCategory;
  roomId?: string;
}

export interface StreakBonus {
  type: 'completion' | 'milestone' | 'compound' | 'special_event';
  streakType: StreakType;
  days: number;
  bonusPoints?: number;
  bonusXP?: number;
  multiplier?: number;
  description: string;
}

// Streak Milestone System
export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  bonusPoints: number;
  bonusXP: number;
  badge?: string; // Badge ID awarded
  isSpecial?: boolean; // For major milestones (100, 365 days)
}

export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate?: string;
  multiplier?: number; // Current active multiplier
  freezeTokens?: number; // Grace periods available
  isProtected?: boolean; // Has streak protection active
}

export interface EnhancedStreak {
  // Overall streak (legacy compatibility)
  overall: StreakData;
  
  // Category-specific streaks
  categories: {
    [key in StreakCategory]?: StreakData;
  };
  
  // Special streak types
  perfectDay: StreakData; // All assigned chores completed in a day
  earlyBird: StreakData; // Completed before noon
  
  // Room-specific streaks (for room-based chores)
  rooms: {
    [roomId: string]: StreakData;
  };
  
  // Analytics and insights
  analytics?: {
    bestStreakMonth?: string;
    averageStreakLength?: number;
    streakRecoveryRate?: number; // How often streaks are rebuilt after breaking
    totalStreakDays?: number;
    streakMilestones?: number[]; // Days achieved (7, 30, 100, etc.)
  };
  
  // Streak milestones and bonuses
  milestones?: {
    [days: number]: {
      achieved: boolean;
      achievedAt?: Date | string;
      bonusAwarded?: number; // Extra points/XP received
    };
  };
}

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
  // Enhanced streak system (new)
  streaks?: EnhancedStreak;
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
  notificationSettings?: NotificationSettings;
  expoPushToken?: string;
  notificationPermission?: 'granted' | 'denied' | 'undetermined';
  lastNotificationAt?: string;
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
  // Enhanced streak system (new)
  streaks?: EnhancedStreak;
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
  // Takeover statistics
  takeoverStats?: {
    choresTakenOver: number;
    totalTakeoverBonus: number;
    lastTakeoverAt?: string;
    takeoverStreak: number;
    dailyTakeoverCount: number;
    dailyTakeoverResetAt: string;
  };
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
  // Room/Space management
  rooms?: Room[];
  roomAssignments?: RoomAssignment[];
  // Collaboration features
  collaborationSettings?: CollaborationSettings;
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
  // Takeover system settings
  takeoverSettings?: TakeoverSettings;
}

// Chore Types
export type ChoreType = 'individual' | 'family' | 'shared' | 'pet' | 'room';
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
  // Room/Space assignment (for room-based chores)
  roomId?: string;
  roomName?: string;
  roomType?: RoomType;
  // Auto-generation tracking
  autoGenerated?: boolean;
  templateId?: string;
  category?: string; // Category for room/pet chores
  // Takeover tracking fields
  originalAssignee?: string; // Original assignee before takeover
  originalAssigneeName?: string; // Original assignee's name
  takenOverBy?: string; // User ID of person who took over
  takenOverByName?: string; // Name of person who took over
  takenOverAt?: Date | string; // When the takeover happened
  takeoverReason?: string; // Optional: reason for takeover (e.g., "not_home", "unable", "helping")
  missedBy?: string[]; // Track users who missed this assignment
  // Enhanced takeover fields
  takeoverEligibleAt?: string; // ISO date when takeover becomes available
  takeoverHistory?: ChoreTakeoverHistory[];
  isTakenOver?: boolean;
  takeoverBonusPoints?: number;
  takeoverBonusXP?: number;
}

// Reward Types
export type RewardCategory = 'privilege' | 'item' | 'experience' | 'money' | 'digital' | 'other';

export interface Reward {
  id?: string;
  name: string;
  description?: string;
  pointsCost: number;
  category: RewardCategory;
  imageUrl?: string;
  familyId: string;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
  // Stock management
  hasStock?: boolean;
  stockCount?: number;
  isUnlimited?: boolean;
  // Restrictions
  minLevel?: number; // Minimum level required to redeem
  requiredAchievements?: string[]; // Achievement IDs required
  ageRestriction?: number; // Minimum age
  // Special properties
  isRepeatable?: boolean; // Can be redeemed multiple times
  cooldownDays?: number; // Days before can redeem again
  expiresAt?: Date | string; // For limited-time rewards
  // Display properties
  featured?: boolean; // Show in featured section
  sortOrder?: number; // For custom ordering
}

export interface RewardRedemption {
  id?: string;
  rewardId: string;
  rewardName: string;
  userId: string;
  userName: string;
  familyId: string;
  pointsSpent: number;
  redeemedAt: Date | string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date | string;
  completedAt?: Date | string;
  notes?: string;
  adminNotes?: string;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  criteria: {
    type: 'chores_completed' | 'streak_days' | 'points_earned' | 'level_reached' | 
          'category_streak' | 'perfect_day_streak' | 'early_bird_streak' | 'room_streak' | 
          'streak_recovery' | 'multiple_streaks' | 'streak_milestone' | 'chores_taken_over';
    value: number;
    // Additional criteria for streak-specific achievements
    streakType?: StreakType;
    category?: StreakCategory;
    roomId?: string;
    timeRequirement?: string; // For early bird (e.g., "12:00")
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

// Daily Points Tracking
export interface DailyPointsRecord {
  id?: string;
  userId: string;
  familyId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  points: number;
  choreCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Point Transaction Log
export interface PointTransaction {
  id?: string;
  userId: string;
  familyId: string;
  type: 'earned' | 'spent' | 'transferred' | 'bonus' | 'penalty' | 'milestone';
  amount: number;
  source: 'chore' | 'reward' | 'transfer' | 'achievement' | 'streak' | 'milestone' | 'admin';
  sourceId?: string; // ID of the chore, reward, etc.
  description: string;
  metadata?: {
    choreTitle?: string;
    rewardName?: string;
    fromUserId?: string;
    toUserId?: string;
    streakBonus?: number;
    milestoneLevel?: number;
    adminNote?: string;
  };
  createdAt: Date | string;
}

// Point Milestones
export interface PointMilestone {
  id: string;
  level: number;
  pointsRequired: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockRewards?: {
    bonusPoints?: number;
    specialBadge?: string;
    unlockFeature?: string;
  };
}

// Point Transfer Request
export interface PointTransferRequest {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  reason?: string;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  requestedAt: Date | string;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  reviewNotes?: string;
  familyId: string;
}

export interface WeeklyPointsData {
  userId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  dailyPoints: {
    date: string;
    points: number;
    choreCount: number;
  }[];
  totalPoints: number;
  totalChores: number;
  weekNumber: number;
  year: number;
}

// Pet Management Types
export type PetType = 'dog' | 'cat' | 'bird' | 'fish' | 'hamster' | 'rabbit' | 'reptile' | 'other';
export type PetSize = 'small' | 'medium' | 'large';
export type PetActivityLevel = 'low' | 'medium' | 'high';

export interface Pet {
  id?: string;
  name: string;
  type: PetType;
  breed?: string;
  age?: number; // in years
  size?: PetSize;
  activityLevel?: PetActivityLevel;
  photoURL?: string;
  familyId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Care requirements
  careSettings: PetCareSettings;
  // Health tracking
  healthInfo?: PetHealthInfo;
  // Behavioral notes
  notes?: string;
  favoriteActivities?: string[];
}

export interface PetCareSettings {
  // Feeding schedule
  feedingTimes: number; // meals per day
  feedingHours: number[]; // preferred hours (24-hour format)
  // Exercise requirements
  exerciseMinutesDaily: number;
  walkTimesDaily?: number; // for dogs
  // Grooming
  groomingFrequencyDays: number;
  // Special care
  medicationReminders?: PetMedicationReminder[];
  vetCheckupFrequencyMonths?: number;
}

export interface PetHealthInfo {
  lastVetVisit?: Date | string;
  nextVetVisit?: Date | string;
  vaccinations?: PetVaccination[];
  medications?: PetMedication[];
  allergies?: string[];
  medicalNotes?: string;
}

export interface PetVaccination {
  name: string;
  dateGiven: Date | string;
  expiresAt?: Date | string;
  veterinarian?: string;
}

export interface PetMedication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date | string;
  endDate?: Date | string;
  notes?: string;
}

export interface PetMedicationReminder {
  medicationName: string;
  timeOfDay: string; // HH:MM format
  dosage: string;
  isActive: boolean;
}

// Pet chore generation templates
export interface PetChoreTemplate {
  id: string;
  name: string;
  description: string;
  petTypes: PetType[]; // which pet types this applies to
  points: number;
  difficulty: ChoreDifficulty;
  frequencyHours: number; // how often this chore should be generated
  isRequired: boolean; // essential care vs optional
  category: 'feeding' | 'exercise' | 'grooming' | 'health' | 'cleaning' | 'play';
  conditions?: {
    petAge?: { min?: number; max?: number };
    petSize?: PetSize[];
    activityLevel?: PetActivityLevel[];
  };
}

// Pet care completion tracking
export interface PetCareRecord {
  id?: string;
  petId: string;
  petName: string;
  careType: 'feeding' | 'exercise' | 'grooming' | 'medication' | 'vet' | 'play';
  completedBy: string;
  completedAt: Date | string;
  notes?: string;
  rating?: number; // 1-5 quality rating
  familyId: string;
}

// Pet happiness/wellbeing tracking
export interface PetWellbeingMetrics {
  petId: string;
  date: string; // ISO date string
  feedingScore: number; // 0-100
  exerciseScore: number; // 0-100
  groomingScore: number; // 0-100
  healthScore: number; // 0-100
  overallHappiness: number; // 0-100 calculated score
  missedCareCount: number;
  careConsistency: number; // streak of consistent care
}

// Enhanced Chore interface to include pet-specific fields
export interface PetChore extends Omit<Chore, 'type'> {
  type: 'pet';
  petId: string;
  petName: string;
  careCategory: 'feeding' | 'exercise' | 'grooming' | 'health' | 'cleaning' | 'play';
  isUrgent?: boolean; // for overdue essential care
  autoGenerated: boolean; // whether this was auto-created from template
  templateId?: string; // reference to the template used
}

// Room/Space Management Types
export type RoomType = 
  'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 
  'laundry_room' | 'garage' | 'basement' | 'attic' | 'office' | 
  'playroom' | 'guest_room' | 'outdoor' | 'pantry' | 'closet' | 'other';

export type RoomSharingType = 'private' | 'shared' | 'common';

export interface Room {
  id?: string;
  name: string; // Custom name like "Master Bedroom", "Kids' Bathroom"
  type: RoomType;
  sharingType: RoomSharingType;
  familyId: string;
  description?: string;
  // Assignment tracking
  assignedMembers: string[]; // User IDs of assigned members
  primaryAssignee?: string; // Primary responsible member
  // Chore generation settings
  choreTemplates?: RoomChoreTemplate[];
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  isActive: boolean;
}

export interface RoomAssignment {
  id?: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  familyId: string;
  // Assignment details
  isPrimary: boolean; // Primary assignee vs secondary
  responsibilities?: string[]; // Specific responsibilities in this room
  // Metadata
  assignedAt: Date | string;
  assignedBy: string;
}

// Room-specific chore templates
export interface RoomChoreTemplate {
  id: string;
  name: string;
  description: string;
  roomTypes: RoomType[]; // which room types this applies to
  points: number;
  difficulty: ChoreDifficulty;
  frequencyHours: number; // how often this chore should be generated
  isRequired: boolean; // essential vs optional
  category: 'cleaning' | 'organizing' | 'maintenance' | 'restocking' | 'deep_cleaning';
  assignmentStrategy: 'assigned_members' | 'rotating' | 'anyone' | 'primary_only';
  estimatedMinutes?: number; // time estimate for the task
}

// Enhanced Chore interface to include room assignment
export interface RoomChore extends Omit<Chore, 'type'> {
  type: 'room';
  roomId: string;
  roomName: string;
  roomType: RoomType;
  autoGenerated?: boolean; // whether this was auto-created from template
  templateId?: string; // reference to the template used
  category?: 'cleaning' | 'organizing' | 'maintenance' | 'restocking' | 'deep_cleaning';
}

// Room sharing conflict resolution
export interface RoomConflict {
  id?: string;
  roomId: string;
  roomName: string;
  conflictType: 'scheduling' | 'responsibility' | 'assignment';
  description: string;
  involvedMembers: string[]; // User IDs
  reportedBy: string;
  reportedAt: Date | string;
  status: 'open' | 'resolved' | 'dismissed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date | string;
  familyId: string;
}

// ====== COLLABORATION FEATURES ======

// Help Request System
export type HelpRequestType = 'assistance' | 'advice' | 'takeover';
export type HelpRequestUrgency = 'low' | 'medium' | 'high' | 'urgent';
export type HelpRequestStatus = 'open' | 'accepted' | 'completed' | 'cancelled' | 'expired';

export interface HelpRequest {
  id?: string;
  choreId: string;
  choreTitle: string;
  requesterId: string;
  requesterName: string;
  helperId?: string;
  helperName?: string;
  familyId: string;
  // Request details
  type: HelpRequestType;
  urgency: HelpRequestUrgency;
  description: string;
  estimatedTimeNeeded?: number; // minutes
  // Status tracking
  status: HelpRequestStatus;
  createdAt: Date | string;
  acceptedAt?: Date | string;
  completedAt?: Date | string;
  expiresAt: Date | string;
  // Reward sharing
  pointsSplit?: number; // percentage for helper (0-100)
  xpSplit?: number; // percentage for helper (0-100)
  // Metadata
  helperRating?: number; // 1-5 rating
  helperFeedback?: string;
}

// Trade Proposal System
export type TradeProposalStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'cancelled';
export type TradeType = 'one_to_one' | 'multi_swap' | 'future_option';

export interface TradeProposal {
  id?: string;
  proposerId: string;
  proposerName: string;
  receiverId: string;
  receiverName: string;
  familyId: string;
  // Trade details
  type: TradeType;
  status: TradeProposalStatus;
  offeredChoreIds: string[]; // chores proposer offers
  offeredChoreDetails?: ChoreTradeDetails[];
  requestedChoreIds: string[]; // chores proposer wants
  requestedChoreDetails?: ChoreTradeDetails[];
  // Additional compensation
  pointsCompensation?: number; // additional points offered/requested
  notes?: string;
  // Timeline
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt: Date | string;
  respondedAt?: Date | string;
  // Counter-offer tracking
  counterProposalId?: string; // if this is a counter to another proposal
  originalProposalId?: string; // tracks the original proposal in a chain
  // Validation
  fairnessScore?: number; // calculated fairness (0-100)
  adminApprovalRequired?: boolean;
  adminApprovedBy?: string;
}

export interface ChoreTradeDetails {
  choreId: string;
  title: string;
  points: number;
  difficulty: ChoreDifficulty;
  dueDate?: Date | string;
  estimatedMinutes?: number;
}

// Urgency & Stealing System
export type UrgencyLevel = 'normal' | 'elevated' | 'high' | 'critical';

export interface ChoreUrgency {
  choreId: string;
  currentLevel: UrgencyLevel;
  escalatedAt?: Date | string;
  stealableAt?: Date | string; // when chore becomes available for stealing
  stealProtectionEndsAt?: Date | string; // protection period for new chores
  bonusMultiplier: number; // point bonus for urgent completion
  // History
  escalationHistory: UrgencyEscalation[];
}

export interface UrgencyEscalation {
  fromLevel: UrgencyLevel;
  toLevel: UrgencyLevel;
  escalatedAt: Date | string;
  reason: string; // 'time_based' | 'manual' | 'missed_deadline'
}

// Collaboration Settings (Admin Controls)
export interface CollaborationSettings {
  familyId: string;
  // Feature toggles
  helpRequestsEnabled: boolean;
  tradeProposalsEnabled: boolean;
  urgencySystemEnabled: boolean;
  choreStealingEnabled: boolean;
  // Help request settings
  helpRequestDefaults: {
    expirationHours: number; // default 24
    maxActiveRequests: number; // per user
    minPointsSplit: number; // minimum % for helper
    requireApprovalAbove?: number; // points threshold
  };
  // Trade settings
  tradeDefaults: {
    expirationHours: number; // default 48
    maxActiveTrades: number; // per user
    requireAdminApproval: boolean;
    fairnessThreshold: number; // 0-100, below requires approval
    allowFutureTrades: boolean;
  };
  // Urgency settings
  urgencyDefaults: {
    normalDurationHours: number; // before elevation
    elevatedDurationHours: number; // before high
    highDurationHours: number; // before critical
    stealProtectionHours: number; // new chore protection
    bonusMultipliers: {
      elevated: number; // e.g., 1.1
      high: number; // e.g., 1.25
      critical: number; // e.g., 1.5
    };
  };
  // Notification preferences
  collaborationNotifications: {
    helpRequestCreated: boolean;
    helpRequestAccepted: boolean;
    tradeProposalReceived: boolean;
    tradeProposalResponded: boolean;
    choreBecomingUrgent: boolean;
    choreStolen: boolean;
  };
  // Metadata
  updatedAt: Date | string;
  updatedBy: string;
}

// Collaboration Notifications
export type CollaborationNotificationType = 
  | 'help_request_created'
  | 'help_request_accepted' 
  | 'help_request_completed'
  | 'trade_proposal_received'
  | 'trade_proposal_accepted'
  | 'trade_proposal_rejected'
  | 'trade_proposal_countered'
  | 'chore_urgency_increased'
  | 'chore_became_stealable'
  | 'chore_was_stolen';

export interface CollaborationNotification {
  id?: string;
  type: CollaborationNotificationType;
  recipientId: string;
  familyId: string;
  // Reference to related entity
  relatedEntityId: string; // help request, trade, or chore ID
  relatedEntityType: 'help_request' | 'trade' | 'chore';
  // Notification content
  title: string;
  message: string;
  actionUrl?: string;
  // Status
  isRead: boolean;
  readAt?: Date | string;
  createdAt: Date | string;
  expiresAt?: Date | string;
  // Additional data
  metadata?: Record<string, any>;
}

// ====== CHORE TAKEOVER SYSTEM ======

export interface ChoreTakeoverHistory {
  originalAssignee: string;
  originalAssigneeName: string;
  takenOverBy: string;
  takenOverByName: string;
  takenOverAt: string;
  bonusPoints: number;
  bonusXP: number;
  reason?: 'overdue' | 'abandoned' | 'requested';
  adminApproved?: boolean;
}

export interface ChoreTakeover {
  id: string;
  choreId: string;
  choreTitle: string;
  originalAssigneeId: string;
  originalAssigneeName: string;
  newAssigneeId: string;
  newAssigneeName: string;
  familyId: string;
  takenOverAt: string;
  reason: 'overdue' | 'abandoned' | 'requested';
  bonusPoints: number;
  bonusXP: number;
  adminApproved?: boolean;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  completedAt?: string;
  // Validation data
  overdueHours?: number;
  requiresAdminApproval: boolean; // For high-value chores
}

export interface TakeoverSettings {
  enabled: boolean;
  overdueThresholdHours: number; // Default 24
  maxDailyTakeovers: number; // Default 2
  takeoverBonusPercentage: number; // Default 25
  takeoverXPMultiplier: number; // Default 2.0
  cooldownAfterTakeoverHours: number; // Default 48
  highValueThreshold: number; // Points threshold for admin approval (default 100)
  protectionPeriodHours: number; // New chore protection (default 12)
}

// ====== TAKEOVER ANALYTICS ======

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export interface TakeoverAnalytics {
  familyId: string;
  period: AnalyticsPeriod;
  lastUpdated: string;
  leaderboard: TakeoverLeaderboardEntry[];
  choreHealthMetrics: ChoreHealthMetric[];
  collaborationScore: number;
  insights: TakeoverInsight[];
}

export interface TakeoverLeaderboardEntry {
  userId: string;
  userName: string;
  photoURL?: string;
  totalTakeovers: number;
  bonusPointsEarned: number;
  averageResponseTime: number; // hours
  currentStreak: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  completionRate: number; // percentage of takeovers completed
}

export interface ChoreHealthMetric {
  choreId?: string;
  choreTitle?: string;
  choreType?: ChoreType;
  takeoverRate: number; // percentage
  averageOverdueHours: number;
  mostFrequentHelper?: string;
  mostFrequentHelperName?: string;
  originalAssigneePattern?: {
    userId: string;
    userName: string;
    missRate: number;
  };
  healthScore: number; // 0-100, where 100 is perfectly healthy
}

export interface TakeoverInsight {
  id: string;
  type: 'pattern' | 'suggestion' | 'achievement' | 'warning';
  priority: 'low' | 'medium' | 'high';
  message: string;
  actionable: boolean;
  createdAt: string;
  action?: {
    type: 'reassign' | 'adjust_points' | 'change_schedule' | 'celebrate';
    choreId?: string;
    userId?: string;
    suggestedAssignee?: string;
    suggestedPoints?: number;
    suggestedSchedule?: string;
  };
}

// Analytics summary for family
export interface TakeoverSummaryStats {
  totalTakeovers: number;
  uniqueHelpers: number;
  averageResponseTime: number;
  collaborationScore: number;
  topHelper?: {
    userId: string;
    userName: string;
    photoURL?: string;
    takeoverCount: number;
  };
  mostProblematicChore?: {
    choreId: string;
    choreTitle: string;
    takeoverRate: number;
  };
}

// ====== PUSH NOTIFICATIONS ======

export type NotificationType = 
  | 'chore_available' 
  | 'achievement_unlocked' 
  | 'admin_approval_needed' 
  | 'takeover_completed' 
  | 'daily_summary';

export interface NotificationSettings {
  enabled: boolean;
  types: {
    choreAvailable: boolean;
    achievementUnlocked: boolean;
    adminApprovalNeeded: boolean;
    takeoverCompleted: boolean;
    dailySummary: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // "21:00"
    endTime: string;   // "07:00"
  };
  sound: boolean;
  vibration: boolean;
}

export interface PushNotification {
  id: string;
  type: NotificationType;
  recipientId: string;
  familyId: string;
  title: string;
  body: string;
  data: {
    choreId?: string;
    achievementId?: string;
    takeoverId?: string;
    actionUrl?: string;
    [key: string]: any;
  };
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  clickedAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'clicked' | 'failed';
  expoTickets?: string[];
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
  sound?: boolean;
  vibration?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  type: 'default' | 'destructive';
  url?: string;
}

// ====== ADMIN CONTROLS INTERFACES ======

// Custom Takeover Rules System
export interface CustomTakeoverRules {
  byChoreType: Record<string, ChoreTypeRules>;
  byMember: Record<string, MemberRules>;
  timeBasedRules: TimeBasedRule[];
  emergencyOverrides: EmergencyOverride[];
}

export interface ChoreTypeRules {
  takeoverThresholdHours: number;
  bonusMultiplier: number;
  maxDailyTakeovers: number;
  requiresApproval: boolean;
  allowedDays: number[]; // 0-6 for Sun-Sat
}

export interface MemberRules {
  takeoverLimit: number;
  bonusMultiplier: number;
  cooldownMultiplier: number;
  canSkipApproval: boolean;
  restrictedChoreTypes: string[];
}

export interface TimeBasedRule {
  id: string;
  name: string;
  timeRange: {
    start: string; // "HH:MM"
    end: string;
  };
  daysOfWeek: number[];
  modifications: Partial<TakeoverSettings>;
  priority: number;
}

export interface EmergencyOverride {
  id: string;
  name: string;
  description: string;
  activatedBy: string;
  activatedAt: string;
  expiresAt?: string;
  conditions: {
    skipApprovals?: boolean;
    bonusMultiplier?: number;
    unlimitedTakeovers?: boolean;
  };
  isActive: boolean;
}

// Bulk Operations
export interface BulkApprovalRequest {
  takeoverIds: string[];
  action: 'approve' | 'deny';
  reason?: string;
  applyToFuture?: boolean; // Apply decision to similar requests
}

export interface BulkApprovalResult {
  successCount: number;
  failedCount: number;
  errors: string[];
  processedAt: string;
}

// Performance Reports
export interface PerformanceReport {
  familyId: string;
  period: {
    start: string;
    end: string;
  };
  generatedAt: string;
  summary: {
    totalTakeovers: number;
    uniqueHelpers: number;
    averageResponseTime: number;
    collaborationScore: number;
  };
  memberStats: MemberPerformanceStats[];
  choreStats: ChorePerformanceStats[];
  trends: TrendData[];
}

export interface MemberPerformanceStats {
  userId: string;
  userName: string;
  photoURL?: string;
  stats: {
    choresTakenOver: number;
    choresGivenAway: number;
    bonusPointsEarned: number;
    averageResponseTime: number;
    helpfulnessScore: number;
    currentStreak: number;
  };
}

export interface ChorePerformanceStats {
  choreType: string;
  stats: {
    totalAssigned: number;
    totalTakenOver: number;
    takeoverRate: number;
    averageCompletionTime: number;
    overdueRate: number;
  };
}

export interface TrendData {
  date: string;
  value: number;
  metric: string;
}

// Admin Actions & Audit Trail
export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  familyId: string;
  action: 'bulk_approval' | 'rule_change' | 'settings_update' | 'export_generate' | 'emergency_override';
  timestamp: string;
  details: Record<string, any>;
  affectedMembers: string[];
  rollbackData?: Record<string, any>;
}

// Export Settings
export interface ExportSettings {
  autoGenerate: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  includeCharts: boolean;
  format: 'csv' | 'pdf' | 'both';
  lastGeneratedAt?: string;
}