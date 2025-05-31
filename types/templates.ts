import { ChoreType, ChoreDifficulty } from './index';

// Template Categories for organization
export type TemplateCategory = 
  | 'daily_routines'     // Morning prep, bedtime cleanup
  | 'weekly_maintenance' // Deep cleaning, meal prep
  | 'seasonal_tasks'     // Spring cleaning, holiday prep
  | 'special_events'     // Birthday parties, vacation prep
  | 'family_size'        // Small family, large family specific
  | 'age_specific'       // Toddler, child, teen, adult tasks
  | 'living_situation'   // Apartment, house, rural
  | 'lifestyle';         // Working parents, homeschool, retired

// Age requirements for template usage
export interface AgeRequirement {
  minAge?: number;
  maxAge?: number;
  hasAdultSupervision?: boolean;
  ageGroupTargets?: ('toddler' | 'child' | 'teen' | 'adult' | 'senior')[];
}

// Time slot preferences for template chores
export interface TimeSlot {
  startTime: string;    // HH:MM format (24-hour)
  endTime: string;      // HH:MM format (24-hour)
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  priority: 'preferred' | 'acceptable' | 'avoid';
  description?: string; // Human-readable time description
}

// Individual chore within a template
export interface TemplateChore {
  // Core chore properties
  title: string;
  description: string;
  type: ChoreType;
  difficulty: ChoreDifficulty;
  basePoints: number;
  
  // Scheduling and recurrence
  frequency?: number;              // Days between occurrences (for recurring)
  cooldownHours?: number;          // Cooldown period after completion
  preferredTimeSlots?: TimeSlot[]; // When this chore should ideally be done
  
  // Assignment and dependencies
  dependencies?: number[];         // Indexes of other chores in template that must complete first
  assignmentPreference?: 'any' | 'adult' | 'child' | 'teen' | 'specific_role';
  requiredSkills?: string[];       // Skills needed (e.g., 'driving', 'cooking')
  
  // Customization options
  isOptional?: boolean;            // Family can choose to skip this chore
  canModifyPoints?: boolean;       // Family can adjust point values
  canModifySchedule?: boolean;     // Family can change timing/frequency
  
  // Room and category organization
  room?: string;                   // Room type or specific room name
  category?: string;               // Subcategory for organization
  
  // Special properties
  ageRestrictions?: AgeRequirement;
  seasonalOnly?: ('spring' | 'summer' | 'fall' | 'winter')[];
  estimatedDuration?: number;      // Minutes expected to complete
  
  // Template-specific metadata
  importance: 'low' | 'medium' | 'high' | 'critical'; // How essential this chore is
  customizationNotes?: string;     // Guidance for families customizing
}

// Main template definition
export interface ChoreTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  
  // Template content
  chores: TemplateChore[];
  totalEstimatedTime: number;      // Total minutes per application
  
  // Targeting and compatibility
  targetFamilySize: [number, number]; // [min, max] family members
  ageRequirements?: AgeRequirement;
  livingRequirements?: ('apartment' | 'house' | 'rural' | 'urban')[];
  
  // Organization and discovery
  tags: string[];                  // Keywords for search and filtering
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // Template complexity
  popularity: number;              // Usage count for recommendations
  rating: number;                  // Average user rating (1-5)
  reviewCount: number;             // Number of user reviews
  
  // Attribution and versioning
  createdBy?: string;              // Creator user ID (null for official templates)
  isOfficial: boolean;             // Created by app team vs community
  isPublic: boolean;               // Available for other families to use
  version: number;                 // Version number for updates
  
  // Metadata
  createdAt: string;               // ISO date string
  lastUpdated: string;             // ISO date string
  usageCount: number;              // How many times this template has been applied
  
  // Preview and guidance
  previewImage?: string;           // URL to template preview image
  setupInstructions?: string;      // Guidance for applying this template
  customizationTips?: string[];    // Tips for family-specific modifications
}

// Applied template instance for a specific family
export interface FamilyRoutine {
  id: string;
  familyId: string;
  templateId: string;
  
  // Customization data
  name: string;                    // Family's custom name for this routine
  customizations: TemplateCustomization;
  
  // Active state
  isActive: boolean;
  activeChoreIds: string[];        // Currently active chores from this routine
  
  // Scheduling
  schedule: RoutineSchedule;
  nextApplication?: string;        // ISO date when routine should next be applied
  
  // Performance tracking
  applicationCount: number;        // How many times applied
  lastApplied?: string;           // ISO date of last application
  completionRate: number;         // Average completion rate for this routine
  averageDuration: number;        // Average time to complete routine
  
  // Metadata
  createdAt: string;
  lastModified: string;
  notes?: string;                 // Family notes about this routine
}

// Customizations applied by family to a template
export interface TemplateCustomization {
  // Chore modifications
  choreModifications: ChoreModification[];
  memberAssignmentOverrides: AssignmentOverride[];
  pointAdjustments: PointAdjustment[];
  scheduleOverrides: ScheduleOverride[];
  
  // Additional content
  addedChores?: CustomChore[];     // Custom chores added to template
  removedChores?: number[];        // Template chore indexes to skip
  
  // Global adjustments
  pointMultiplier?: number;        // Global point adjustment (0.5-2.0)
  difficultyAdjustment?: number;   // Global difficulty adjustment (-1 to +1)
  timeAdjustment?: number;         // Global time adjustment multiplier
}

// Individual chore modification within customization
export interface ChoreModification {
  choreIndex: number;              // Index in template chores array
  title?: string;                  // Modified title
  description?: string;            // Modified description
  points?: number;                 // Modified point value
  difficulty?: ChoreDifficulty;    // Modified difficulty
  frequency?: number;              // Modified frequency
  assignTo?: string;               // Specific family member assignment
  preferredTimes?: TimeSlot[];     // Modified time preferences
  isOptional?: boolean;            // Modified optional status
  notes?: string;                  // Family notes about modification
}

// Assignment override for specific family members
export interface AssignmentOverride {
  choreIndex: number;
  assignToMemberId: string;
  assignToMemberName: string;
  reason?: string;                 // Why this specific assignment
  isTemporary?: boolean;           // Override just for next application
}

// Point value adjustments
export interface PointAdjustment {
  choreIndex?: number;             // Specific chore (null for global)
  adjustment: number;              // Point adjustment (+/-)
  reason?: string;                 // Reason for adjustment
  multiplier?: number;             // Alternative: multiplier approach
}

// Schedule override for specific chores
export interface ScheduleOverride {
  choreIndex: number;
  newSchedule: TimeSlot[];
  reason?: string;
  isTemporary?: boolean;
}

// Custom chore added by family to template
export interface CustomChore extends TemplateChore {
  isCustom: true;                  // Flag to identify custom additions
  addedBy: string;                 // Family member who added it
  addedAt: string;                 // When it was added
}

// Routine scheduling configuration
export interface RoutineSchedule {
  type: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'custom';
  
  // For recurring routines
  intervalDays?: number;           // Days between applications
  daysOfWeek?: number[];          // Specific days for weekly routines
  daysOfMonth?: number[];         // Specific days for monthly routines
  
  // Time preferences
  preferredStartTime?: string;     // HH:MM when routine should start
  autoApply?: boolean;            // Automatically create chores on schedule
  
  // Customization
  skipHolidays?: boolean;         // Skip application on holidays
  pauseDuringVacation?: boolean;  // Pause when family is away
  seasonalAdjustments?: SeasonalAdjustment[];
}

// Seasonal adjustments to routine scheduling
export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  frequencyMultiplier?: number;   // Adjust frequency for season
  pointMultiplier?: number;       // Adjust points for season
  addChores?: TemplateChore[];    // Season-specific additional chores
  removeChoreIndexes?: number[];  // Chores to skip during this season
}

// Template application result
export interface TemplateApplicationResult {
  success: boolean;
  choreIds: string[];             // IDs of chores created from template
  routineId?: string;             // ID of family routine created
  errors?: string[];              // Any errors during application
  warnings?: string[];            // Any warnings or notes
  appliedCustomizations: TemplateCustomization;
  summary: {
    choresCreated: number;
    totalPoints: number;
    estimatedTotalTime: number;
    nextApplication?: string;
  };
}

// Bulk operation types
export type BulkOperation = 
  | 'apply_template'
  | 'create_multiple'
  | 'modify_multiple'
  | 'delete_multiple'
  | 'assign_multiple'
  | 'reschedule_multiple';

// Bulk operation request
export interface BulkChoreOperation {
  operation: BulkOperation;
  familyId: string;
  requestedBy: string;
  
  // Operation-specific data
  templateId?: string;             // For apply_template
  choreIds?: string[];            // For modify/delete/assign/reschedule operations
  choreData?: Partial<TemplateChore>[]; // For create_multiple
  modifications?: BulkModification[]; // For modify_multiple
  assignmentData?: BulkAssignment; // For assign_multiple
  scheduleData?: BulkSchedule;     // For reschedule_multiple
  
  // Options
  applyImmediately?: boolean;      // Execute immediately vs queue for later
  notifyMembers?: boolean;         // Send notifications about changes
  reason?: string;                 // Reason for bulk operation
}

// Bulk modification data
export interface BulkModification {
  choreIds: string[];
  changes: Partial<TemplateChore>;
  condition?: 'all' | 'any' | 'none'; // When to apply changes
}

// Bulk assignment data
export interface BulkAssignment {
  assignments: {
    choreIds: string[];
    assignTo: string;
    assignToName: string;
  }[];
  balanceWorkload?: boolean;       // Ensure fair distribution
  respectPreferences?: boolean;    // Consider member preferences
}

// Bulk scheduling data
export interface BulkSchedule {
  scheduleUpdates: {
    choreIds: string[];
    newDueDate?: string;
    newTimeSlots?: TimeSlot[];
    shiftDays?: number;            // Move all due dates by X days
  }[];
  avoidConflicts?: boolean;        // Check calendar conflicts
  maintainSequence?: boolean;      // Maintain relative timing between chores
}

// Template search and filtering
export interface TemplateSearchFilter {
  categories?: TemplateCategory[];
  tags?: string[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  familySize?: [number, number];   // [min, max] range
  ageGroups?: ('toddler' | 'child' | 'teen' | 'adult' | 'senior')[];
  livingSituation?: ('apartment' | 'house' | 'rural' | 'urban')[];
  timeCommitment?: [number, number]; // [min, max] minutes per week
  isOfficial?: boolean;
  minRating?: number;              // Minimum star rating
  searchQuery?: string;            // Text search in name/description
}

// Template recommendation result
export interface TemplateRecommendation {
  template: ChoreTemplate;
  score: number;                   // 0-100 recommendation confidence
  reasons: string[];               // Why this template was recommended
  matchFactors: {
    familySizeMatch: number;       // How well family size matches
    ageGroupMatch: number;         // How well age groups match
    difficultyMatch: number;       // Appropriate difficulty level
    timeCommitmentMatch: number;   // Fits family schedule
    categoryPreference: number;    // Matches family preferences
  };
  customizationSuggestions?: string[]; // Suggestions for family-specific tweaks
}