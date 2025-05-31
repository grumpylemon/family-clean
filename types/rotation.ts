/**
 * Comprehensive Rotation System Types
 * Defines all types and interfaces for the advanced chore rotation management system
 */

import { ChoreType, ChoreDifficulty, FamilyMember } from './index';

// Core rotation strategies available
export enum RotationStrategy {
  ROUND_ROBIN = 'round_robin',
  WORKLOAD_BALANCE = 'workload_balance',
  SKILL_BASED = 'skill_based',
  CALENDAR_AWARE = 'calendar_aware',
  RANDOM_FAIR = 'random_fair',
  PREFERENCE_BASED = 'preference_based',
  MIXED_STRATEGY = 'mixed_strategy'
}

// Rotation configuration for families and individual chores
export interface RotationConfig {
  strategy: RotationStrategy;
  parameters: Record<string, any>;
  enabled: boolean;
  weight?: number; // For mixed strategies (0-1)
  fallbackStrategy?: RotationStrategy;
}

// Family-wide rotation settings
export interface FamilyRotationSettings {
  defaultStrategy: RotationStrategy;
  fairnessWeight: number; // 0-1, how much to prioritize fairness
  preferenceWeight: number; // 0-1, how much to respect preferences
  availabilityWeight: number; // 0-1, how much to consider calendar
  enableIntelligentScheduling: boolean;
  maxChoresPerMember: number;
  rotationCooldownHours: number;
  seasonalAdjustments: boolean;
  autoRebalancingEnabled: boolean;
  emergencyFallbackEnabled: boolean;
  strategyConfigs: Record<RotationStrategy, RotationConfig>;
}

// Member-specific rotation preferences
export interface MemberRotationPreferences {
  preferredChoreTypes: ChoreType[];
  dislikedChoreTypes: ChoreType[];
  preferredDifficulties: ChoreDifficulty[];
  maxChoresPerWeek: number;
  maxChoresPerDay: number;
  preferredDaysOfWeek: number[]; // 0-6, Sunday to Saturday
  preferredTimeRanges: TimeRange[];
  unavailabilityPeriods: UnavailabilityPeriod[];
  skillCertifications: string[];
  energyPatterns: EnergyPattern[];
}

// Time-based interfaces
export interface TimeRange {
  startHour: number; // 0-23
  endHour: number; // 0-23
  daysOfWeek: number[]; // 0-6
  enabled: boolean;
}

export interface UnavailabilityPeriod {
  startDate: string; // ISO date
  endDate: string; // ISO date
  reason: string;
  recurring?: boolean;
  daysOfWeek?: number[]; // For recurring weekly patterns
}

export interface EnergyPattern {
  timeRange: TimeRange;
  energyLevel: 'low' | 'medium' | 'high';
  description?: string;
}

// Capacity and workload management
export interface MemberCapacityLimits {
  maxPointsPerWeek: number;
  maxChoresPerDay: number;
  maxDifficultChoresPerWeek: number;
  maxConsecutiveHardChores: number;
  restDayRequired: boolean;
  overrideCapacityInEmergency: boolean;
}

// Fairness tracking and metrics
export interface MemberWorkload {
  memberId: string;
  memberName: string;
  currentPoints: number;
  currentChores: number;
  weeklyPoints: number;
  weeklyChores: number;
  difficultyDistribution: Record<ChoreDifficulty, number>;
  completionRate: number; // 0-1
  averageCompletionTime: number; // minutes
  fairnessScore: number; // 0-100, higher is more fair
  capacityUtilization: number; // 0-1
  preferenceRespectRate: number; // 0-1
}

export interface FamilyFairnessMetrics {
  lastCalculatedAt: string;
  memberWorkloads: MemberWorkload[];
  equityScore: number; // 0-100, higher is more fair
  rebalancingNeeded: boolean;
  workloadVariance: number; // Statistical variance in workloads
  fairnessThreshold: number; // Minimum acceptable equity score
  nextRebalanceDate?: string;
}

// Rotation assignment tracking
export interface RotationAssignment {
  choreId: string;
  assignedMemberId: string;
  assignedMemberName: string;
  assignedAt: string;
  strategy: RotationStrategy;
  fairnessScore: number;
  conflictsDetected: ScheduleConflict[];
  overrideReason?: string;
  completedAt?: string;
  completionRating?: number; // 1-5 stars
}

// Schedule conflict detection
export interface ScheduleConflict {
  type: 'calendar' | 'capacity' | 'preference' | 'skill' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedResolution?: string;
  canOverride: boolean;
}

// Chore-specific rotation configuration
export interface ChoreRotationConfig {
  strategy: RotationStrategy;
  eligibleMembers?: string[]; // Restrict rotation to specific members
  requiredSkills?: string[]; // Required certifications
  preferredMembers?: string[]; // Members who prefer this chore
  avoidMembers?: string[]; // Members who dislike this chore
  maxConsecutiveAssignments?: number;
  seasonalAvailability?: SeasonalConfig;
  difficultyOverride?: ChoreDifficulty; // Override default difficulty for rotation calculations
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
}

// Seasonal chore management
export interface SeasonalConfig {
  seasons: ('spring' | 'summer' | 'fall' | 'winter')[];
  weatherDependent: boolean;
  temperatureRange?: {
    min: number;
    max: number;
  };
  indoorAlternative?: string; // Alternative chore ID for bad weather
}

// Rotation analytics and performance tracking
export interface RotationAnalytics {
  totalRotations: number;
  successRate: number; // Percentage of rotations completed on time
  averageCompletionTime: number;
  memberSatisfactionScore: number; // 0-100
  fairnessHistory: FairnessSnapshot[];
  strategyEffectiveness: Record<RotationStrategy, StrategyMetrics>;
  conflictRate: number; // Percentage of rotations with conflicts
  overrideRate: number; // Percentage of manual overrides
}

export interface FairnessSnapshot {
  date: string;
  equityScore: number;
  memberWorkloads: MemberWorkload[];
  rebalancingActions: string[];
}

export interface StrategyMetrics {
  usageCount: number;
  successRate: number;
  averageFairnessScore: number;
  memberSatisfactionScore: number;
  conflictRate: number;
  lastUsed: string;
}

// Rotation engine context and results
export interface RotationContext {
  familyId: string;
  choreId: string;
  currentAssignee?: string;
  availableMembers: FamilyMember[];
  familySettings: FamilyRotationSettings;
  currentWorkloads: MemberWorkload[];
  scheduleConstraints: ScheduleConstraint[];
  emergencyMode: boolean;
}

export interface ScheduleConstraint {
  memberId: string;
  conflictType: string;
  startTime: string;
  endTime: string;
  severity: 'low' | 'medium' | 'high';
  canReschedule: boolean;
}

export interface RotationResult {
  success: boolean;
  assignedMemberId?: string;
  assignedMemberName?: string;
  strategy: RotationStrategy;
  fairnessScore: number;
  conflictsDetected: ScheduleConflict[];
  alternativeAssignments?: AlternativeAssignment[];
  recommendedAction?: string;
  errorMessage?: string;
}

export interface AlternativeAssignment {
  memberId: string;
  memberName: string;
  fairnessScore: number;
  conflicts: ScheduleConflict[];
  recommendationReason: string;
}

// Emergency and override management
export interface EmergencyOverride {
  id: string;
  familyId: string;
  choreId: string;
  originalAssignee: string;
  newAssignee: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Batch rotation operations
export interface BatchRotationOperation {
  choreIds: string[];
  targetDate?: string;
  forceRebalance: boolean;
  strategy?: RotationStrategy;
  dryRun: boolean;
}

export interface BatchRotationResult {
  success: boolean;
  processedChores: number;
  failedChores: string[];
  warnings: string[];
  fairnessImpact: number; // Change in overall equity score
  results: Record<string, RotationResult>;
}