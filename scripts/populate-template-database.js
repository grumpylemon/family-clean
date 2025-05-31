#!/usr/bin/env node

/**
 * Populate Template Database Script
 * 
 * This script populates the choreTemplates collection with standard
 * household routine templates for the Family Compass app.
 * 
 * Usage: node scripts/populate-template-database.js
 */

// Import required Firebase modules
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  getDocs,
  query,
  where
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Load environment variables from .env file
require('dotenv').config();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Standard household chore templates
const templates = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Essential morning tasks to start the day organized and fresh',
    category: 'daily_routines',
    difficulty: 'beginner',
    isOfficial: true,
    popularity: 95,
    rating: 4.8,
    targetFamilySize: [2, 6],
    totalEstimatedTime: 25,
    tags: ['morning', 'daily', 'bedroom', 'personal'],
    chores: [
      {
        title: 'Make Your Bed',
        description: 'Straighten sheets, fluff pillows, and arrange bedding neatly',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 5,
        estimatedDuration: 3,
        frequency: 1,
        cooldownHours: 20
      },
      {
        title: 'Tidy Bedroom',
        description: 'Put clothes away, clear nightstand, and straighten room',
        type: 'cleaning',
        difficulty: 'easy', 
        basePoints: 8,
        estimatedDuration: 10,
        frequency: 1,
        cooldownHours: 20
      },
      {
        title: 'Personal Hygiene',
        description: 'Brush teeth, wash face, and get ready for the day',
        type: 'personal_care',
        difficulty: 'easy',
        basePoints: 3,
        estimatedDuration: 12,
        frequency: 1,
        cooldownHours: 20
      }
    ],
    setupInstructions: 'Best used as a daily routine for family members. Assign to different people or rotate weekly.',
    customizationTips: [
      'Add specific times for each task',
      'Customize points based on age and ability',
      'Consider adding music or timers for motivation'
    ]
  },

  {
    id: 'kitchen-cleanup',
    name: 'Kitchen Deep Clean',
    description: 'Comprehensive kitchen cleaning and organization routine',
    category: 'weekly_maintenance',
    difficulty: 'intermediate',
    isOfficial: true,
    popularity: 88,
    rating: 4.6,
    targetFamilySize: [3, 8],
    totalEstimatedTime: 45,
    tags: ['kitchen', 'cleaning', 'weekly', 'appliances'],
    chores: [
      {
        title: 'Empty Dishwasher',
        description: 'Unload clean dishes and put them away in proper places',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 10,
        estimatedDuration: 8,
        frequency: 1,
        cooldownHours: 12
      },
      {
        title: 'Wipe Down Counters',
        description: 'Clean and disinfect all kitchen countertops and surfaces',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 8,
        estimatedDuration: 10,
        frequency: 1,
        cooldownHours: 24
      },
      {
        title: 'Clean Kitchen Table',
        description: 'Clear, wipe, and sanitize the dining/kitchen table',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 6,
        estimatedDuration: 5,
        frequency: 1,
        cooldownHours: 12
      },
      {
        title: 'Sweep Kitchen Floor',
        description: 'Sweep up crumbs and debris from kitchen floor',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 8,
        estimatedDuration: 7,
        frequency: 1,
        cooldownHours: 24
      },
      {
        title: 'Take Out Trash',
        description: 'Empty kitchen trash and replace with new liner',
        type: 'maintenance',
        difficulty: 'easy',
        basePoints: 5,
        estimatedDuration: 5,
        frequency: 2,
        cooldownHours: 48
      },
      {
        title: 'Wipe Appliances',
        description: 'Clean exterior of microwave, toaster, and coffee maker',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 12,
        estimatedDuration: 10,
        frequency: 7,
        cooldownHours: 168
      }
    ],
    setupInstructions: 'Ideal for weekly deep cleaning or after family meals. Can be split among family members.',
    customizationTips: [
      'Break into smaller daily tasks',
      'Assign specific appliances to different people',
      'Add seasonal deep cleaning tasks'
    ]
  },

  {
    id: 'bathroom-maintenance',
    name: 'Bathroom Weekly Clean',
    description: 'Complete bathroom cleaning and maintenance routine',
    category: 'weekly_maintenance',
    difficulty: 'intermediate',
    isOfficial: true,
    popularity: 82,
    rating: 4.4,
    targetFamilySize: [2, 6],
    totalEstimatedTime: 35,
    tags: ['bathroom', 'cleaning', 'weekly', 'hygiene'],
    chores: [
      {
        title: 'Clean Toilet',
        description: 'Scrub toilet bowl, wipe seat, and clean exterior',
        type: 'cleaning',
        difficulty: 'medium',
        basePoints: 15,
        estimatedDuration: 10,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Wipe Mirror and Sink',
        description: 'Clean bathroom mirror and wipe down sink area',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 8,
        estimatedDuration: 8,
        frequency: 3,
        cooldownHours: 72
      },
      {
        title: 'Sweep and Mop Floor',
        description: 'Sweep up hair and debris, then mop bathroom floor',
        type: 'cleaning',
        difficulty: 'medium',
        basePoints: 12,
        estimatedDuration: 12,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Restock Supplies',
        description: 'Check and refill toilet paper, soap, and towels',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 5,
        estimatedDuration: 5,
        frequency: 7,
        cooldownHours: 168
      }
    ],
    setupInstructions: 'Best as a weekly routine. Different family members can take turns.',
    customizationTips: [
      'Add shower/tub cleaning for full maintenance',
      'Create supply checklists',
      'Consider daily quick-clean tasks'
    ]
  },

  {
    id: 'living-room-tidy',
    name: 'Living Room Organization',
    description: 'Daily living room tidying and organization',
    category: 'daily_routines',
    difficulty: 'beginner',
    isOfficial: true,
    popularity: 75,
    rating: 4.3,
    targetFamilySize: [2, 8],
    totalEstimatedTime: 20,
    tags: ['living room', 'organization', 'daily', 'family'],
    chores: [
      {
        title: 'Pick Up Clutter',
        description: 'Return items to their proper places and clear surfaces',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 8,
        estimatedDuration: 10,
        frequency: 1,
        cooldownHours: 24
      },
      {
        title: 'Fluff Couch Cushions',
        description: 'Arrange and fluff sofa cushions and throw pillows',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 3,
        estimatedDuration: 3,
        frequency: 1,
        cooldownHours: 24
      },
      {
        title: 'Quick Vacuum',
        description: 'Vacuum main traffic areas and visible debris',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 10,
        estimatedDuration: 7,
        frequency: 2,
        cooldownHours: 48
      }
    ],
    setupInstructions: 'Perfect for daily family room maintenance. Can be done by anyone.',
    customizationTips: [
      'Add dusting for weekly version',
      'Include toy organization for families with children',
      'Add electronics organization'
    ]
  },

  {
    id: 'bedroom-weekly',
    name: 'Bedroom Deep Clean',
    description: 'Weekly bedroom cleaning and organization',
    category: 'weekly_maintenance',
    difficulty: 'intermediate',
    isOfficial: true,
    popularity: 70,
    rating: 4.2,
    targetFamilySize: [1, 6],
    totalEstimatedTime: 40,
    tags: ['bedroom', 'weekly', 'cleaning', 'organization'],
    chores: [
      {
        title: 'Change Bed Sheets',
        description: 'Remove old sheets and put on fresh, clean bedding',
        type: 'cleaning',
        difficulty: 'medium',
        basePoints: 15,
        estimatedDuration: 15,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Vacuum Floor',
        description: 'Vacuum carpet or sweep/mop hard floors thoroughly',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 12,
        estimatedDuration: 10,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Dust Surfaces',
        description: 'Dust nightstands, dresser, and other bedroom furniture',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 10,
        estimatedDuration: 10,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Organize Closet',
        description: 'Straighten clothes, shoes, and closet organization',
        type: 'organization',
        difficulty: 'medium',
        basePoints: 12,
        estimatedDuration: 15,
        frequency: 7,
        cooldownHours: 168
      }
    ],
    setupInstructions: 'Ideal weekly routine for personal bedrooms. Each person maintains their own space.',
    customizationTips: [
      'Add seasonal clothing rotation',
      'Include under-bed cleaning',
      'Create clothing donation pile'
    ]
  },

  {
    id: 'meal-prep-sunday',
    name: 'Meal Prep Sunday',
    description: 'Weekly meal planning and preparation routine',
    category: 'lifestyle',
    difficulty: 'advanced',
    isOfficial: true,
    popularity: 68,
    rating: 4.5,
    targetFamilySize: [3, 8],
    totalEstimatedTime: 120,
    tags: ['meal prep', 'weekly', 'kitchen', 'planning'],
    chores: [
      {
        title: 'Plan Weekly Meals',
        description: 'Create meal plan for the week and make grocery list',
        type: 'planning',
        difficulty: 'medium',
        basePoints: 20,
        estimatedDuration: 30,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Grocery Shopping',
        description: 'Shop for all planned meals and household essentials',
        type: 'errands',
        difficulty: 'medium',
        basePoints: 25,
        estimatedDuration: 60,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Prep Ingredients',
        description: 'Wash, chop, and prepare ingredients for easy cooking',
        type: 'cooking',
        difficulty: 'medium',
        basePoints: 20,
        estimatedDuration: 30,
        frequency: 7,
        cooldownHours: 168
      }
    ],
    setupInstructions: 'Best for families who want to streamline weeknight cooking. Can involve multiple family members.',
    customizationTips: [
      'Include batch cooking of staples',
      'Add freezer meal preparation',
      'Create themed meal nights'
    ]
  },

  {
    id: 'quick-daily-pickup',
    name: '15-Minute House Pickup',
    description: 'Quick daily house-wide tidying routine',
    category: 'daily_routines',
    difficulty: 'beginner',
    isOfficial: true,
    popularity: 85,
    rating: 4.7,
    targetFamilySize: [2, 8],
    totalEstimatedTime: 15,
    tags: ['daily', 'quick', 'whole house', 'family'],
    chores: [
      {
        title: 'Living Areas Pickup',
        description: 'Quick tidy of living room, dining room, and common areas',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 8,
        estimatedDuration: 5,
        frequency: 1,
        cooldownHours: 24
      },
      {
        title: 'Kitchen Quick Clean',
        description: 'Load dishwasher, wipe counters, and put items away',
        type: 'cleaning',
        difficulty: 'easy',
        basePoints: 10,
        estimatedDuration: 7,
        frequency: 1,
        cooldownHours: 24
      },
      {
        title: 'Shoe and Coat Organization',
        description: 'Organize entryway shoes, coats, and bags',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 3,
        estimatedDuration: 3,
        frequency: 1,
        cooldownHours: 24
      }
    ],
    setupInstructions: 'Perfect family activity before dinner or bedtime. Everyone participates for 15 minutes.',
    customizationTips: [
      'Set a timer and make it a game',
      'Play upbeat music during cleanup',
      'Rotate room assignments'
    ]
  },

  {
    id: 'deep-clean-weekend',
    name: 'Weekend Deep Clean',
    description: 'Intensive weekend cleaning for the whole house',
    category: 'weekly_maintenance',
    difficulty: 'advanced',
    isOfficial: true,
    popularity: 60,
    rating: 4.1,
    targetFamilySize: [3, 8],
    totalEstimatedTime: 180,
    tags: ['weekend', 'deep clean', 'whole house', 'intensive'],
    chores: [
      {
        title: 'Deep Clean Bathrooms',
        description: 'Scrub shower, toilet, sink, and mop floors thoroughly',
        type: 'cleaning',
        difficulty: 'hard',
        basePoints: 30,
        estimatedDuration: 45,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Kitchen Deep Clean',
        description: 'Clean appliances inside and out, scrub sink, organize pantry',
        type: 'cleaning',
        difficulty: 'hard',
        basePoints: 35,
        estimatedDuration: 60,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Vacuum and Mop All Floors',
        description: 'Thoroughly vacuum carpets and mop all hard floors',
        type: 'cleaning',
        difficulty: 'medium',
        basePoints: 25,
        estimatedDuration: 40,
        frequency: 7,
        cooldownHours: 168
      },
      {
        title: 'Dust All Surfaces',
        description: 'Dust furniture, electronics, and decorative items throughout house',
        type: 'cleaning',
        difficulty: 'medium',
        basePoints: 20,
        estimatedDuration: 35,
        frequency: 7,
        cooldownHours: 168
      }
    ],
    setupInstructions: 'Divide tasks among family members. Schedule 2-3 hours for completion.',
    customizationTips: [
      'Split over Saturday and Sunday',
      'Add seasonal deep cleaning tasks',
      'Include window and baseboards'
    ]
  },

  {
    id: 'school-night-routine',
    name: 'School Night Prep',
    description: 'Evening routine to prepare for school the next day',
    category: 'daily_routines',
    difficulty: 'beginner',
    isOfficial: true,
    popularity: 78,
    rating: 4.4,
    targetFamilySize: [2, 6],
    totalEstimatedTime: 30,
    tags: ['school', 'evening', 'preparation', 'children'],
    chores: [
      {
        title: 'Homework Check',
        description: 'Complete and organize homework, pack school folders',
        type: 'educational',
        difficulty: 'medium',
        basePoints: 15,
        estimatedDuration: 15,
        frequency: 1,
        cooldownHours: 20
      },
      {
        title: 'Pack School Backpack',
        description: 'Organize and pack everything needed for school tomorrow',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 8,
        estimatedDuration: 10,
        frequency: 1,
        cooldownHours: 20
      },
      {
        title: 'Set Out Clothes',
        description: 'Choose and lay out clothes for the next school day',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 5,
        estimatedDuration: 5,
        frequency: 1,
        cooldownHours: 20
      }
    ],
    setupInstructions: 'Best for school-age children. Parents can supervise or help younger kids.',
    customizationTips: [
      'Add time for reading',
      'Include lunch preparation',
      'Create weekly schedule check'
    ]
  },

  {
    id: 'holiday-prep',
    name: 'Holiday Preparation',
    description: 'Seasonal holiday cleaning and decoration routine',
    category: 'seasonal_tasks',
    difficulty: 'intermediate',
    isOfficial: true,
    popularity: 55,
    rating: 4.6,
    targetFamilySize: [3, 8],
    totalEstimatedTime: 90,
    tags: ['holiday', 'seasonal', 'decoration', 'family'],
    chores: [
      {
        title: 'Decorate Common Areas',
        description: 'Put up holiday decorations in living and dining areas',
        type: 'decoration',
        difficulty: 'medium',
        basePoints: 20,
        estimatedDuration: 45,
        frequency: 90,
        cooldownHours: 2160
      },
      {
        title: 'Holiday Deep Clean',
        description: 'Extra cleaning in preparation for holiday guests',
        type: 'cleaning',
        difficulty: 'medium',
        basePoints: 25,
        estimatedDuration: 30,
        frequency: 90,
        cooldownHours: 2160
      },
      {
        title: 'Organize Gift Wrapping Station',
        description: 'Set up area with wrapping paper, ribbons, and tags',
        type: 'organization',
        difficulty: 'easy',
        basePoints: 12,
        estimatedDuration: 15,
        frequency: 90,
        cooldownHours: 2160
      }
    ],
    setupInstructions: 'Seasonal template for major holidays. Adjust timing based on your family traditions.',
    customizationTips: [
      'Customize for specific holidays',
      'Add outdoor decoration tasks',
      'Include special meal preparation'
    ]
  }
];

async function populateTemplates() {
  console.log('🏠 Family Compass - Template Database Population');
  console.log('================================================');
  
  try {
    // Check if templates already exist
    const templatesRef = collection(db, 'choreTemplates');
    const existingTemplates = await getDocs(query(templatesRef, where('isOfficial', '==', true)));
    
    if (existingTemplates.size > 0) {
      console.log(`⚠️  Found ${existingTemplates.size} existing official templates.`);
      console.log('This script will only add new templates that don\'t already exist.');
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const template of templates) {
      try {
        // Check if template with this ID already exists
        const existingQuery = query(templatesRef, where('id', '==', template.id));
        const existingSnap = await getDocs(existingQuery);

        if (existingSnap.size > 0) {
          console.log(`⏭️  Skipping "${template.name}" - already exists`);
          skippedCount++;
          continue;
        }

        // Add timestamp fields
        const templateData = {
          ...template,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
          averageRating: template.rating,
          ratingCount: Math.floor(Math.random() * 50) + 10 // Simulate some ratings
        };

        // Add template to Firestore
        const docRef = await addDoc(templatesRef, templateData);
        console.log(`✅ Added "${template.name}" (${template.category}) - ${docRef.id}`);
        addedCount++;

      } catch (error) {
        console.error(`❌ Error adding template "${template.name}":`, error.message);
      }
    }

    console.log('\n📊 Population Summary:');
    console.log(`✅ Templates added: ${addedCount}`);
    console.log(`⏭️  Templates skipped: ${skippedCount}`);
    console.log(`📚 Total templates in collection: ${addedCount + existingTemplates.size}`);
    
    if (addedCount > 0) {
      console.log('\n🎉 Template database population completed successfully!');
      console.log('Templates are now available in the Family Compass app.');
      console.log('\n📱 To test:');
      console.log('1. Open the app and navigate to Settings → Admin Panel');
      console.log('2. Click "Template Library"');
      console.log('3. Browse templates and test application functionality');
    } else {
      console.log('\n✨ No new templates needed - database is already populated!');
    }

  } catch (error) {
    console.error('💥 Fatal error during template population:', error);
    process.exit(1);
  }
}

// Add error handling for missing environment variables
if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
  console.error('❌ Error: Firebase configuration not found in environment variables.');
  console.error('Make sure you have a .env file with the required Firebase configuration.');
  process.exit(1);
}

// Run the population script
populateTemplates();