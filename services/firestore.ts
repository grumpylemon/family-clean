import { auth, isMockImplementation, safeCollection } from '@/config/firebase';
import {
  Chore,
  Family,
  FamilyMember,
  User,
  Reward,
  RewardRedemption,
  CompletionReward,
  ChoreCompletionRecord,
  DailyPointsRecord,
  WeeklyPointsData
} from '@/types';
import { 
  processChoreCompletion, 
  applyCompletionRewards,
  calculateStreakBonus 
} from './gamification';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { Platform } from 'react-native';

// Version to confirm updates (v10)
console.log("Firestore service version: v10");

// Get collection references dynamically to ensure Firebase is initialized
const getChoresCollection = () => safeCollection('chores');
const getFamiliesCollection = () => safeCollection('families');
const getUsersCollection = () => safeCollection('users');
const getRewardsCollection = () => safeCollection('rewards');
const getRedemptionsCollection = () => safeCollection('redemptions');

// Fixed family ID for demo purposes to ensure persistence
// In a real app, this would be retrieved from the user's profile
const DEFAULT_FAMILY_ID = 'demo-family-id';

// Chore ID prefix to make IDs more recognizable
const CHORE_ID_PREFIX = 'chore-';

// Mock data for fallback
const mockChores: Chore[] = [
  {
    id: 'mock-chore-1',
    title: 'Demo Chore: Clean Room',
    description: 'This is a demo chore from the mock implementation',
    type: 'individual',
    difficulty: 'medium',
    points: 10,
    assignedTo: 'mock-user-id',
    assignedToName: 'Demo User',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: 'mock-user-id',
    familyId: 'test-family-id',
    status: 'open'
  },
  {
    id: 'mock-chore-2',
    title: 'Demo Chore: Do Dishes',
    description: 'Another demo chore from mock implementation',
    type: 'family',
    difficulty: 'easy',
    points: 5,
    assignedTo: 'mock-user-id',
    assignedToName: 'Demo User',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: 'mock-user-id',
    familyId: 'test-family-id',
    status: 'open'
  }
];

// Immediately return mock data for iOS to avoid any Firebase initialization issues
const shouldReturnMockImmediately = () => {
  return Platform.OS === 'ios' || isMockImplementation();
};

// Ensures dates are properly formatted for Firestore
const formatForFirestore = (data: any) => {
  const formattedData = { ...data };
  // Convert Date objects to ISO strings to work better with Firestore
  Object.keys(formattedData).forEach(key => {
    if (formattedData[key] instanceof Date) {
      formattedData[key] = formattedData[key].toISOString();
    }
  });
  console.log("Formatted data for Firestore:", formattedData);
  return formattedData;
};

// Ensure we have a consistent family ID for the demo
export const getDefaultFamilyId = (userId?: string) => {
  // For iOS, use a mock ID
  if (Platform.OS === 'ios') {
    return 'mock-family-id';
  }
  
  // IMPORTANT: For persistence, always use the same fixed family ID
  // Do NOT use userId to generate family ID as it changes between sessions
  return DEFAULT_FAMILY_ID;
};

// Generate a stable ID for a chore
const generateChoreId = (title: string) => {
  // Create a simpler ID format that's less likely to cause issues
  return `chore-${Date.now()}`;
};

// Chore functions
export const getChores = async (familyId: string) => {
  // Fast path for iOS
  if (shouldReturnMockImmediately()) {
    console.log('Immediately returning mock chores data for iOS');
    return mockChores;
  }
  
  try {
    // Use default family ID for consistency
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    console.log(`Getting chores for family ${effectiveFamilyId}, using mock: ${isMockImplementation()}, requested family: ${familyId}`);
    
    // If we're using mock, return mock data for better demo
    if (isMockImplementation()) {
      console.log('Using mock chores data');
      return mockChores;
    }
    
    // Always use the effective family ID for consistency, regardless of what was passed in
    console.log(`Using effective family ID: ${effectiveFamilyId} for query`);
    
    // Get Firestore instance
    const db = getFirestore();
    if (!db) {
      console.error('No Firestore instance available, returning mock data');
      return mockChores;
    }
    
    // Use Firebase v9 modular API
    console.log('Creating chores collection reference');
    const choresRef = collection(db, 'chores');
    console.log('Creating query for chores');
    const q = query(choresRef, where('familyId', '==', effectiveFamilyId));
    console.log('Executing query');
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} chores in Firestore for family ${effectiveFamilyId}`);
    
    // Process the results
    const fetchedChores = querySnapshot.docs
      .filter((doc) => {
        // Filter out deleted documents
        const data = doc.data();
        if (data && data.deleted === true) {
          console.log(`Skipping deleted chore: ${doc.id}`);
          return false;
        }
        return true;
      })
      .map((doc) => {
        const data = doc.data();
        console.log(`Chore ID: ${doc.id}, Title: ${data.title || 'Unknown'}, FamilyID: ${data.familyId || 'Unknown'}`);
        return {
          id: doc.id,
          ...data
        };
      }) as Chore[];
    
    console.log(`Returning ${fetchedChores.length} chores after filtering for family ${effectiveFamilyId}`);
    return fetchedChores;
  } catch (error) {
    console.error('Error getting chores:', error);
    return mockChores; // Return mock data on error for better UX
  }
};

export const getChore = async (choreId: string) => {
  // Fast path for iOS
  if (shouldReturnMockImmediately()) {
    const mockChore = mockChores.find(c => c.id === choreId);
    if (mockChore) {
      return mockChore;
    }
    throw new Error('Chore not found in mock data');
  }
  
  try {
    // If using mock, look up in the mock data
    if (isMockImplementation()) {
      const mockChore = mockChores.find(c => c.id === choreId);
      if (mockChore) {
        return mockChore;
      }
      throw new Error('Chore not found in mock data');
    }
    
    const choreDoc = await getDoc(doc(getChoresCollection(), choreId));
    if (choreDoc.exists()) {
      return { id: choreDoc.id, ...choreDoc.data() } as Chore;
    } else {
      throw new Error('Chore not found');
    }
  } catch (error) {
    console.error('Error getting chore:', error);
    throw error;
  }
};

export const createChore = async (chore: Omit<Chore, 'id'>) => {
  // Fast path for iOS
  if (shouldReturnMockImmediately()) {
    return `mock-id-${Date.now()}`;
  }
  
  try {
    // ALWAYS use default family ID for consistency, regardless of what was passed in
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    
    // Log original vs effective family ID
    if (chore.familyId !== effectiveFamilyId) {
      console.log(`Overriding passed family ID ${chore.familyId} with effective ID ${effectiveFamilyId} for persistence`);
    }
    
    // Make sure to set the family ID to the effective one
    const choreWithFamilyId = {
      ...chore,
      familyId: effectiveFamilyId,
      createdAt: new Date(),
      // Explicitly set deleted flag to false to prevent filtering issues
      deleted: false
    };
    
    console.log(`Adding chore: ${chore.title}, using mock: ${isMockImplementation()}, family: ${effectiveFamilyId}`);
    
    // If using mock, just generate a mock ID
    if (isMockImplementation()) {
      return `mock-id-${Date.now()}`;
    }
    
    // Generate a custom ID for the chore
    const choreId = generateChoreId(chore.title);
    
    try {
      // Format data for Firestore (convert dates to ISO strings)
      const formattedChore = formatForFirestore(choreWithFamilyId);
      
      // Get Firestore instance
      const db = getFirestore();
      if (!db) {
        console.error('No Firestore instance available, returning mock ID');
        return `mock-id-${Date.now()}`;
      }
      
      console.log('Creating chore document with Firebase API');
      
      // Option 1: Add with auto-generated ID
      const choresRef = collection(db, 'chores');
      const docRef = await addDoc(choresRef, formattedChore);
      console.log(`Successfully added chore with auto-generated ID: ${docRef.id}`);
      return docRef.id;
      
      /* 
      // Option 2: Create with custom ID
      const choreDocRef = doc(db, 'chores', choreId);
      await setDoc(choreDocRef, formattedChore);
      console.log(`Successfully added chore with custom ID: ${choreId}`);
      return choreId;
      */
      
    } catch (innerError) {
      console.error('Inner error during chore creation:', innerError);
      // Try one more time with a very simple approach
      try {
        const db = getFirestore();
        const emergencyId = `emergency-${Date.now()}`;
        const emergencyRef = doc(db, 'chores', emergencyId);
        
        const formattedChore = formatForFirestore(choreWithFamilyId);
        await setDoc(emergencyRef, formattedChore);
        console.log(`Emergency save successful with ID: ${emergencyId}`);
        return emergencyId;
      } catch (lastError) {
        console.error('Final fallback attempt failed:', lastError);
        return `mock-id-${Date.now()}`; // Return a mock ID, not an error ID
      }
    }
  } catch (error) {
    // Log more details about the error
    console.error('Error adding chore:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return a mock ID instead of an error ID to avoid confusion
    return `mock-id-${Date.now()}`;
  }
};

// Alias for backward compatibility
export const addChore = createChore;

export const updateChore = async (choreId: string, chore: Partial<Chore>) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock update chore: ${choreId}`);
      return true;
    }
    
    // Format data for Firestore
    const formattedChore = formatForFirestore(chore);
    
    console.log(`Updating chore ${choreId} with data:`, formattedChore);
    
    // Use set with merge to avoid overwriting existing data
    await setDoc(doc(getChoresCollection(), choreId), formattedChore, { merge: true });
    
    // Verify the update
    const verifyDoc = await getDoc(doc(getChoresCollection(), choreId));
    if (verifyDoc.exists()) {
      console.log(`Successfully verified chore update in Firestore with ID: ${choreId}`);
    } else {
      console.error(`Chore with ID ${choreId} was not found after update!`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating chore:', error);
    return false;
  }
};

export const deleteChore = async (choreId: string) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock delete chore: ${choreId}`);
      return true;
    }
    
    console.log(`Attempting to delete chore ${choreId}`);
    
    // First, verify the chore exists
    const choreDoc = await getDoc(doc(getChoresCollection(), choreId));
    if (!choreDoc.exists()) {
      console.error(`Chore ${choreId} does not exist`);
      return false;
    }
    
    console.log(`Marking chore ${choreId} as deleted`);
    
    // Instead of actually deleting, mark as deleted
    await setDoc(doc(getChoresCollection(), choreId), { deleted: true }, { merge: true });
    
    // Verify the deletion
    const verifyDoc = await getDoc(doc(getChoresCollection(), choreId));
    if (verifyDoc.exists() && verifyDoc.data()?.deleted === true) {
      console.log(`Successfully marked chore ${choreId} as deleted`);
      return true;
    } else {
      console.error(`Failed to verify deletion of chore ${choreId}`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting chore:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

export const completeChore = async (choreId: string): Promise<{ success: boolean; reward?: CompletionReward; error?: string }> => {
  if (shouldReturnMockImmediately()) {
    return { success: true };
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock complete chore: ${choreId}`);
      return { success: true };
    }

    // Fetch the chore
    const choreDoc = await getDoc(doc(getChoresCollection(), choreId));
    if (!choreDoc.exists()) throw new Error('Chore not found');
    const chore = { id: choreDoc.id, ...choreDoc.data() } as Chore;

    // Enforce cooldown: prevent completion if lockedUntil is in the future
    if (chore.lockedUntil) {
      const lockedUntil = new Date(chore.lockedUntil);
      if (lockedUntil > new Date()) {
        return { 
          success: false, 
          error: `Chore is locked until ${lockedUntil.toLocaleDateString()} ${lockedUntil.toLocaleTimeString()}` 
        };
      }
    }

    // Fetch the user profile
    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile) throw new Error('User profile not found');

    // Fetch the family
    const family = await getFamily(chore.familyId);
    if (!family) throw new Error('Family not found');

    const today = new Date();

    // 1. Update streak tracking
    let streak = userProfile.streak || { current: 0, longest: 0 };
    const lastCompleted = streak.lastCompletedDate ? new Date(streak.lastCompletedDate) : null;
    
    // Check if completion is consecutive (same day or next day)
    let isConsecutive = false;
    if (lastCompleted) {
      const daysDiff = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
      isConsecutive = daysDiff <= 1;
    }
    
    if (isConsecutive || !lastCompleted) {
      streak.current += 1;
    } else {
      streak.current = 1; // Reset streak
    }
    
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastCompletedDate = today.toISOString();

    // 2. Calculate completion count
    const completionCount = (chore.completionCount || 0) + 1;

    // 3. Process gamification rewards (XP, achievements, levels)
    const reward = await processChoreCompletion(
      currentUser.uid,
      chore.points,
      chore.difficulty,
      completionCount
    );

    console.log('Completion reward calculated:', reward);

    // 4. Apply streak bonus to points
    const streakBonus = calculateStreakBonus(streak.current);
    const finalPoints = Math.round(reward.pointsEarned * streakBonus);

    // 5. Update user profile with all rewards and streak
    const updatedUserProfile = {
      points: {
        current: (userProfile.points?.current || 0) + finalPoints,
        lifetime: (userProfile.points?.lifetime || 0) + finalPoints,
        weekly: (userProfile.points?.weekly || 0) + finalPoints,
      },
      streak,
      updatedAt: today,
    };

    // Apply gamification rewards (XP, level, achievements)
    await applyCompletionRewards(currentUser.uid, reward, streak.current);
    
    // Update basic profile data
    await createOrUpdateUserProfile(currentUser.uid, updatedUserProfile);
    
    // Update family member points as well for dashboard display
    const memberInFamily = family.members.find((m: FamilyMember) => m.uid === currentUser.uid);
    if (memberInFamily) {
      await updateFamilyMember(family.id!, currentUser.uid, {
        points: {
          current: (memberInFamily.points?.current || 0) + finalPoints,
          lifetime: (memberInFamily.points?.lifetime || 0) + finalPoints,
          weekly: (memberInFamily.points?.weekly || 0) + finalPoints,
        }
      });
    }

    // Update daily points tracking for the 7-day rolling window
    await updateDailyPoints(currentUser.uid, chore.familyId, finalPoints);

    // 6. Set cooldown (lockedUntil)
    const cooldownHours = chore.cooldownHours || family.settings?.defaultChoreCooldownHours || 24;
    const lockedUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);

    // 7. Update chore as completed
    const completionData = formatForFirestore({
      completedBy: currentUser.uid,
      completedAt: today,
      status: 'completed',
      lockedUntil: lockedUntil.toISOString(),
      completionCount,
    });
    await setDoc(doc(getChoresCollection(), choreId), completionData, { merge: true });

    // 8. Log completion record for analytics
    const completionRecord: Omit<ChoreCompletionRecord, 'id'> = {
      choreId,
      userId: currentUser.uid,
      completedAt: today,
      pointsEarned: finalPoints,
      xpEarned: reward.xpEarned,
      streakDay: streak.current,
      bonusMultiplier: streakBonus > 1 ? streakBonus : undefined,
      achievementsUnlocked: reward.achievementsUnlocked?.map(a => a.id),
      familyId: chore.familyId,
    };

    try {
      // Store completion record (optional - for analytics)
      const completionsRef = collection(getFirestore(), 'choreCompletions');
      await addDoc(completionsRef, formatForFirestore(completionRecord));
    } catch (recordError) {
      console.warn('Failed to store completion record:', recordError);
      // Don't fail the whole operation for analytics
    }

    // 9. Handle rotation for family/shared chores
    if (chore.type === 'family' || chore.type === 'shared') {
      await handleChoreRotation(chore, family, lockedUntil);
    } else {
      // For individual chores, just update the lock time and reset status
      await updateChore(choreId, {
        status: 'open',
        lockedUntil: lockedUntil.toISOString(),
      });
    }

    return { 
      success: true, 
      reward: {
        ...reward,
        pointsEarned: finalPoints, // Update with streak bonus
        streakBonus: streakBonus > 1 ? streakBonus : undefined
      }
    };
  } catch (error) {
    console.error('Error completing chore:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Helper function to handle chore rotation logic
const handleChoreRotation = async (chore: Chore, family: Family, lockedUntil: Date) => {
  try {
    // Find eligible members (active, not excluded)
    const rotationOrder = family.memberRotationOrder || family.members.filter(m => m.isActive).map(m => m.uid);
    let nextIndex = typeof family.nextFamilyChoreAssigneeIndex === 'number' ? family.nextFamilyChoreAssigneeIndex : 0;
    
    // Remove excluded/inactive members from rotation
    const eligibleMembers = rotationOrder.filter(uid => {
      const member = family.members.find(m => m.uid === uid);
      return member && member.isActive;
    });
    
    if (eligibleMembers.length === 0) {
      // All members are excluded
      await updateChore(chore.id!, {
        assignedTo: '',
        assignedToName: '',
        status: 'open',
        lockedUntil: lockedUntil.toISOString(),
      });
      console.warn('No eligible members for rotation. Chore left unassigned.');
      return;
    }
    
    // Find the next eligible member
    let found = false;
    let attempts = 0;
    let candidateIndex = nextIndex;
    
    while (!found && attempts < eligibleMembers.length) {
      const candidateUid = eligibleMembers[candidateIndex % eligibleMembers.length];
      
      if (candidateUid !== chore.assignedTo) {
        found = true;
        nextIndex = (candidateIndex + 1) % eligibleMembers.length;
        
        // Assign to next eligible member
        const member = family.members.find(m => m.uid === candidateUid);
        await updateChore(chore.id!, {
          assignedTo: candidateUid,
          assignedToName: member?.name || '',
          status: 'open',
          lockedUntil: lockedUntil.toISOString(),
        });
        
        // Update family rotation index
        await updateFamily(family.id!, {
          nextFamilyChoreAssigneeIndex: nextIndex,
          memberRotationOrder: eligibleMembers,
        });
        
        console.log(`Rotated chore ${chore.id} to ${member?.name} (${candidateUid})`);
      } else {
        candidateIndex++;
        attempts++;
      }
    }
    
    if (!found) {
      console.warn('Could not find a different member for rotation, keeping current assignment');
      await updateChore(chore.id!, {
        status: 'open',
        lockedUntil: lockedUntil.toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in chore rotation:', error);
    // Fallback: just unlock the chore
    await updateChore(chore.id!, {
      status: 'open',
      lockedUntil: lockedUntil.toISOString(),
    });
  }
};

// Mock family data
const mockFamily: Family = {
  id: 'demo-family-qj7fep',
  name: 'Testing Family',
  adminId: 'guest-admin-user',
  joinCode: 'QJ7FEP',
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [
    {
      uid: 'guest-admin-user',
      name: 'Guest Admin',
      email: 'guest@familyclean.app',
      role: 'admin',
      familyRole: 'parent',
      points: {
        current: 100,
        lifetime: 100,
        weekly: 25
      },
      photoURL: 'https://via.placeholder.com/150',
      joinedAt: new Date(),
      isActive: true
    },
    {
      uid: 'test-user-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'member',
      familyRole: 'child',
      points: {
        current: 75,
        lifetime: 200,
        weekly: 15
      },
      photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b9c66494?w=150',
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      uid: 'test-user-2', 
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'member',
      familyRole: 'child',
      points: {
        current: 50,
        lifetime: 150,
        weekly: 10
      },
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ],
  settings: {
    defaultChorePoints: 10,
    defaultChoreCooldownHours: 24,
    allowPointTransfers: false,
    weekStartDay: 0
  }
};

// Family functions
export const getFamily = async (familyId: string) => {
  if (shouldReturnMockImmediately()) {
    return mockFamily;
  }
  
  try {
    // Use default family ID for consistency
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    
    // Return mock family for mock implementation
    if (isMockImplementation()) {
      console.log(`Getting mock family: ${familyId}`);
      // Try to get from mock database first
      const familyDoc = await getFamiliesCollection().doc(familyId).get();
      if (familyDoc.exists) {
        const familyData = familyDoc.data();
        console.log(`Found mock family data:`, familyData);
        return { id: familyId, ...familyData };
      }
      
      // Fallback to static mock family
      console.log(`No mock family found, returning static mock family`);
      return mockFamily;
    }
    
    console.log(`Checking for family with ID: ${effectiveFamilyId}`);
    
    // Get Firestore instance
    const db = getFirestore();
    if (!db) {
      console.error('No Firestore instance available, returning mock family');
      return mockFamily;
    }
    
    // Check if family exists
    const familyDocRef = doc(db, 'families', effectiveFamilyId);
    const familySnapshot = await getDoc(familyDocRef);
    
    // If family exists, return it
    if (familySnapshot.exists()) {
      console.log(`Found existing family: ${effectiveFamilyId}`);
      return { id: familySnapshot.id, ...familySnapshot.data() } as Family;
    } 
    
    // Otherwise, create a default family (for demo purposes)
    console.log(`Family not found, creating default family: ${effectiveFamilyId}`);
    const defaultFamily: Omit<Family, 'id'> = {
      name: auth.currentUser?.displayName ? `${auth.currentUser.displayName}'s Family` : 'Demo Family',
      adminId: auth.currentUser?.uid || 'unknown',
      joinCode: generateJoinCode(),
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [{
        uid: auth.currentUser?.uid || 'unknown',
        name: auth.currentUser?.displayName || 'Demo User',
        email: auth.currentUser?.email || 'unknown@example.com',
        role: 'admin',
        familyRole: 'parent',
        points: {
          current: 0,
          lifetime: 0,
          weekly: 0
        },
        photoURL: auth.currentUser?.photoURL || undefined,
        joinedAt: new Date(),
        isActive: true
      }],
      settings: {
        defaultChorePoints: 10,
        defaultChoreCooldownHours: 24,
        allowPointTransfers: false,
        weekStartDay: 0
      }
    };
    
    // Format for Firestore
    const formattedFamily = formatForFirestore(defaultFamily);
    
    // Add to Firestore with the specific ID
    console.log(`Creating new family with ID ${effectiveFamilyId}:`, formattedFamily);
    await setDoc(doc(db, 'families', effectiveFamilyId), formattedFamily);
    
    // Verify the family was created
    const verifyDoc = await getDoc(doc(db, 'families', effectiveFamilyId));
    if (verifyDoc.exists()) {
      console.log(`Successfully verified family in Firestore with ID: ${effectiveFamilyId}`);
    } else {
      console.error(`Family with ID ${effectiveFamilyId} was not found after creation!`);
    }
    
    return { id: effectiveFamilyId, ...defaultFamily } as Family;
  } catch (error) {
    console.error('Error getting/creating family:', error);
    // Return mock data for demo
    return mockFamily;
  }
};

export const getUserFamily = async (userId: string) => {
  if (shouldReturnMockImmediately()) {
    return mockFamily;
  }
  
  try {
    // Use default family ID for the demo
    const effectiveFamilyId = getDefaultFamilyId(userId);
    
    // For demo purposes, just get the family directly
    return await getFamily(effectiveFamilyId);
  } catch (error) {
    console.error('Error getting user family:', error);
    return null;
  }
};

export const createFamily = async (family: Omit<Family, 'id' | 'createdAt'>) => {
  if (shouldReturnMockImmediately()) {
    return 'mock-family-id';
  }
  
  try {
    // Use default family ID for consistency in the demo
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    
    // For mock implementation, just return a mock ID
    if (isMockImplementation()) {
      console.log(`Creating mock family: ${family.name}`);
      return effectiveFamilyId;
    }
    
    // Format data for Firestore
    const formattedFamily = formatForFirestore({
      ...family,
      createdAt: new Date()
    });
    
    // Create with specific ID for consistency
    console.log(`Creating family with ID ${effectiveFamilyId}:`, formattedFamily);
    await setDoc(doc(getFamiliesCollection(), effectiveFamilyId), formattedFamily);
    
    return effectiveFamilyId;
  } catch (error) {
    console.error('Error creating family:', error);
    return 'mock-family-id';
  }
};

export const updateFamily = async (familyId: string, data: Partial<Family>) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock update family: ${familyId}`);
      return true;
    }
    
    // Format data for Firestore
    const formattedData = formatForFirestore(data);
    
    console.log(`Updating family ${familyId} with:`, formattedData);
    
    await setDoc(doc(getFamiliesCollection(), familyId), formattedData, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating family:', error);
    return false;
  }
};

export const addFamilyMember = async (familyId: string, member: FamilyMember) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock add family member: ${member.name} to family ${familyId}`);
      return true;
    }
    
    const familyDoc = await getDoc(doc(getFamiliesCollection(), familyId));
    if (!familyDoc.exists()) throw new Error('Family not found');
    
    const familyData = familyDoc.data() as Family;
    const updatedMembers = [...(familyData.members || []), member];
    
    console.log(`Adding member ${member.name} to family ${familyId}`);
    
    await setDoc(doc(getFamiliesCollection(), familyId), {
      members: updatedMembers
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error adding family member:', error);
    return false;
  }
};

export const updateFamilyMember = async (familyId: string, userId: string, updates: Partial<FamilyMember>) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock update family member: ${userId} in family ${familyId}`);
      return true;
    }
    
    const familyDoc = await getDoc(doc(getFamiliesCollection(), familyId));
    if (!familyDoc.exists()) throw new Error('Family not found');
    
    const familyData = familyDoc.data() as Family;
    const members = familyData.members || [];
    const memberIndex = members.findIndex(m => m.uid === userId);
    
    if (memberIndex === -1) throw new Error('Member not found in family');
    
    const updatedMembers = [...members];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      ...updates
    };
    
    await setDoc(doc(getFamiliesCollection(), familyId), {
      members: updatedMembers
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating family member:', error);
    return false;
  }
};

// Generate a unique join code for families
export const generateJoinCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Find family by join code
export const findFamilyByJoinCode = async (joinCode: string): Promise<Family | null> => {
  if (shouldReturnMockImmediately()) {
    return mockFamily;
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock find family by join code: ${joinCode}`);
      // Search in mock database
      const query = getFamiliesCollection().where('joinCode', '==', joinCode);
      const querySnapshot = await query.get();
      
      if (querySnapshot.empty) {
        console.log(`No family found with join code: ${joinCode}`);
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log(`Found family with join code:`, data);
      return { id: doc.id, ...data };
    }
    
    const q = query(getFamiliesCollection(), where('joinCode', '==', joinCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data() || {};
    return {
      id: doc.id,
      ...(data as any)
    } as Family;
  } catch (error) {
    console.error('Error finding family by join code:', error);
    return null;
  }
};

// Create or update user profile
export const createOrUpdateUserProfile = async (userId: string, userData: Partial<User>) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock create/update user profile: ${userId}`, userData);
      // Update the user in mock database
      await getUsersCollection().doc(userId).set(userData, { merge: true });
      return true;
    }
    
    const formattedData = formatForFirestore({
      ...userData,
      updatedAt: new Date()
    });
    
    await setDoc(doc(getUsersCollection(), userId), formattedData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    return false;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<User | null> => {
  if (shouldReturnMockImmediately()) {
    return {
      uid: userId,
      email: 'mock@example.com',
      displayName: 'Mock User',
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock getUserProfile for: ${userId}`);
      // Try to get from mock database first
      const userDoc = await getUsersCollection().doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`Found mock user profile:`, userData);
        return userData;
      }
      
      // Fallback for mock user
      console.log(`No mock user profile found, returning basic mock data`);
      return {
        uid: userId,
        email: 'mock@example.com',
        displayName: 'Mock User',
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    const userDoc = await getDoc(doc(getUsersCollection(), userId));
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      uid: userId,
      ...userDoc.data()
    } as User;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Mock reward data
const mockRewards: Reward[] = [
  {
    id: 'mock-reward-1',
    name: '30 minutes extra screen time',
    description: 'Enjoy an extra 30 minutes of tablet or TV time',
    pointsCost: 50,
    category: 'privilege',
    familyId: 'demo-family-qj7fep',
    createdBy: 'guest-admin-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isRepeatable: true,
    isUnlimited: true,
    featured: true,
    sortOrder: 1
  },
  {
    id: 'mock-reward-2',
    name: 'Pick tonight\'s dinner',
    description: 'Choose what the family has for dinner tonight',
    pointsCost: 75,
    category: 'privilege',
    familyId: 'demo-family-qj7fep',
    createdBy: 'guest-admin-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isRepeatable: true,
    cooldownDays: 1,
    isUnlimited: true,
    featured: true,
    sortOrder: 2
  },
  {
    id: 'mock-reward-3',
    name: '$5 Allowance',
    description: 'Earn $5 to spend or save as you wish',
    pointsCost: 100,
    category: 'money',
    familyId: 'demo-family-qj7fep',
    createdBy: 'guest-admin-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isRepeatable: true,
    isUnlimited: true,
    featured: true,
    sortOrder: 3
  },
  {
    id: 'mock-reward-4',
    name: 'Movie night choice',
    description: 'Choose the movie for family movie night',
    pointsCost: 60,
    category: 'experience',
    familyId: 'demo-family-qj7fep',
    createdBy: 'guest-admin-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isRepeatable: true,
    cooldownDays: 7,
    isUnlimited: true,
    sortOrder: 4
  },
  {
    id: 'mock-reward-5',
    name: 'Skip one chore',
    description: 'Skip any assigned chore (within reason)',
    pointsCost: 80,
    category: 'privilege',
    familyId: 'demo-family-qj7fep',
    createdBy: 'guest-admin-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isRepeatable: true,
    isUnlimited: true,
    minLevel: 2,
    sortOrder: 5
  }
];

// ==================== REWARD FUNCTIONS ====================

// Get all rewards for a family
export const getRewards = async (familyId: string): Promise<Reward[]> => {
  if (shouldReturnMockImmediately()) {
    console.log('Immediately returning mock rewards data for iOS');
    return mockRewards;
  }
  
  try {
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    console.log(`Getting rewards for family ${effectiveFamilyId}, using mock: ${isMockImplementation()}`);
    
    if (isMockImplementation()) {
      console.log('Using mock rewards data');
      return mockRewards;
    }
    
    const db = getFirestore();
    if (!db) {
      console.error('No Firestore instance available, returning mock data');
      return mockRewards;
    }
    
    const rewardsRef = collection(db, 'rewards');
    const q = query(rewardsRef, where('familyId', '==', effectiveFamilyId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const rewards = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Reward[];
    
    console.log(`Returning ${rewards.length} rewards for family ${effectiveFamilyId}`);
    return rewards.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  } catch (error) {
    console.error('Error getting rewards:', error);
    return mockRewards;
  }
};

// Get a specific reward
export const getReward = async (rewardId: string): Promise<Reward | null> => {
  if (shouldReturnMockImmediately()) {
    const mockReward = mockRewards.find(r => r.id === rewardId);
    return mockReward || null;
  }
  
  try {
    if (isMockImplementation()) {
      const mockReward = mockRewards.find(r => r.id === rewardId);
      return mockReward || null;
    }
    
    const rewardDoc = await getDoc(doc(getRewardsCollection(), rewardId));
    if (rewardDoc.exists()) {
      return { id: rewardDoc.id, ...rewardDoc.data() } as Reward;
    }
    return null;
  } catch (error) {
    console.error('Error getting reward:', error);
    return null;
  }
};

// Create a new reward (admin only)
export const createReward = async (reward: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (shouldReturnMockImmediately()) {
    return `mock-reward-${Date.now()}`;
  }
  
  try {
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    
    const rewardWithDefaults = {
      ...reward,
      familyId: effectiveFamilyId,
      createdBy: auth.currentUser?.uid || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    if (isMockImplementation()) {
      console.log(`Mock create reward: ${reward.name}`);
      return `mock-reward-${Date.now()}`;
    }
    
    const db = getFirestore();
    if (!db) {
      console.error('No Firestore instance available, returning mock ID');
      return `mock-reward-${Date.now()}`;
    }
    
    const formattedReward = formatForFirestore(rewardWithDefaults);
    const rewardsRef = collection(db, 'rewards');
    const docRef = await addDoc(rewardsRef, formattedReward);
    
    console.log(`Successfully created reward with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating reward:', error);
    return `mock-reward-${Date.now()}`;
  }
};

// Update an existing reward (admin only)
export const updateReward = async (rewardId: string, updates: Partial<Reward>): Promise<boolean> => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock update reward: ${rewardId}`);
      return true;
    }
    
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date()
    };
    
    const formattedUpdates = formatForFirestore(updatesWithTimestamp);
    await setDoc(doc(getRewardsCollection(), rewardId), formattedUpdates, { merge: true });
    
    console.log(`Successfully updated reward: ${rewardId}`);
    return true;
  } catch (error) {
    console.error('Error updating reward:', error);
    return false;
  }
};

// Delete (deactivate) a reward (admin only)
export const deleteReward = async (rewardId: string): Promise<boolean> => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock delete reward: ${rewardId}`);
      return true;
    }
    
    // Soft delete by marking as inactive
    await updateReward(rewardId, { isActive: false });
    console.log(`Successfully deactivated reward: ${rewardId}`);
    return true;
  } catch (error) {
    console.error('Error deleting reward:', error);
    return false;
  }
};

// Check if user can redeem a reward
export const canRedeemReward = async (userId: string, rewardId: string): Promise<{ canRedeem: boolean; reason?: string }> => {
  try {
    const reward = await getReward(rewardId);
    if (!reward) {
      return { canRedeem: false, reason: 'Reward not found' };
    }
    
    if (!reward.isActive) {
      return { canRedeem: false, reason: 'Reward is no longer available' };
    }
    
    // Check if reward has expired
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
      return { canRedeem: false, reason: 'Reward has expired' };
    }
    
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return { canRedeem: false, reason: 'User profile not found' };
    }
    
    // Check points balance
    const currentPoints = userProfile.points?.current || 0;
    if (currentPoints < reward.pointsCost) {
      return { canRedeem: false, reason: `Need ${reward.pointsCost - currentPoints} more points` };
    }
    
    // Check level requirement
    if (reward.minLevel && (userProfile.level || 1) < reward.minLevel) {
      return { canRedeem: false, reason: `Requires level ${reward.minLevel}` };
    }
    
    // Check stock
    if (reward.hasStock && !reward.isUnlimited && (reward.stockCount || 0) <= 0) {
      return { canRedeem: false, reason: 'Out of stock' };
    }
    
    // Check cooldown if not repeatable or has cooldown
    if (reward.cooldownDays && reward.cooldownDays > 0) {
      // Get user's recent redemptions for this reward
      const recentRedemptions = await getUserRedemptions(userId, reward.familyId);
      const recentForThisReward = recentRedemptions.filter(r => 
        r.rewardId === rewardId && 
        r.status !== 'cancelled' &&
        new Date(r.redeemedAt) > new Date(Date.now() - reward.cooldownDays! * 24 * 60 * 60 * 1000)
      );
      
      if (recentForThisReward.length > 0) {
        const lastRedemption = recentForThisReward[0];
        const cooldownEnds = new Date(new Date(lastRedemption.redeemedAt).getTime() + reward.cooldownDays! * 24 * 60 * 60 * 1000);
        return { canRedeem: false, reason: `Available again on ${cooldownEnds.toLocaleDateString()}` };
      }
    }
    
    return { canRedeem: true };
  } catch (error) {
    console.error('Error checking reward redemption eligibility:', error);
    return { canRedeem: false, reason: 'Unable to check eligibility' };
  }
};

// Redeem a reward
export const redeemReward = async (userId: string, rewardId: string, notes?: string): Promise<{ success: boolean; redemptionId?: string; error?: string }> => {
  if (shouldReturnMockImmediately()) {
    return { success: true, redemptionId: `mock-redemption-${Date.now()}` };
  }
  
  try {
    // Check eligibility first
    const eligibility = await canRedeemReward(userId, rewardId);
    if (!eligibility.canRedeem) {
      return { success: false, error: eligibility.reason };
    }
    
    const reward = await getReward(rewardId);
    const userProfile = await getUserProfile(userId);
    
    if (!reward || !userProfile) {
      return { success: false, error: 'Reward or user not found' };
    }
    
    if (isMockImplementation()) {
      console.log(`Mock redeem reward: ${reward.name} for user ${userId}`);
      return { success: true, redemptionId: `mock-redemption-${Date.now()}` };
    }
    
    const db = getFirestore();
    if (!db) {
      return { success: false, error: 'Database not available' };
    }
    
    // Create redemption record
    const redemption: Omit<RewardRedemption, 'id'> = {
      rewardId,
      rewardName: reward.name,
      userId,
      userName: userProfile.displayName || 'Unknown User',
      familyId: reward.familyId,
      pointsSpent: reward.pointsCost,
      redeemedAt: new Date(),
      status: 'pending', // Default to pending approval
      notes: notes || ''
    };
    
    const formattedRedemption = formatForFirestore(redemption);
    const redemptionsRef = collection(db, 'redemptions');
    const redemptionDoc = await addDoc(redemptionsRef, formattedRedemption);
    
    // Deduct points from user
    const newPointsBalance = (userProfile.points?.current || 0) - reward.pointsCost;
    await createOrUpdateUserProfile(userId, {
      points: {
        current: newPointsBalance,
        lifetime: userProfile.points?.lifetime || 0,
        weekly: userProfile.points?.weekly || 0
      }
    });
    
    // Update family member points as well
    const family = await getFamily(reward.familyId);
    if (family) {
      const memberInFamily = family.members.find((m: FamilyMember) => m.uid === userId);
      if (memberInFamily) {
        await updateFamilyMember(family.id!, userId, {
          points: {
            current: newPointsBalance,
            lifetime: memberInFamily.points?.lifetime || 0,
            weekly: memberInFamily.points?.weekly || 0
          }
        });
      }
    }
    
    // Update stock if applicable
    if (reward.hasStock && !reward.isUnlimited && reward.stockCount && reward.stockCount > 0) {
      await updateReward(rewardId, {
        stockCount: reward.stockCount - 1
      });
    }
    
    console.log(`Successfully redeemed reward: ${reward.name} for user ${userId}`);
    return { success: true, redemptionId: redemptionDoc.id };
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return { success: false, error: 'Failed to redeem reward' };
  }
};

// Get user's redemption history
export const getUserRedemptions = async (userId: string, familyId: string): Promise<RewardRedemption[]> => {
  if (shouldReturnMockImmediately()) {
    return [];
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock get user redemptions for: ${userId}`);
      return [];
    }
    
    const db = getFirestore();
    if (!db) {
      return [];
    }
    
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(
      redemptionsRef, 
      where('userId', '==', userId),
      where('familyId', '==', familyId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RewardRedemption[];
  } catch (error) {
    console.error('Error getting user redemptions:', error);
    return [];
  }
};

// Get all redemptions for a family (admin view)
export const getFamilyRedemptions = async (familyId: string): Promise<RewardRedemption[]> => {
  if (shouldReturnMockImmediately()) {
    return [];
  }
  
  try {
    const effectiveFamilyId = getDefaultFamilyId(auth.currentUser?.uid);
    
    if (isMockImplementation()) {
      console.log(`Mock get family redemptions for: ${effectiveFamilyId}`);
      return [];
    }
    
    const db = getFirestore();
    if (!db) {
      return [];
    }
    
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(redemptionsRef, where('familyId', '==', effectiveFamilyId));
    const querySnapshot = await getDocs(q);
    
    const redemptions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RewardRedemption[];
    
    // Sort by redemption date (newest first)
    return redemptions.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
  } catch (error) {
    console.error('Error getting family redemptions:', error);
    return [];
  }
};

// Update redemption status (admin only)
export const updateRedemptionStatus = async (
  redemptionId: string, 
  status: RewardRedemption['status'], 
  adminId: string,
  adminNotes?: string
): Promise<boolean> => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock update redemption status: ${redemptionId} to ${status}`);
      return true;
    }
    
    const updates: Partial<RewardRedemption> = {
      status
    };
    
    if (status === 'approved') {
      updates.approvedBy = adminId;
      updates.approvedAt = new Date();
    } else if (status === 'completed') {
      updates.completedAt = new Date();
    }
    
    if (adminNotes) {
      updates.adminNotes = adminNotes;
    }
    
    const formattedUpdates = formatForFirestore(updates);
    await setDoc(doc(getRedemptionsCollection(), redemptionId), formattedUpdates, { merge: true });
    
    console.log(`Successfully updated redemption ${redemptionId} to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating redemption status:', error);
    return false;
  }
};

// Daily Points Tracking Functions

// Update daily points record when a chore is completed
export const updateDailyPoints = async (
  userId: string, 
  familyId: string, 
  pointsToAdd: number
): Promise<void> => {
  if (shouldReturnMockImmediately()) {
    return;
  }
  
  try {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (isMockImplementation()) {
      console.log(`Mock update daily points: ${userId} on ${dateKey} +${pointsToAdd}`);
      return;
    }
    
    const db = getFirestore();
    if (!db) return;
    
    // Create document ID based on user and date
    const docId = `${userId}_${dateKey}`;
    const dailyPointsRef = doc(db, 'dailyPoints', docId);
    
    // Check if record exists
    const docSnap = await getDoc(dailyPointsRef);
    
    if (docSnap.exists()) {
      const currentData = docSnap.data() as DailyPointsRecord;
      await setDoc(dailyPointsRef, {
        points: (currentData.points || 0) + pointsToAdd,
        choreCount: (currentData.choreCount || 0) + 1,
        updatedAt: today.toISOString()
      }, { merge: true });
    } else {
      // Create new record
      const newRecord: DailyPointsRecord = {
        userId,
        familyId,
        date: dateKey,
        points: pointsToAdd,
        choreCount: 1,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };
      await setDoc(dailyPointsRef, formatForFirestore(newRecord));
    }
  } catch (error) {
    console.error('Error updating daily points:', error);
  }
};

// Get 7-day rolling window data for a user
export const getWeeklyPointsData = async (
  userId: string,
  familyId: string
): Promise<WeeklyPointsData> => {
  if (shouldReturnMockImmediately()) {
    return getMockWeeklyData(userId);
  }
  
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Include today, so -6 for 7 days total
    
    if (isMockImplementation()) {
      return getMockWeeklyData(userId);
    }
    
    const db = getFirestore();
    if (!db) {
      return getMockWeeklyData(userId);
    }
    
    // Query for the last 7 days of data
    const dailyPointsRef = collection(db, 'dailyPoints');
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const q = query(
      dailyPointsRef,
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => doc.data() as DailyPointsRecord);
    
    // Create a map for easy lookup
    const pointsMap = new Map<string, DailyPointsRecord>();
    records.forEach(record => {
      pointsMap.set(record.date, record);
    });
    
    // Build the 7-day array with zeros for missing days
    const dailyPoints: { date: string; points: number; choreCount: number }[] = [];
    let totalPoints = 0;
    let totalChores = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const record = pointsMap.get(dateKey);
      const points = record?.points || 0;
      const choreCount = record?.choreCount || 0;
      
      dailyPoints.push({
        date: dateKey,
        points,
        choreCount
      });
      
      totalPoints += points;
      totalChores += choreCount;
    }
    
    // Calculate week number
    const weekNumber = getWeekNumber(today);
    
    return {
      userId,
      startDate,
      endDate,
      dailyPoints,
      totalPoints,
      totalChores,
      weekNumber,
      year: today.getFullYear()
    };
  } catch (error) {
    console.error('Error getting weekly points data:', error);
    return getMockWeeklyData(userId);
  }
};

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Get mock weekly data for development
const getMockWeeklyData = (userId: string): WeeklyPointsData => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  
  const dailyPoints = [];
  let totalPoints = 0;
  let totalChores = 0;
  
  // Generate random data for the past 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    
    const points = Math.floor(Math.random() * 50) + 10;
    const choreCount = Math.floor(Math.random() * 5) + 1;
    
    dailyPoints.push({
      date: dateKey,
      points,
      choreCount
    });
    
    totalPoints += points;
    totalChores += choreCount;
  }
  
  return {
    userId,
    startDate: sevenDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    dailyPoints,
    totalPoints,
    totalChores,
    weekNumber: getWeekNumber(today),
    year: today.getFullYear()
  };
};

// Get weekly comparison data (current week vs previous weeks)
export const getWeeklyComparison = async (
  userId: string,
  familyId: string,
  weeksToCompare: number = 4
): Promise<WeeklyPointsData[]> => {
  if (shouldReturnMockImmediately()) {
    return getMockWeeklyComparison(userId, weeksToCompare);
  }
  
  try {
    const weeks: WeeklyPointsData[] = [];
    const today = new Date();
    
    for (let i = 0; i < weeksToCompare; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay()); // Start of week
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week
      
      // For simplicity in this version, we'll just get the current week data
      // In a full implementation, you'd query historical data
      if (i === 0) {
        const weekData = await getWeeklyPointsData(userId, familyId);
        weeks.push(weekData);
      } else {
        // For now, return mock data for previous weeks
        weeks.push(getMockWeeklyData(userId));
      }
    }
    
    return weeks;
  } catch (error) {
    console.error('Error getting weekly comparison:', error);
    return getMockWeeklyComparison(userId, weeksToCompare);
  }
};

// Get mock weekly comparison data
const getMockWeeklyComparison = (userId: string, weeks: number): WeeklyPointsData[] => {
  const comparison: WeeklyPointsData[] = [];
  
  for (let i = 0; i < weeks; i++) {
    comparison.push(getMockWeeklyData(userId));
  }
  
  return comparison;
};

// Weekly Reset Functions

// Check if weekly points should be reset based on family settings
export const shouldResetWeeklyPoints = async (familyId: string): Promise<boolean> => {
  try {
    const family = await getFamily(familyId);
    if (!family) return false;
    
    const weekStartDay = family.settings?.weekStartDay || 0; // Default to Sunday
    const lastResetKey = `lastWeeklyReset_${familyId}`;
    
    // Get last reset date from local storage or database
    const lastResetStr = localStorage?.getItem?.(lastResetKey) || null;
    const lastReset = lastResetStr ? new Date(lastResetStr) : null;
    
    const now = new Date();
    const currentDay = now.getDay();
    
    // Check if we've passed the week start day since last reset
    if (!lastReset) {
      return true; // First time, should reset
    }
    
    // Calculate days since last reset
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    
    // If it's been 7 or more days, reset
    if (daysSinceReset >= 7) {
      return true;
    }
    
    // Check if we've crossed the week boundary
    const lastResetDay = lastReset.getDay();
    if (currentDay === weekStartDay && lastResetDay !== weekStartDay && daysSinceReset > 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking weekly reset:', error);
    return false;
  }
};

// Reset weekly points for all family members
export const resetWeeklyPoints = async (familyId: string): Promise<boolean> => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    const family = await getFamily(familyId);
    if (!family || !family.id) return false;
    
    if (isMockImplementation()) {
      console.log(`Mock reset weekly points for family: ${familyId}`);
      // Store reset timestamp
      localStorage?.setItem?.(`lastWeeklyReset_${familyId}`, new Date().toISOString());
      return true;
    }
    
    // Reset weekly points for all members
    const updatePromises = family.members.map(async (member: FamilyMember) => {
      // Update member in family
      await updateFamilyMember(family.id!, member.uid, {
        points: {
          ...member.points,
          weekly: 0,
        }
      });
      
      // Update user profile
      const userProfile = await getUserProfile(member.uid);
      if (userProfile) {
        await createOrUpdateUserProfile(member.uid, {
          points: {
            current: userProfile.points?.current || 0,
            lifetime: userProfile.points?.lifetime || 0,
            weekly: 0,
          }
        });
      }
    });
    
    await Promise.all(updatePromises);
    
    // Store reset timestamp
    localStorage?.setItem?.(`lastWeeklyReset_${familyId}`, new Date().toISOString());
    
    console.log(`Successfully reset weekly points for family ${familyId}`);
    return true;
  } catch (error) {
    console.error('Error resetting weekly points:', error);
    return false;
  }
};

// Get all family members' weekly progress
export const getFamilyWeeklyProgress = async (familyId: string): Promise<{
  familyTotal: number;
  memberProgress: Array<{
    userId: string;
    userName: string;
    weeklyData: WeeklyPointsData;
  }>;
}> => {
  if (shouldReturnMockImmediately()) {
    return getMockFamilyWeeklyProgress();
  }
  
  try {
    const family = await getFamily(familyId);
    if (!family) {
      return getMockFamilyWeeklyProgress();
    }
    
    const memberProgress = await Promise.all(
      family.members
        .filter((m: FamilyMember) => m.isActive)
        .map(async (member: FamilyMember) => {
          const weeklyData = await getWeeklyPointsData(member.uid, familyId);
          return {
            userId: member.uid,
            userName: member.name,
            weeklyData,
          };
        })
    );
    
    const familyTotal = memberProgress.reduce(
      (sum, member) => sum + member.weeklyData.totalPoints,
      0
    );
    
    return {
      familyTotal,
      memberProgress,
    };
  } catch (error) {
    console.error('Error getting family weekly progress:', error);
    return getMockFamilyWeeklyProgress();
  }
};

// Mock family weekly progress
const getMockFamilyWeeklyProgress = () => {
  const members = ['Alice', 'Bob', 'Charlie'];
  const memberProgress = members.map((name, index) => ({
    userId: `user-${index}`,
    userName: name,
    weeklyData: getMockWeeklyData(`user-${index}`),
  }));
  
  const familyTotal = memberProgress.reduce(
    (sum, member) => sum + member.weeklyData.totalPoints,
    0
  );
  
  return {
    familyTotal,
    memberProgress,
  };
}; 