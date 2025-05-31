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
  
  // ====== ADVANCED USER PROFILE CARDS SYSTEM ======
  
  // Birthday system
  birthday?: string; // ISO date string
  birthdayCountdown?: {
    daysUntil: number;
    nextBirthday: string;
    zodiacSign?: string;
  };
  age?: number; // Auto-calculated from birthday
  
  // Enhanced identity options
  identity?: UserIdentity;
  pronouns?: string; // Custom pronouns support
  
  // Avatar system
  avatar?: UserAvatar;
  
  // Questionnaire system
  questionnaire?: UserQuestionnaire;
  questionnaireUnlocked?: boolean;
  questionnaireCompletedAt?: string;
  
  // Privacy controls
  birthdayVisibility?: VisibilityLevel;
  identityVisibility?: VisibilityLevel;
  avatarVisibility?: VisibilityLevel;
  questionnaireVisibility?: VisibilityLevel;
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
  // Enhanced rotation preferences
  rotationPreferences?: import('./rotation').MemberRotationPreferences;
  capacityLimits?: import('./rotation').MemberCapacityLimits;
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
  // Enhanced rotation system
  rotationSettings?: import('./rotation').FamilyRotationSettings;
  fairnessMetrics?: import('./rotation').FamilyFairnessMetrics;
  rotationAnalytics?: import('./rotation').RotationAnalytics;
}

export interface FamilySettings {
  defaultChorePoints: number;
  defaultChoreCooldownHours: number;
  allowPointTransfers: boolean;
  weekStartDay: number; // 0-6, Sunday to Saturday
  enableAdvancedChoreCards?: boolean; // Enable advanced chore card features
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
  updatedAt?: Date | string;
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
  // Enhanced rotation system
  rotationConfig?: import('./rotation').ChoreRotationConfig;
  rotationHistory?: import('./rotation').RotationAssignment[];
  lastRotationStrategy?: import('./rotation').RotationStrategy;
  lastRotationScore?: number;
  nextRotationDate?: string;
  estimatedDuration?: number; // Minutes
  // Advanced Chore Cards System
  advancedCard?: AdvancedChoreCard;
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
  enhancedStreaks?: {
    activeStreaks?: number;
    milestonesAchieved?: string[];
    categoryStreaks?: Record<string, number>;
    overallStreak?: number;
    categoryStreak?: number;
    perfectDayStreak?: number;
    earlyBirdStreak?: number;
    compoundMultiplier?: number;
  };
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
  compoundStreakMultiplier?: number;
  milestonesAchieved?: any[];
  enhancedStreaks?: any;
  // Quality rating fields for enhanced completion flow
  qualityRating?: QualityRating;
  satisfactionRating?: number;
  comments?: string;
  photos?: string[];
  qualityMultiplier?: number;
  qualityBonus?: number;
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
    basePoints?: number;
    compoundMultiplier?: number;
    milestoneBonus?: number;
    achievedMilestones?: string[];
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

// ====== ADVANCED CHORE CARDS SYSTEM ======

// Age groups for instruction targeting
export type AgeGroup = 'child' | 'teen' | 'adult'; // 5-8, 9-12, 13+
export type QualityRating = 'incomplete' | 'partial' | 'complete' | 'excellent';
export type CertificationLevel = 'basic' | 'intermediate' | 'advanced';

// Instruction System
export interface InstructionStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  safetyNote?: string;
  estimatedMinutes?: number;
  requiredTools?: string[];
  mediaAssets?: MediaAsset[];
  isOptional?: boolean;
}

export interface InstructionSet {
  id: string;
  ageGroup: AgeGroup;
  steps: InstructionStep[];
  prerequisites: string[];
  totalEstimatedMinutes: number;
  safetyWarnings: SafetyWarning[];
  tips: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SafetyWarning {
  id: string;
  level: 'caution' | 'warning' | 'danger';
  message: string;
  icon: string;
  applicableSteps?: number[]; // Step numbers this applies to
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  alt?: string;
  caption?: string;
  duration?: number; // for video/audio
}

// Certification System
export interface ChoreCardCertification {
  required: boolean;
  level: CertificationLevel;
  skills: string[];
  trainingModules: string[];
  expiryDays?: number;
  renewalRequired?: boolean;
}

export interface UserCertificationStatus {
  choreId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'certified' | 'expired' | 'probation';
  level: CertificationLevel;
  certifiedAt?: Date | string;
  expiresAt?: Date | string;
  trainerId?: string;
  trainerName?: string;
  assessmentResults?: AssessmentResult[];
  probationCount?: number;
  notes?: string;
}

export interface AssessmentResult {
  id: string;
  assessorId: string;
  assessorName: string;
  assessedAt: Date | string;
  score: number; // 0-100
  passed: boolean;
  criteria: AssessmentCriteria[];
  comments?: string;
}

export interface AssessmentCriteria {
  skill: string;
  score: number;
  maxScore: number;
  passed: boolean;
  notes?: string;
}

// Performance Tracking
export interface ChoreCompletionHistory {
  id: string;
  choreId: string;
  userId: string;
  completedAt: Date | string;
  qualityRating: QualityRating;
  satisfactionRating: number; // 1-5 emoji scale
  timeToComplete: number; // minutes
  comments?: string;
  photos?: string[];
  instructionRating?: number; // 1-5 how helpful were instructions
  certificationEarned?: string;
  learningAchievements?: string[];
  pointsEarned: number;
  xpEarned: number;
  bonusMultipliers?: {
    quality: number;
    speed: number;
    certification: number;
  };
}

export interface UserChorePreference {
  userId: string;
  choreId: string;
  satisfactionRating: number; // 1-5 emoji scale (😤=1, 😐=3, 😊=5)
  preferenceNotes?: string;
  lastUpdated: Date | string;
  seasonalVariations?: {
    spring?: number;
    summer?: number;
    fall?: number;
    winter?: number;
  };
  timePreferences?: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
}

export interface PerformanceMetrics {
  userId: string;
  choreId: string;
  totalCompletions: number;
  averageQualityRating: number;
  averageSatisfactionRating: number;
  averageCompletionTime: number;
  excellentCount: number;
  incompleteCount: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  lastCompletedAt?: Date | string;
  personalBestTime?: number;
  qualityStreak: number; // consecutive excellent ratings
  certificationProgress?: number; // 0-100%
}

// Educational Content
export interface EducationalFact {
  id: string;
  content: string;
  ageGroups: AgeGroup[];
  category: string;
  choreTypes?: ChoreType[];
  sources: string[];
  verifiedAt: Date | string;
  lastShown?: Date | string;
  engagementScore?: number; // how often users interact with this fact
  seasonal?: boolean;
  culturalContext?: string;
}

export interface InspirationalQuote {
  id: string;
  text: string;
  author?: string;
  ageGroups: AgeGroup[];
  themes: string[]; // 'motivation', 'teamwork', 'responsibility', etc.
  choreTypes?: ChoreType[];
  mood?: 'encouraging' | 'empowering' | 'fun' | 'thoughtful';
  lastShown?: Date | string;
  userRating?: number; // average user rating
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  skills: string[];
  ageGroups: AgeGroup[];
  assessmentCriteria?: string[];
  relatedFacts?: string[]; // IDs of related educational facts
  completionRewards?: {
    points?: number;
    xp?: number;
    badges?: string[];
  };
}

// Smart Assignment
export interface BounceLogic {
  algorithm: 'rotation' | 'preference' | 'skill' | 'availability' | 'mixed';
  exclusionRules: AssignmentRule[];
  emergencyFallback: boolean;
  fairnessWeight: number; // 0-1
  preferenceWeight: number; // 0-1
  skillWeight: number; // 0-1
  availabilityWeight: number; // 0-1
}

export interface AssignmentRule {
  id: string;
  condition: 'user_unavailable' | 'lacks_certification' | 'low_satisfaction' | 'overloaded';
  action: 'skip' | 'require_approval' | 'apply_bonus' | 'suggest_alternative';
  parameters?: Record<string, any>;
}

// Advanced Chore Card Container
export interface AdvancedChoreCard {
  id: string;
  choreId: string;
  // Instruction System
  instructions: {
    child?: InstructionSet;
    teen?: InstructionSet;
    adult?: InstructionSet;
  };
  // Certification Requirements
  certification?: ChoreCardCertification;
  // Educational Content
  educationalContent: {
    facts: string[]; // IDs of educational facts
    quotes: string[]; // IDs of inspirational quotes
    learningObjectives: string[]; // IDs of learning objectives
    seasonalContent?: {
      spring?: string[];
      summer?: string[];
      fall?: string[];
      winter?: string[];
    };
  };
  // Gamification Enhancements
  gamification: {
    specialAchievements: string[]; // Achievement IDs
    qualityMultipliers: {
      incomplete: number; // 0
      partial: number; // 0.5
      complete: number; // 1.0
      excellent: number; // 1.1-1.5
    };
    learningRewards: {
      instructionCompleted: number; // XP for completing instructions
      factEngagement: number; // XP for reading facts
      certificationProgress: number; // XP for certification steps
    };
    certificationBonuses: {
      basic: number;
      intermediate: number;
      advanced: number;
    };
  };
  // Smart Assignment
  bounceLogic?: BounceLogic;
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  familyId: string;
  isActive: boolean;
  version: number;
}

// Advanced Card Analytics
export interface ChoreCardAnalytics {
  choreId: string;
  familyId: string;
  period: {
    start: Date | string;
    end: Date | string;
  };
  metrics: {
    totalCompletions: number;
    averageQualityRating: number;
    averageSatisfactionRating: number;
    instructionEngagement: number; // % who used instructions
    certificationProgress: number; // % who are certified
    educationalEngagement: number; // % who read facts/quotes
    improvementRate: number; // % showing quality improvement
  };
  topPerformers: {
    quality: { userId: string; rating: number }[];
    satisfaction: { userId: string; rating: number }[];
    speed: { userId: string; time: number }[];
  };
  insights: {
    needsAttention: string[]; // User IDs who need help
    excelling: string[]; // User IDs doing great
    suggestions: string[]; // Improvement recommendations
  };
  lastUpdated: Date | string;
}

// ====== ADVANCED USER PROFILE CARDS - TYPE DEFINITIONS ======

// Privacy visibility levels
export type VisibilityLevel = 'family' | 'admins' | 'private';

// Identity system types
export type IdentityOption = 
  | 'Boy' 
  | 'Girl' 
  | 'Man' 
  | 'Woman' 
  | 'Non Binary' 
  | 'Genderfluid' 
  | 'Agender' 
  | 'Demigender' 
  | 'Two Spirit' 
  | 'Questioning' 
  | 'Prefer Not to Say' 
  | 'Other';

export interface UserIdentity {
  primaryIdentity: IdentityOption;
  customIdentity?: string; // For "Other" or custom entries
  ageCategory: 'child' | 'teen' | 'adult'; // Auto-calculated from birthday
}

// Avatar system types
export interface UserAvatar {
  type: 'generated' | 'uploaded';
  
  // For generated avatars (DiceBear/Avataaars)
  generatedConfig?: {
    provider: 'dicebear' | 'avataaars';
    style: string; // e.g., 'personas', 'avataaars', 'bottts'
    seed: string; // Unique seed for consistent generation
    options: AvatarOptions; // Customization options
    url: string; // Generated avatar URL
  };
  
  // For uploaded avatars (Google Drive)
  uploadedConfig?: {
    googleDriveUrl: string; // Original Google Drive link
    processedUrl: string; // Processed/cached image URL
    uploadedAt: string; // ISO timestamp
    validated: boolean; // Whether link was successfully validated
  };
  
  // Common properties
  lastUpdated: string;
  fallbackUrl?: string; // Backup avatar if primary fails
}

export interface AvatarOptions {
  // DiceBear/Avataaars customization options
  backgroundColor?: string[];
  clothingColor?: string[];
  eyeColor?: string[];
  hairColor?: string[];
  skinColor?: string[];
  accessoriesChance?: number;
  facialHairChance?: number;
  // Additional customization based on chosen provider
  [key: string]: any;
}

// Questionnaire system types
export type QuestionCategory = 
  | 'interests' 
  | 'personality' 
  | 'preferences' 
  | 'goals' 
  | 'family_dynamics' 
  | 'learning_style'
  | 'motivation'
  | 'communication'
  | 'activities'
  | 'values';

export type AgeGroupQuestionnaire = 'child' | 'teen' | 'adult';

export interface UserQuestionnaire {
  responses: QuestionnaireResponse[];
  personalityProfile?: PersonalityProfile;
  preferences?: UserPreferencesProfile;
  completedAt: string;
  version: number; // For questionnaire updates
}

export interface QuestionnaireResponse {
  questionId: string;
  questionText: string;
  answer: string | number | string[];
  category: QuestionCategory;
}

export interface QuestionnaireQuestion {
  id: string;
  category: QuestionCategory;
  ageGroups: AgeGroupQuestionnaire[]; // ['child', 'teen', 'adult']
  questionText: string;
  answerType: 'multipleChoice' | 'scale' | 'openText' | 'multiSelect';
  options?: string[]; // For multiple choice
  scaleRange?: { min: number; max: number; labels: string[] };
  required: boolean;
  order: number;
}

export interface PersonalityProfile {
  traits: {
    [key: string]: number; // Trait scores 0-100
  };
  motivationStyle: 'competitive' | 'collaborative' | 'independent' | 'supportive';
  communicationStyle: 'direct' | 'encouraging' | 'detailed' | 'visual';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  goalOrientation: 'short_term' | 'long_term' | 'mixed';
}

export interface UserPreferencesProfile {
  favoriteActivities: string[];
  preferredRewardTypes: string[];
  preferredWorkingTimes: string[];
  collaborationPreference: 'solo' | 'partner' | 'group' | 'varies';
  challengeLevel: 'easy' | 'moderate' | 'difficult' | 'mixed';
  feedbackStyle: 'immediate' | 'detailed' | 'public' | 'private';
}

// Zodiac sign calculation
export type ZodiacSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' 
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

// Birthday countdown interface
export interface BirthdayCountdown {
  daysUntil: number;
  nextBirthday: string; // ISO date string
  zodiacSign: ZodiacSign;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
}

// Enhanced Family Member interface with profile features
export interface EnhancedFamilyMember extends FamilyMember {
  // Profile enhancements
  birthday?: string;
  birthdayCountdown?: BirthdayCountdown;
  age?: number;
  identity?: UserIdentity;
  pronouns?: string;
  avatar?: UserAvatar;
  questionnaire?: UserQuestionnaire;
  questionnaireUnlocked?: boolean;
  questionnaireCompletedAt?: string;
  
  // Privacy settings
  birthdayVisibility?: VisibilityLevel;
  identityVisibility?: VisibilityLevel;
  avatarVisibility?: VisibilityLevel;
  questionnaireVisibility?: VisibilityLevel;
}