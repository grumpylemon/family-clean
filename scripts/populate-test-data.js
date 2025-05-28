#!/usr/bin/env node

// Script to populate test chores in the database
// Run with: node scripts/populate-test-data.js

const admin = require('firebase-admin');
const serviceAccount = require('../family-fun-app-firebase-adminsdk.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://family-fun-app.firebaseio.com"
});

const db = admin.firestore();

// Test chores data
const testChores = [
  // Daily chores
  {
    title: "Clean Kitchen Counter",
    description: "Wipe down all kitchen counters and stovetop",
    type: "individual",
    difficulty: "easy",
    points: 5,
    cooldownHours: 24,
    recurring: { enabled: true, frequencyDays: 1 }
  },
  {
    title: "Load/Unload Dishwasher",
    description: "Load dirty dishes and unload clean ones",
    type: "family",
    difficulty: "easy",
    points: 5,
    cooldownHours: 12,
    recurring: { enabled: true, frequencyDays: 1 }
  },
  {
    title: "Take Out Trash",
    description: "Empty all trash cans and take bins to curb",
    type: "family",
    difficulty: "easy",
    points: 5,
    cooldownHours: 24,
    recurring: { enabled: true, frequencyDays: 1 }
  },
  
  // Weekly chores
  {
    title: "Vacuum Living Room",
    description: "Vacuum all carpets and rugs in living areas",
    type: "individual",
    difficulty: "medium",
    points: 10,
    cooldownHours: 168, // 1 week
    recurring: { enabled: true, frequencyDays: 7 }
  },
  {
    title: "Clean Bathrooms",
    description: "Clean toilets, sinks, mirrors, and floors",
    type: "family",
    difficulty: "hard",
    points: 15,
    cooldownHours: 168,
    recurring: { enabled: true, frequencyDays: 7 }
  },
  {
    title: "Mow Lawn",
    description: "Mow front and back yard, edge walkways",
    type: "individual",
    difficulty: "hard",
    points: 20,
    cooldownHours: 168,
    recurring: { enabled: true, frequencyDays: 7 }
  },
  {
    title: "Do Laundry",
    description: "Wash, dry, and fold one load of laundry",
    type: "shared",
    difficulty: "medium",
    points: 10,
    cooldownHours: 48,
    recurring: { enabled: true, frequencyDays: 3 }
  },
  
  // Pet chores
  {
    title: "Feed the Dog",
    description: "Give fresh food and water to the dog",
    type: "pet",
    difficulty: "easy",
    points: 3,
    cooldownHours: 12,
    recurring: { enabled: true, frequencyDays: 1 }
  },
  {
    title: "Walk the Dog",
    description: "Take the dog for a 20-minute walk",
    type: "pet",
    difficulty: "medium",
    points: 8,
    cooldownHours: 24,
    recurring: { enabled: true, frequencyDays: 1 }
  },
  
  // One-time chores
  {
    title: "Organize Garage",
    description: "Sort items, sweep floor, organize shelves",
    type: "individual",
    difficulty: "hard",
    points: 25,
    cooldownHours: 720, // 30 days
    recurring: { enabled: false }
  },
  {
    title: "Wash Car",
    description: "Wash and vacuum the family car",
    type: "shared",
    difficulty: "medium",
    points: 12,
    cooldownHours: 336, // 2 weeks
    recurring: { enabled: false }
  },
  {
    title: "Clean Out Refrigerator",
    description: "Remove old food, wipe shelves, organize items",
    type: "family",
    difficulty: "medium",
    points: 10,
    cooldownHours: 336,
    recurring: { enabled: true, frequencyDays: 14 }
  }
];

async function populateChores() {
  try {
    console.log('Starting to populate test chores...');
    
    // Get the demo family
    const familyId = 'demo-family-id';
    const familyDoc = await db.collection('families').doc(familyId).get();
    
    if (!familyDoc.exists) {
      console.error('Demo family not found! Please create a family first.');
      process.exit(1);
    }
    
    const family = familyDoc.data();
    const members = family.members || [];
    
    if (members.length === 0) {
      console.error('No family members found!');
      process.exit(1);
    }
    
    console.log(`Found ${members.length} family members`);
    
    // Add chores
    for (let i = 0; i < testChores.length; i++) {
      const chore = testChores[i];
      
      // Assign to different members in rotation
      let assignedTo = '';
      let assignedToName = '';
      
      if (chore.type === 'individual' || chore.type === 'pet') {
        const memberIndex = i % members.length;
        assignedTo = members[memberIndex].uid;
        assignedToName = members[memberIndex].name;
      } else if (chore.type === 'shared') {
        // Shared chores can be claimed by anyone, start unassigned
        assignedTo = '';
        assignedToName = '';
      } else if (chore.type === 'family') {
        // Family chores rotate, assign to first member initially
        assignedTo = members[0].uid;
        assignedToName = members[0].name;
      }
      
      const choreData = {
        ...chore,
        assignedTo,
        assignedToName,
        familyId,
        createdBy: family.adminId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dueDate: new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000), // Random 1-7 days from now
        status: 'open'
      };
      
      const docRef = await db.collection('chores').add(choreData);
      console.log(`✓ Added chore: ${chore.title} (ID: ${docRef.id})`);
    }
    
    console.log(`\n✅ Successfully added ${testChores.length} test chores!`);
    console.log('\nChore distribution:');
    console.log('- Individual: 3 chores');
    console.log('- Family: 4 chores (with rotation)');
    console.log('- Shared: 2 chores (can be claimed)');
    console.log('- Pet: 2 chores');
    console.log('- One-time: 3 chores');
    
  } catch (error) {
    console.error('Error populating chores:', error);
  } finally {
    // Close the connection
    await admin.app().delete();
    process.exit(0);
  }
}

// Run the script
populateChores();