// Paste this script in the browser console while logged into the app
// It will create test chores for your family

async function populateTestChores() {
  // Import the necessary functions from your app
  const { createChore, getFamily } = await import('/services/firestore');
  const { auth } = await import('/config/firebase');
  
  if (!auth.currentUser) {
    console.error('Please log in first!');
    return;
  }
  
  // Get current user's family
  const family = await getFamily('demo-family-id');
  if (!family || !family.members) {
    console.error('No family found!');
    return;
  }
  
  const members = family.members;
  console.log(`Found ${members.length} family members`);
  
  // Test chores
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
      cooldownHours: 168,
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
    }
  ];
  
  // Create chores
  let created = 0;
  for (let i = 0; i < testChores.length; i++) {
    const chore = testChores[i];
    
    // Assign to different members
    let assignedTo = '';
    let assignedToName = '';
    
    if (chore.type === 'individual' || chore.type === 'pet') {
      const memberIndex = i % members.length;
      assignedTo = members[memberIndex].uid;
      assignedToName = members[memberIndex].name;
    } else if (chore.type === 'family') {
      // Assign to first member initially
      assignedTo = members[0].uid;
      assignedToName = members[0].name;
    }
    // shared chores start unassigned
    
    const choreData = {
      ...chore,
      assignedTo,
      assignedToName,
      familyId: family.id,
      createdBy: auth.currentUser.uid,
      dueDate: new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open'
    };
    
    try {
      await createChore(choreData);
      console.log(`✓ Created: ${chore.title}`);
      created++;
    } catch (error) {
      console.error(`✗ Failed to create ${chore.title}:`, error);
    }
  }
  
  console.log(`\n✅ Successfully created ${created} test chores!`);
  console.log('Refresh the chores page to see them.');
}

// Run it
populateTestChores();