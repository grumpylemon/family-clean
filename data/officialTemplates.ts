import { ChoreTemplate, TemplateChore, TimeSlot } from '../types/templates';

// Common time slots
const MORNING_SLOTS: TimeSlot[] = [
  { startTime: '06:00', endTime: '09:00', daysOfWeek: [1, 2, 3, 4, 5], priority: 'preferred', description: 'Weekday mornings' },
  { startTime: '07:00', endTime: '10:00', daysOfWeek: [0, 6], priority: 'preferred', description: 'Weekend mornings' }
];

const EVENING_SLOTS: TimeSlot[] = [
  { startTime: '17:00', endTime: '20:00', daysOfWeek: [1, 2, 3, 4, 5], priority: 'preferred', description: 'Weekday evenings' },
  { startTime: '16:00', endTime: '19:00', daysOfWeek: [0, 6], priority: 'preferred', description: 'Weekend evenings' }
];

const WEEKEND_SLOTS: TimeSlot[] = [
  { startTime: '09:00', endTime: '12:00', daysOfWeek: [0, 6], priority: 'preferred', description: 'Weekend mornings' },
  { startTime: '13:00', endTime: '17:00', daysOfWeek: [0, 6], priority: 'acceptable', description: 'Weekend afternoons' }
];

/**
 * Official template library - these will be pre-loaded into the system
 */
export const OFFICIAL_TEMPLATES: Omit<ChoreTemplate, 'id' | 'createdAt' | 'lastUpdated' | 'usageCount' | 'popularity' | 'rating' | 'reviewCount'>[] = [
  
  // Daily Routines Templates
  {
    name: 'Morning Family Prep',
    description: 'Essential morning tasks to get the family ready for the day. Perfect for busy weekday mornings.',
    category: 'daily_routines',
    chores: [
      {
        title: 'Make Beds',
        description: 'Make all beds in the house',
        type: 'individual',
        difficulty: 'easy',
        basePoints: 5,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 10,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bedroom',
        category: 'organization'
      },
      {
        title: 'Breakfast Cleanup',
        description: 'Clear breakfast dishes and wipe down kitchen surfaces',
        type: 'family',
        difficulty: 'easy',
        basePoints: 8,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 15,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'kitchen',
        category: 'cleaning'
      },
      {
        title: 'Pack School/Work Items',
        description: 'Ensure backpacks, lunch boxes, and work items are ready',
        type: 'individual',
        difficulty: 'easy',
        basePoints: 3,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 5,
        importance: 'critical',
        canModifyPoints: true,
        canModifySchedule: false,
        category: 'preparation'
      },
      {
        title: 'Quick Living Room Tidy',
        description: 'Put away items and fluff couch cushions',
        type: 'family',
        difficulty: 'easy',
        basePoints: 5,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 10,
        importance: 'low',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'living_room',
        category: 'organization'
      }
    ],
    totalEstimatedTime: 40,
    targetFamilySize: [2, 8],
    ageRequirements: {
      minAge: 5,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    tags: ['morning', 'daily', 'quick', 'family', 'routine', 'school', 'work'],
    difficulty: 'beginner',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'This template creates a simple morning routine that takes about 40 minutes total. Assign tasks based on family member ages and capabilities.',
    customizationTips: [
      'Adjust timing based on your family\'s morning schedule',
      'Add or remove tasks based on your home layout',
      'Consider increasing points for consistently completed tasks'
    ]
  },

  {
    name: 'Evening Wind-Down Routine',
    description: 'Peaceful evening tasks to prepare the home for the next day. Promotes family relaxation and organization.',
    category: 'daily_routines',
    chores: [
      {
        title: 'Dinner Cleanup',
        description: 'Clear table, load dishwasher, and wipe down surfaces',
        type: 'family',
        difficulty: 'medium',
        basePoints: 12,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 20,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'kitchen',
        category: 'cleaning'
      },
      {
        title: 'Prep Tomorrow\'s Clothes',
        description: 'Lay out clothes for tomorrow and check weather',
        type: 'individual',
        difficulty: 'easy',
        basePoints: 4,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 10,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bedroom',
        category: 'preparation'
      },
      {
        title: '10-Minute Pickup',
        description: 'Family pickup time - everyone tidies their assigned area',
        type: 'family',
        difficulty: 'easy',
        basePoints: 6,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 10,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        category: 'organization'
      },
      {
        title: 'Take Out Trash',
        description: 'Empty trash cans and prepare for pickup if scheduled',
        type: 'family',
        difficulty: 'easy',
        basePoints: 5,
        assignmentPreference: 'teen',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 10,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'all',
        category: 'maintenance'
      }
    ],
    totalEstimatedTime: 50,
    targetFamilySize: [2, 6],
    ageRequirements: {
      minAge: 4,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    tags: ['evening', 'daily', 'relaxing', 'preparation', 'family', 'routine'],
    difficulty: 'beginner',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Evening routine designed to prepare for the next day while maintaining a calm atmosphere. Perfect for families with school-age children.',
    customizationTips: [
      'Adjust dinner cleanup based on your typical dinner time',
      'Add bath time preparation for families with young children',
      'Include homework organization for school families'
    ]
  },

  // Weekly Maintenance Templates
  {
    name: 'Weekend Deep Clean',
    description: 'Comprehensive weekly cleaning routine to maintain a healthy, organized home. Designed for weekend completion.',
    category: 'weekly_maintenance',
    chores: [
      {
        title: 'Vacuum All Floors',
        description: 'Vacuum carpets and rugs throughout the house',
        type: 'family',
        difficulty: 'medium',
        basePoints: 20,
        assignmentPreference: 'teen',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 45,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'all',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Clean Bathrooms',
        description: 'Deep clean all bathroom surfaces, mirrors, and floors',
        type: 'family',
        difficulty: 'hard',
        basePoints: 25,
        assignmentPreference: 'adult',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 60,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bathroom',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Dust Furniture',
        description: 'Dust all furniture surfaces and decorative items',
        type: 'family',
        difficulty: 'medium',
        basePoints: 15,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 30,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'all',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Change Bed Sheets',
        description: 'Change and wash all bed linens',
        type: 'individual',
        difficulty: 'medium',
        basePoints: 10,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 20,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bedroom',
        category: 'maintenance',
        frequency: 7
      },
      {
        title: 'Kitchen Deep Clean',
        description: 'Clean appliances, organize pantry, and deep clean surfaces',
        type: 'family',
        difficulty: 'hard',
        basePoints: 30,
        assignmentPreference: 'adult',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 75,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'kitchen',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Organize Common Areas',
        description: 'Declutter and organize living spaces',
        type: 'family',
        difficulty: 'medium',
        basePoints: 18,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 40,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'living_room',
        category: 'organization',
        frequency: 7
      }
    ],
    totalEstimatedTime: 270, // 4.5 hours total
    targetFamilySize: [3, 8],
    ageRequirements: {
      minAge: 8,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    tags: ['weekend', 'deep_clean', 'weekly', 'maintenance', 'comprehensive', 'family'],
    difficulty: 'intermediate',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Comprehensive weekly cleaning that can be spread across the weekend. Assign tasks based on difficulty and family member capabilities.',
    customizationTips: [
      'Split tasks across Saturday and Sunday if needed',
      'Adjust cleaning frequency based on household size and activity',
      'Consider seasonal additions like window cleaning'
    ]
  },

  {
    name: 'Quick Weekly Maintenance',
    description: 'Essential weekly tasks for busy families. Maintains cleanliness without overwhelming schedules.',
    category: 'weekly_maintenance',
    chores: [
      {
        title: 'Quick Vacuum High-Traffic Areas',
        description: 'Vacuum main living areas and entryways',
        type: 'family',
        difficulty: 'easy',
        basePoints: 12,
        assignmentPreference: 'teen',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 20,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'living_room',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Bathroom Quick Clean',
        description: 'Clean toilets, sinks, and mirrors',
        type: 'family',
        difficulty: 'medium',
        basePoints: 15,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 25,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bathroom',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Kitchen Appliance Wipe-Down',
        description: 'Clean microwave, stovetop, and appliance surfaces',
        type: 'family',
        difficulty: 'medium',
        basePoints: 10,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 15,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'kitchen',
        category: 'cleaning',
        frequency: 7
      },
      {
        title: 'Laundry Catch-Up',
        description: 'Wash, dry, and fold one load of laundry',
        type: 'family',
        difficulty: 'easy',
        basePoints: 8,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 30,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'laundry',
        category: 'maintenance',
        frequency: 7
      }
    ],
    totalEstimatedTime: 90,
    targetFamilySize: [2, 6],
    ageRequirements: {
      minAge: 6,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    tags: ['weekly', 'quick', 'essential', 'busy_family', 'maintenance'],
    difficulty: 'beginner',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Light weekly maintenance perfect for busy families. Can be completed in about 90 minutes total.',
    customizationTips: [
      'Perfect for families with limited weekend time',
      'Can be split into smaller daily tasks if preferred',
      'Add seasonal tasks as needed'
    ]
  },

  // Seasonal Templates
  {
    name: 'Spring Cleaning Kickoff',
    description: 'Comprehensive spring cleaning to refresh your home after winter. Includes deep cleaning and organization.',
    category: 'seasonal_tasks',
    chores: [
      {
        title: 'Deep Clean Windows',
        description: 'Clean interior and exterior windows and window sills',
        type: 'family',
        difficulty: 'hard',
        basePoints: 25,
        assignmentPreference: 'adult',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 90,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'all',
        category: 'cleaning',
        seasonalOnly: ['spring']
      },
      {
        title: 'Organize Closets',
        description: 'Sort through clothes, donate unused items, organize by season',
        type: 'individual',
        difficulty: 'medium',
        basePoints: 20,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 60,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bedroom',
        category: 'organization',
        seasonalOnly: ['spring']
      },
      {
        title: 'Garden Prep',
        description: 'Prepare garden beds, plant flowers, clean outdoor furniture',
        type: 'family',
        difficulty: 'medium',
        basePoints: 30,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 120,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'outdoor',
        category: 'seasonal',
        seasonalOnly: ['spring'],
        isOptional: true
      },
      {
        title: 'Deep Clean Baseboards',
        description: 'Vacuum and wipe down all baseboards throughout the house',
        type: 'family',
        difficulty: 'medium',
        basePoints: 15,
        assignmentPreference: 'teen',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 45,
        importance: 'low',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'all',
        category: 'cleaning',
        seasonalOnly: ['spring']
      },
      {
        title: 'Organize Garage/Storage',
        description: 'Sort through storage areas, donate unused items, organize remaining items',
        type: 'family',
        difficulty: 'hard',
        basePoints: 35,
        assignmentPreference: 'adult',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 180,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'garage',
        category: 'organization',
        seasonalOnly: ['spring'],
        isOptional: true
      }
    ],
    totalEstimatedTime: 495, // 8+ hours - meant to be spread over multiple weekends
    targetFamilySize: [2, 8],
    ageRequirements: {
      minAge: 8,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    tags: ['spring', 'seasonal', 'deep_clean', 'organization', 'comprehensive', 'declutter'],
    difficulty: 'advanced',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Major spring cleaning project designed to be completed over 2-3 weekends. Focus on deep cleaning and organization.',
    customizationTips: [
      'Spread tasks over multiple weekends to avoid overwhelm',
      'Make garden tasks optional for families without outdoor space',
      'Add basement or attic organization if applicable'
    ]
  },

  // Family Size Specific Templates
  {
    name: 'Small Family Daily Routine',
    description: 'Streamlined daily routine perfect for couples or small families. Efficient and manageable.',
    category: 'family_size',
    chores: [
      {
        title: 'Kitchen Reset',
        description: 'Clean dishes, wipe counters, quick floor sweep',
        type: 'family',
        difficulty: 'easy',
        basePoints: 10,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 15,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'kitchen',
        category: 'cleaning'
      },
      {
        title: 'Living Space Tidy',
        description: 'Quick pickup of living room and entryway',
        type: 'family',
        difficulty: 'easy',
        basePoints: 5,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 10,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'living_room',
        category: 'organization'
      },
      {
        title: 'Bedroom Maintenance',
        description: 'Make bed, put away clothes, general tidying',
        type: 'individual',
        difficulty: 'easy',
        basePoints: 4,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 8,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'bedroom',
        category: 'organization'
      }
    ],
    totalEstimatedTime: 33,
    targetFamilySize: [1, 3],
    ageRequirements: {
      minAge: 16,
      ageGroupTargets: ['teen', 'adult']
    },
    tags: ['small_family', 'couple', 'efficient', 'daily', 'minimal', 'quick'],
    difficulty: 'beginner',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Minimal daily routine perfect for busy couples or small households. Takes about 30 minutes total.',
    customizationTips: [
      'Perfect for apartments or smaller living spaces',
      'Scale up by adding tasks as needed',
      'Great foundation for building larger routines'
    ]
  },

  {
    name: 'Large Family Coordination',
    description: 'Comprehensive routine designed for large families. Emphasizes teamwork and fair distribution.',
    category: 'family_size',
    chores: [
      {
        title: 'Morning Kitchen Prep Team',
        description: 'Two-person breakfast prep and cleanup',
        type: 'family',
        difficulty: 'medium',
        basePoints: 12,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 25,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'kitchen',
        category: 'cleaning'
      },
      {
        title: 'Bathroom Queue Management',
        description: 'Organize bathroom schedule and quick cleanup after use',
        type: 'individual',
        difficulty: 'easy',
        basePoints: 3,
        assignmentPreference: 'any',
        preferredTimeSlots: MORNING_SLOTS,
        estimatedDuration: 5,
        importance: 'critical',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'bathroom',
        category: 'organization'
      },
      {
        title: 'Common Area Team Pickup',
        description: 'Each person responsible for specific area - 15 minute family pickup',
        type: 'family',
        difficulty: 'easy',
        basePoints: 8,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 15,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'all',
        category: 'organization'
      },
      {
        title: 'Laundry Station Management',
        description: 'Sort, start, and manage ongoing laundry loads',
        type: 'family',
        difficulty: 'medium',
        basePoints: 10,
        assignmentPreference: 'teen',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 20,
        importance: 'medium',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'laundry',
        category: 'maintenance'
      },
      {
        title: 'Meal Prep Team',
        description: 'Coordinate dinner prep with multiple helpers',
        type: 'family',
        difficulty: 'medium',
        basePoints: 15,
        assignmentPreference: 'any',
        preferredTimeSlots: EVENING_SLOTS,
        estimatedDuration: 30,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'kitchen',
        category: 'preparation'
      }
    ],
    totalEstimatedTime: 95,
    targetFamilySize: [5, 10],
    ageRequirements: {
      minAge: 6,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    tags: ['large_family', 'teamwork', 'coordination', 'efficient', 'organized', 'daily'],
    difficulty: 'intermediate',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Team-based routine for large families. Emphasizes coordination and shared responsibility.',
    customizationTips: [
      'Assign specific areas to each family member',
      'Rotate team assignments weekly for fairness',
      'Consider age-appropriate task modifications'
    ]
  },

  // Lifestyle-Specific Templates
  {
    name: 'Working Parents Efficiency',
    description: 'Time-optimized routine for busy working parents. Focuses on essential tasks and weekend batch work.',
    category: 'lifestyle',
    chores: [
      {
        title: 'Sunday Meal Prep',
        description: 'Prepare meals for the week ahead',
        type: 'family',
        difficulty: 'medium',
        basePoints: 25,
        assignmentPreference: 'adult',
        preferredTimeSlots: [{ startTime: '10:00', endTime: '14:00', daysOfWeek: [0], priority: 'preferred', description: 'Sunday meal prep' }],
        estimatedDuration: 120,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'kitchen',
        category: 'preparation',
        frequency: 7
      },
      {
        title: 'Weeknight Quick Clean',
        description: '15-minute family cleanup after dinner',
        type: 'family',
        difficulty: 'easy',
        basePoints: 8,
        assignmentPreference: 'any',
        preferredTimeSlots: [{ startTime: '19:00', endTime: '20:00', daysOfWeek: [1, 2, 3, 4, 5], priority: 'preferred', description: 'After dinner cleanup' }],
        estimatedDuration: 15,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'all',
        category: 'cleaning'
      },
      {
        title: 'Weekend Laundry Batch',
        description: 'Process all family laundry on weekends',
        type: 'family',
        difficulty: 'medium',
        basePoints: 15,
        assignmentPreference: 'any',
        preferredTimeSlots: WEEKEND_SLOTS,
        estimatedDuration: 45,
        importance: 'high',
        canModifyPoints: true,
        canModifySchedule: true,
        room: 'laundry',
        category: 'maintenance',
        frequency: 7
      },
      {
        title: 'Morning Launch Prep',
        description: 'Get family ready for work/school efficiently',
        type: 'family',
        difficulty: 'easy',
        basePoints: 10,
        assignmentPreference: 'adult',
        preferredTimeSlots: [{ startTime: '06:30', endTime: '08:00', daysOfWeek: [1, 2, 3, 4, 5], priority: 'preferred', description: 'Morning rush prep' }],
        estimatedDuration: 20,
        importance: 'critical',
        canModifyPoints: true,
        canModifySchedule: false,
        room: 'all',
        category: 'preparation'
      }
    ],
    totalEstimatedTime: 200,
    targetFamilySize: [3, 6],
    ageRequirements: {
      minAge: 5,
      ageGroupTargets: ['child', 'teen', 'adult']
    },
    livingRequirements: ['apartment', 'house', 'urban'],
    tags: ['working_parents', 'efficient', 'time_saving', 'batch_work', 'weekends', 'busy'],
    difficulty: 'intermediate',
    isOfficial: true,
    isPublic: true,
    version: 1,
    setupInstructions: 'Designed for dual-career families with limited weekday time. Batches major tasks on weekends.',
    customizationTips: [
      'Adjust meal prep based on family dietary needs',
      'Consider hiring help for deep cleaning tasks',
      'Use slow cooker meals for weeknight efficiency'
    ]
  }
];

/**
 * Function to get official templates for seeding the database
 */
export function getOfficialTemplatesForSeeding(): Omit<ChoreTemplate, 'id'>[] {
  const now = new Date().toISOString();
  
  return OFFICIAL_TEMPLATES.map(template => ({
    ...template,
    createdBy: 'system',
    createdAt: now,
    lastUpdated: now,
    usageCount: 0,
    popularity: Math.floor(Math.random() * 50) + 10, // Random initial popularity for variety
    rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // Random rating between 3.5-5.0
    reviewCount: Math.floor(Math.random() * 20) + 5 // Random review count for realism
  }));
}