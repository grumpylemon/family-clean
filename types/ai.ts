/**
 * TypeScript interfaces for AI integration with Enhanced Bulk Operations
 */

import { Chore, Family, FamilyMember } from './index';
import { BulkChoreOperation } from './templates';

// Core AI Request/Response Types
export interface GeminiAIRequest {
  requestId: string;
  familyId: string;
  requestType: 'bulk_operation' | 'suggestion' | 'analysis' | 'optimization';
  prompt: string;
  context: AIRequestContext;
  options: GeminiRequestOptions;
  timestamp: string;
}

export interface AIRequestContext {
  familySize: number;
  memberAges: number[];
  activeChores: ChoreContextData[];
  familyPreferences: FamilyAIPreferences;
  historicalPatterns: FamilyPatternData;
  currentSchedule: FamilyScheduleContext;
}

export interface ChoreContextData {
  id: string;
  title: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  assignedTo: string;
  dueDate: string;
  room?: string;
  category?: string;
  completionRate?: number;
}

export interface GeminiRequestOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  includeReasoningSteps?: boolean;
  requireStructuredOutput?: boolean;
}

export interface GeminiAIResponse {
  requestId: string;
  success: boolean;
  suggestions?: AISuggestion[];
  analysis?: AIAnalysisResult;
  bulkOperation?: EnhancedBulkOperation;
  confidence: number;
  reasoning: string;
  warnings?: string[];
  errors?: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    requestDuration: number;
  };
}

// AI Suggestions and Analysis
export interface AISuggestion {
  id: string;
  type: 'assignment' | 'scheduling' | 'points' | 'optimization' | 'conflict_resolution';
  description: string;
  rationale: string;
  confidence: number;
  expectedImpact: string;
  choreIds: string[];
  modifications: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
}

export interface AIAnalysisResult {
  type: 'conflict_detection' | 'impact_assessment' | 'optimization_analysis';
  summary: string;
  details: Record<string, any>;
  recommendations: string[];
  confidence: number;
  actionRequired: boolean;
}

// Enhanced Bulk Operations with AI
export interface EnhancedBulkOperation extends BulkChoreOperation {
  // AI Integration
  aiAssisted: boolean;
  naturalLanguageRequest?: string;
  aiSuggestions?: AISuggestion[];
  conflictAnalysis?: ConflictAnalysis;
  impactAssessment?: FamilyImpactAssessment;
  
  // Operation Planning
  operationSteps: BulkOperationStep[];
  estimatedDuration: number;
  confidenceScore: number;
  
  // Collaboration
  requiresApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  familyFeedback?: FamilyOperationFeedback[];
}

export interface BulkOperationStep {
  stepNumber: number;
  description: string;
  choreIds: string[];
  operationType: string;
  modifications: Record<string, any>;
  estimatedImpact: number;
  dependsOn?: number[];
}

// Conflict Detection and Resolution
export interface ConflictAnalysis {
  conflicts: OperationConflict[];
  severity: 'none' | 'minor' | 'major' | 'blocking';
  autoResolutionAvailable: boolean;
  suggestedResolutions: ConflictResolution[];
}

export interface OperationConflict {
  type: 'schedule' | 'workload' | 'skill' | 'resource' | 'dependency';
  choreIds: string[];
  memberIds?: string[];
  description: string;
  severity: 'minor' | 'major' | 'blocking';
  autoFixable: boolean;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: 'reschedule' | 'reassign' | 'split_workload' | 'adjust_requirements' | 'seek_approval';
  description: string;
  modifications: Record<string, any>;
  confidence: number;
}

// Family Impact Analysis
export interface FamilyImpactAssessment {
  memberImpacts: MemberImpact[];
  workloadChanges: WorkloadChange[];
  scheduleChanges: ScheduleChange[];
  difficultyAdjustments: DifficultyAdjustment[];
  overallScore: number;
  recommendations: string[];
}

export interface MemberImpact {
  memberId: string;
  memberName: string;
  currentWorkload: number;
  newWorkload: number;
  workloadChange: number;
  scheduleConflicts: number;
  skillMismatches: number;
  impact: 'positive' | 'neutral' | 'negative';
  concerns: string[];
}

export interface WorkloadChange {
  memberId: string;
  currentChoreCount: number;
  newChoreCount: number;
  currentPoints: number;
  newPoints: number;
  changePercentage: number;
}

export interface ScheduleChange {
  memberId: string;
  conflictingTimeSlots: string[];
  overlapCount: number;
  suggestedAdjustments: string[];
}

export interface DifficultyAdjustment {
  memberId: string;
  inappropriateAssignments: string[];
  skillMismatches: { choreId: string; reason: string }[];
  recommendations: string[];
}

// Family AI Preferences and Patterns
export interface FamilyAIPreferences {
  enabledFeatures: AIFeature[];
  suggestionFrequency: 'none' | 'minimal' | 'normal' | 'frequent';
  autoApprovalThreshold: number;
  languageStyle: 'formal' | 'casual' | 'family_friendly';
  conflictSensitivity: 'low' | 'medium' | 'high';
  privacyLevel: 'basic' | 'standard' | 'strict';
  customInstructions?: string;
}

export type AIFeature = 
  | 'natural_language_operations'
  | 'smart_suggestions'
  | 'conflict_detection'
  | 'impact_analysis'
  | 'optimization_recommendations'
  | 'seasonal_adjustments';

export interface FamilyPatternData {
  completionPatterns: CompletionPattern[];
  preferredAssignments: PreferredAssignment[];
  timePreferences: TimePreference[];
  seasonalAdjustments: SeasonalAdjustment[];
  successfulOperations: SuccessfulOperation[];
}

export interface CompletionPattern {
  memberId: string;
  choreType: string;
  averageCompletionTime: number;
  completionRate: number;
  preferredDays: number[];
  preferredTimeSlots: string[];
}

export interface PreferredAssignment {
  memberId: string;
  choreTypes: string[];
  rooms: string[];
  difficulties: string[];
  satisfactionScore: number;
}

export interface TimePreference {
  memberId: string;
  preferredDays: number[];
  preferredHours: number[];
  avoidancePatterns: string[];
}

export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  choreAdjustments: Record<string, any>;
  workloadChanges: Record<string, number>;
  lastApplied: string;
}

export interface SuccessfulOperation {
  operationType: string;
  parameters: Record<string, any>;
  satisfactionScore: number;
  completionImprovement: number;
  familyFeedback: string[];
  timestamp: string;
}

// Family Schedule Context
export interface FamilyScheduleContext {
  currentWeek: WeekSchedule;
  upcomingEvents: FamilyEvent[];
  memberAvailability: MemberAvailability[];
  recurringCommitments: RecurringCommitment[];
}

export interface WeekSchedule {
  weekStart: string;
  dailySchedules: DailySchedule[];
}

export interface DailySchedule {
  date: string;
  memberSchedules: MemberDailySchedule[];
}

export interface MemberDailySchedule {
  memberId: string;
  busyPeriods: TimePeriod[];
  availablePeriods: TimePeriod[];
  choreAssignments: ChoreAssignment[];
}

export interface TimePeriod {
  startTime: string;
  endTime: string;
  type: 'busy' | 'available' | 'preferred';
  description?: string;
}

export interface ChoreAssignment {
  choreId: string;
  scheduledTime?: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
}

export interface FamilyEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  affectedMembers: string[];
  impactsChores: boolean;
}

export interface MemberAvailability {
  memberId: string;
  weeklyAvailability: WeeklyAvailability;
  temporaryUnavailability: UnavailabilityPeriod[];
}

export interface WeeklyAvailability {
  [dayOfWeek: number]: DayAvailability;
}

export interface DayAvailability {
  availableHours: TimePeriod[];
  preferredHours: TimePeriod[];
  unavailableHours: TimePeriod[];
}

export interface UnavailabilityPeriod {
  startDate: string;
  endDate: string;
  reason: string;
  affectsChores: boolean;
}

export interface RecurringCommitment {
  id: string;
  title: string;
  memberId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  priority: 'low' | 'medium' | 'high';
}

// Operation History and Feedback
export interface FamilyOperationFeedback {
  memberId: string;
  memberName: string;
  rating: number; // 1-5
  comment?: string;
  issues?: string[];
  suggestions?: string[];
  timestamp: string;
}

// Rate Limiting and Usage Tracking
export interface AIUsageTracker {
  familyId: string;
  date: string;
  requestCount: number;
  requestTypes: Record<string, number>;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  costEstimate: number;
  rateLimitHits: number;
  lastRequest: string;
}

// Natural Language Processing
export interface NLPParseResult {
  intent: BulkOperationIntent;
  entities: NLPEntity[];
  confidence: number;
  ambiguities: string[];
  clarificationNeeded: boolean;
  suggestedOperation: Partial<EnhancedBulkOperation>;
}

export interface BulkOperationIntent {
  type: 'modify' | 'assign' | 'reschedule' | 'delete' | 'create' | 'optimize';
  scope: 'all' | 'selected' | 'filtered' | 'specific';
  target: string[];
  modifiers: Record<string, any>;
}

export interface NLPEntity {
  type: 'member' | 'chore_type' | 'room' | 'time' | 'difficulty' | 'points' | 'category';
  value: string;
  confidence: number;
  position: [number, number];
}

// Error Handling and Fallbacks
export interface AIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  fallbackSuggestion?: string;
  retryable: boolean;
  timestamp: string;
}

export type AIErrorCode = 
  | 'API_KEY_INVALID'
  | 'RATE_LIMIT_EXCEEDED'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_INPUT'
  | 'SERVICE_UNAVAILABLE'
  | 'INSUFFICIENT_CONTEXT'
  | 'PARSING_FAILED'
  | 'SAFETY_VIOLATION';