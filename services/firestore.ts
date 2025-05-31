import { auth, isMockImplementation, safeCollection } from '../config/firebase';
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
  WeeklyPointsData,
  Pet,
  PetChore,
  PetCareRecord,
  EnhancedStreak,
  RoomType
} from '../types';
import { 
  processChoreCompletion, 
  applyCompletionRewards,
  calculateStreakBonus,
  updateEnhancedStreak,
  initializeEnhancedStreak,
  calculateCompoundStreakMultiplier,
  checkStreakMilestones,
  getChoreCategory,
  countActiveStreaks
} from './gamification';
import {
  logPointTransaction,
  checkPointMilestones,
  calculateAdvancedPoints,
  PointCalculationFactors
} from './pointsService';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
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
// const DEFAULT_FAMILY_ID = 'demo-family-id'; // DISABLED: No longer forcing demo family


// Mock data for fallback
const mockChores: Chore[] = [
  {
    id: 'mock-chore-1',
    title: 'Clean Living Room',
    description: 'Vacuum, dust surfaces, and organize items',
    type: 'family',
    difficulty: 'medium',
    points: 15,
    assignedTo: 'test-user-1',
    assignedToName: 'Emma Smith',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: 'guest-admin-user',
    familyId: 'demo-family-qj7fep',
    status: 'open'
  },
  {
    id: 'mock-chore-2',
    title: 'Load Dishwasher',
    description: 'Load dirty dishes and start the dishwasher',
    type: 'family',
    difficulty: 'easy',
    points: 8,
    assignedTo: 'test-user-2',
    assignedToName: 'Sarah Smith',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: 'guest-admin-user',
    familyId: 'demo-family-qj7fep',
    status: 'open'
  },
  {
    id: 'mock-chore-3',
    title: 'Take Out Trash',
    description: 'Collect trash from all rooms and take to curb',
    type: 'family',
    difficulty: 'easy',
    points: 10,
    assignedTo: 'guest-admin-user',
    assignedToName: 'John Smith',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    createdBy: 'guest-admin-user',
    familyId: 'demo-family-qj7fep',
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
  
  // Convert Date objects to ISO strings and remove undefined values
  Object.keys(formattedData).forEach(key => {
    if (formattedData[key] instanceof Date) {
      formattedData[key] = formattedData[key].toISOString();
    } else if (formattedData[key] === undefined) {
      // Remove undefined values as Firestore doesn't accept them
      delete formattedData[key];
    }
  });
  
  console.log("Formatted data for Firestore:", formattedData);
  return formattedData;
};

// Ensure we have a consistent family ID for the demo
export const getDefaultFamilyId = (_userId?: string) => {
  // DISABLED: No longer forcing demo family ID
  // This function should not be used in production
  console.warn('getDefaultFamilyId called - this should not happen in production');
  return null;
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
    // const familyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId
    console.log(`Getting chores for family ${familyId}, using mock: ${isMockImplementation()}, requested family: ${familyId}`);
    
    // If we're using mock, return mock data for better demo
    if (isMockImplementation()) {
      console.log('Using mock chores data');
      
      // Check for expired cooldowns and unlock chores
      const now = new Date();
      mockChores.forEach((chore, index) => {
        if (chore.lockedUntil && new Date(chore.lockedUntil) <= now && chore.status === 'completed') {
          mockChores[index] = {
            ...chore,
            status: 'open',
            lockedUntil: undefined,
            completedBy: undefined,
            completedAt: undefined
          };
          console.log(`Unlocked chore: ${chore.title}`);
        }
      });
      
      return mockChores;
    }
    
    // Always use the effective family ID for consistency, regardless of what was passed in
    console.log(`Using effective family ID: ${familyId} for query`);
    
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
    const q = query(choresRef, where('familyId', '==', familyId));
    console.log('Executing query');
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.docs.length} chores in Firestore for family ${familyId}`);
    
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
    
    console.log(`Returning ${fetchedChores.length} chores after filtering for family ${familyId}`);
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
    // Use the familyId from the chore object
    const familyId = chore.familyId;
    
    // Log the family ID being used
    console.log(`Creating chore with family ID: ${familyId}`);
    
    // Make sure to set the family ID and other required fields
    const choreWithFamilyId = {
      ...chore,
      familyId: familyId,
      createdAt: new Date(),
      // Explicitly set deleted flag to false to prevent filtering issues
      deleted: false
    };
    
    console.log(`Adding chore: ${chore.title}, using mock: ${isMockImplementation()}, family: ${familyId}`);
    
    // If using mock, just generate a mock ID
    if (isMockImplementation()) {
      return `mock-id-${Date.now()}`;
    }
    
    
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
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // For mock implementation, simulate the full completion flow
    if (shouldReturnMockImmediately() || isMockImplementation()) {
      console.log(`Mock complete chore: ${choreId}`);
      
      // Find the chore in mock data
      const choreIndex = mockChores.findIndex(c => c.id === choreId);
      if (choreIndex === -1) throw new Error('Chore not found');
      
      const chore = mockChores[choreIndex];
      
      // Update the chore status and add cooldown
      const cooldownHours = 24; // Default cooldown
      const lockedUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
      
      // For family chores, rotate to next family member after cooldown
      let nextAssignee = chore.assignedTo;
      let nextAssigneeName = chore.assignedToName;
      
      if (chore.type === 'family') {
        // Simple rotation: cycle through family members
        const familyMembers = [
          { uid: 'guest-admin-user', name: 'John Smith' },
          { uid: 'test-user-1', name: 'Emma Smith' },
          { uid: 'test-user-2', name: 'Sarah Smith' }
        ];
        
        const currentIndex = familyMembers.findIndex(m => m.uid === chore.assignedTo);
        const nextIndex = (currentIndex + 1) % familyMembers.length;
        nextAssignee = familyMembers[nextIndex].uid;
        nextAssigneeName = familyMembers[nextIndex].name;
      }
      
      mockChores[choreIndex] = {
        ...chore,
        status: 'open', // Reset to open after cooldown
        completedBy: currentUser.uid,
        completedAt: new Date(),
        lockedUntil: lockedUntil,
        completionCount: (chore.completionCount || 0) + 1,
        assignedTo: nextAssignee,
        assignedToName: nextAssigneeName
      };
      
      // Create a mock completion reward
      const mockReward: CompletionReward = {
        pointsEarned: chore.points,
        xpEarned: Math.round(chore.points * 0.5), // Basic XP calculation
        achievementsUnlocked: [],
        streakBonus: 1.1 // Small bonus
      };
      
      console.log(`Mock chore completed: ${chore.title}, earned ${chore.points} points, locked until ${lockedUntil.toLocaleTimeString()}`);
      return { success: true, reward: mockReward };
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

    // 1. Update enhanced streak tracking
    // Maintain legacy streak for backward compatibility
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

    // Enhanced streak tracking
    let enhancedStreaks = userProfile.streaks || initializeEnhancedStreak();
    
    // Check if this is a perfect day (all assigned chores completed)
    // For now, we'll assume it's not perfect unless we can verify
    // In the future, we could query for all user's assigned chores and check completion status
    const isAllChoresCompleted = false; // TODO: Implement perfect day detection
    
    // Update enhanced streaks
    enhancedStreaks = updateEnhancedStreak(
      enhancedStreaks,
      chore,
      today,
      isAllChoresCompleted
    );
    
    // Check for streak milestones
    const achievedMilestones = checkStreakMilestones(enhancedStreaks);

    // 2. Calculate completion count
    const completionCount = (chore.completionCount || 0) + 1;

    // 3. Calculate advanced points with dynamic factors
    const pointFactors: PointCalculationFactors = {
      basePoints: chore.points,
      difficulty: chore.difficulty,
      timeOfDay: today,
      isEarlyCompletion: new Date(chore.dueDate) > today,
      isWeekend: today.getDay() === 0 || today.getDay() === 6,
      // Add more factors as needed based on chore metadata
    };
    
    const advancedPoints = calculateAdvancedPoints(pointFactors);
    
    // 4. Process gamification rewards (XP, achievements, levels)
    const reward = await processChoreCompletion(
      currentUser.uid,
      advancedPoints, // Use enhanced point calculation
      chore.difficulty,
      completionCount,
      getUserProfile,
      enhancedStreaks // Pass enhanced streaks for achievement checking
    );

    console.log('Completion reward calculated:', reward);

    // 5. Apply enhanced streak bonus to points
    const compoundStreakMultiplier = calculateCompoundStreakMultiplier(enhancedStreaks);
    const legacyStreakBonus = calculateStreakBonus(streak.current); // Keep for backward compatibility
    
    // Use the higher of the two bonuses (enhanced or legacy)
    const streakBonus = Math.max(compoundStreakMultiplier, legacyStreakBonus);
    const finalPoints = Math.round(reward.pointsEarned * streakBonus);
    
    // Add milestone bonus points if any were achieved
    const milestoneBonus = achievedMilestones.reduce((total, milestone) => total + milestone.bonusPoints, 0);
    const totalFinalPoints = finalPoints + milestoneBonus;
    
    // 6. Log detailed point transaction (including milestone bonuses)
    await logPointTransaction({
      userId: currentUser.uid,
      familyId: chore.familyId,
      type: 'earned',
      amount: totalFinalPoints,
      source: 'chore',
      sourceId: choreId,
      description: `Completed chore: ${chore.title}${milestoneBonus > 0 ? ` + streak milestone bonus` : ''}`,
      metadata: {
        choreTitle: chore.title,
        basePoints: reward.pointsEarned,
        streakBonus: streakBonus > 1 ? streakBonus : undefined,
        compoundMultiplier: compoundStreakMultiplier > 1 ? compoundStreakMultiplier : undefined,
        milestoneBonus: milestoneBonus > 0 ? milestoneBonus : undefined,
        achievedMilestones: achievedMilestones.length > 0 ? achievedMilestones.map(m => m.title) : undefined
      }
    });

    // 7. Check for point milestones
    const previousLifetimePoints = userProfile.points?.lifetime || 0;
    const newLifetimePoints = previousLifetimePoints + totalFinalPoints;
    const newMilestones = await checkPointMilestones(
      currentUser.uid,
      newLifetimePoints,
      previousLifetimePoints
    );
    
    // Award milestone bonus points
    let pointMilestoneBonus = 0;
    for (const milestone of newMilestones) {
      if (milestone.unlockRewards?.bonusPoints) {
        pointMilestoneBonus += milestone.unlockRewards.bonusPoints;
        await logPointTransaction({
          userId: currentUser.uid,
          familyId: chore.familyId,
          type: 'bonus',
          amount: milestone.unlockRewards.bonusPoints,
          source: 'milestone',
          sourceId: milestone.id,
          description: `Milestone bonus: ${milestone.title}`,
          metadata: {
            milestoneLevel: milestone.level
          }
        });
      }
    }
    
    // 8. Update user profile with all rewards and enhanced streaks
    const totalPointsEarned = totalFinalPoints + pointMilestoneBonus;
    const updatedUserProfile = {
      points: {
        current: (userProfile.points?.current || 0) + totalPointsEarned,
        lifetime: newLifetimePoints + pointMilestoneBonus,
        weekly: (userProfile.points?.weekly || 0) + totalPointsEarned,
      },
      streak, // Keep legacy streak for backward compatibility
      streaks: enhancedStreaks, // Add enhanced streak system
      updatedAt: today,
    };

    // Apply gamification rewards (XP, level, achievements)
    await applyCompletionRewards(currentUser.uid, reward, streak.current, getUserProfile, createOrUpdateUserProfile, enhancedStreaks);
    
    // Update basic profile data
    await createOrUpdateUserProfile(currentUser.uid, updatedUserProfile);
    
    // Update family member points as well for dashboard display
    const memberInFamily = family.members.find((m: FamilyMember) => m.uid === currentUser.uid);
    if (memberInFamily) {
      await updateFamilyMember(family.id!, currentUser.uid, {
        points: {
          current: (memberInFamily.points?.current || 0) + totalPointsEarned,
          lifetime: (memberInFamily.points?.lifetime || 0) + totalPointsEarned,
          weekly: (memberInFamily.points?.weekly || 0) + totalPointsEarned,
        },
        streak, // Update legacy streak for compatibility
        streaks: enhancedStreaks, // Update enhanced streaks
      });
    }

    // Update daily points tracking for the 7-day rolling window
    await updateDailyPoints(currentUser.uid, chore.familyId, totalPointsEarned);

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

    // 8. Log completion record for analytics (with enhanced streak data)
    const completionRecord: Omit<ChoreCompletionRecord, 'id'> = {
      choreId,
      userId: currentUser.uid,
      completedAt: today,
      pointsEarned: totalPointsEarned, // Include all bonuses
      xpEarned: reward.xpEarned + achievedMilestones.reduce((total, milestone) => total + milestone.bonusXP, 0),
      streakDay: streak.current,
      bonusMultiplier: streakBonus > 1 ? streakBonus : undefined,
      achievementsUnlocked: reward.achievementsUnlocked?.map(a => a.id),
      familyId: chore.familyId,
      // Enhanced streak analytics
      enhancedStreaks: {
        overallStreak: enhancedStreaks.overall.current,
        categoryStreak: enhancedStreaks.categories[getChoreCategory(chore)]?.current || 0,
        perfectDayStreak: enhancedStreaks.perfectDay.current,
        earlyBirdStreak: enhancedStreaks.earlyBird.current,
        compoundMultiplier: compoundStreakMultiplier > 1 ? compoundStreakMultiplier : undefined,
        milestonesAchieved: achievedMilestones.length > 0 ? achievedMilestones.map(m => m.title) : undefined
      },
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
        pointsEarned: totalPointsEarned, // Update with all bonuses (streak + milestones)
        streakBonus: streakBonus > 1 ? streakBonus : undefined,
        compoundStreakMultiplier: compoundStreakMultiplier > 1 ? compoundStreakMultiplier : undefined,
        milestonesAchieved: achievedMilestones,
        enhancedStreaks: {
          overallStreak: enhancedStreaks.overall.current,
          longestStreak: enhancedStreaks.overall.longest,
          categoryStreak: enhancedStreaks.categories[getChoreCategory(chore)]?.current || 0,
          perfectDayStreak: enhancedStreaks.perfectDay.current,
          earlyBirdStreak: enhancedStreaks.earlyBird.current,
          activeStreaksCount: countActiveStreaks(enhancedStreaks)
        }
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
    // Import the new rotation service
    const { rotationService } = await import('./rotationService');
    
    // Check if this chore was taken over - if so, return it to the original assignee
    if (chore.originalAssignee && chore.originalAssignee !== chore.assignedTo) {
      // Ensure the original assignee is still active
      const originalMember = family.members.find(m => m.uid === chore.originalAssignee);
      if (originalMember && originalMember.isActive) {
        await updateChore(chore.id!, {
          assignedTo: chore.originalAssignee,
          assignedToName: chore.originalAssigneeName || originalMember.name,
          status: 'open',
          lockedUntil: lockedUntil.toISOString(),
          // Clear takeover fields since we're returning to original
          takenOverBy: undefined,
          takenOverByName: undefined,
          takenOverAt: undefined,
          takeoverReason: undefined,
        });
        console.log(`Chore ${chore.id} returned to original assignee ${originalMember.name}`);
        return;
      }
    }

    // Use enhanced rotation logic if family has rotation settings
    const hasAdvancedRotation = family.rotationSettings && family.rotationSettings.defaultStrategy;
    
    if (hasAdvancedRotation) {
      // Use new comprehensive rotation system
      const activeMembers = family.members.filter(m => m.isActive);
      
      if (activeMembers.length === 0) {
        await updateChore(chore.id!, {
          assignedTo: '',
          assignedToName: '',
          status: 'open',
          lockedUntil: lockedUntil.toISOString(),
        });
        console.warn('No active members for rotation. Chore left unassigned.');
        return;
      }

      const rotationContext = {
        familyId: family.id!,
        choreId: chore.id!,
        currentAssignee: chore.assignedTo,
        availableMembers: activeMembers,
        familySettings: family.rotationSettings || {
          defaultStrategy: 'round_robin' as any,
          fairnessWeight: 0.7,
          preferenceWeight: 0.5,
          availabilityWeight: 0.8,
          enableIntelligentScheduling: false,
          maxChoresPerMember: 10,
          rotationCooldownHours: 24,
          seasonalAdjustments: false,
          autoRebalancingEnabled: false,
          emergencyFallbackEnabled: true,
          strategyConfigs: {
            'round_robin': { strategy: 'round_robin' as any, parameters: {}, enabled: true },
            'workload_balance': { strategy: 'workload_balance' as any, parameters: {}, enabled: false },
            'skill_based': { strategy: 'skill_based' as any, parameters: {}, enabled: false },
            'calendar_aware': { strategy: 'calendar_aware' as any, parameters: {}, enabled: false },
            'random_fair': { strategy: 'random_fair' as any, parameters: {}, enabled: false },
            'preference_based': { strategy: 'preference_based' as any, parameters: {}, enabled: false },
            'mixed_strategy': { strategy: 'mixed_strategy' as any, parameters: {}, enabled: false }
          }
        },
        currentWorkloads: [], // Will be calculated by rotation service
        scheduleConstraints: [],
        emergencyMode: false
      };

      const rotationResult = await rotationService.determineNextAssignee(
        chore,
        family,
        rotationContext
      );

      if (rotationResult.success && rotationResult.assignedMemberId) {
        // Apply the rotation assignment
        await updateChore(chore.id!, {
          assignedTo: rotationResult.assignedMemberId,
          assignedToName: rotationResult.assignedMemberName || '',
          status: 'open',
          lockedUntil: lockedUntil.toISOString(),
          // Clear any takeover fields since this is a new rotation assignment
          originalAssignee: undefined,
          originalAssigneeName: undefined,
          takenOverBy: undefined,
          takenOverByName: undefined,
          takenOverAt: undefined,
          takeoverReason: undefined,
          missedBy: undefined,
          // Store rotation metadata
          lastRotationStrategy: rotationResult.strategy,
          lastRotationScore: rotationResult.fairnessScore,
        });

        // Log rotation decision for analytics
        console.log(`Enhanced rotation: ${chore.title} assigned to ${rotationResult.assignedMemberName} using ${rotationResult.strategy} strategy (score: ${rotationResult.fairnessScore})`);
        
        // Update family rotation analytics if available
        if (family.rotationAnalytics) {
          const updatedAnalytics = {
            ...family.rotationAnalytics,
            totalRotations: (family.rotationAnalytics.totalRotations || 0) + 1,
            lastRotationAt: new Date().toISOString()
          };
          
          await updateFamily(family.id!, {
            rotationAnalytics: updatedAnalytics
          });
        }
        
        return;
        
      } else {
        console.warn(`Enhanced rotation failed: ${rotationResult.errorMessage}. Falling back to basic rotation.`);
        // Fall through to basic rotation logic
      }
    }

    // Fallback to basic rotation logic (existing implementation)
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
          // Clear any takeover fields since this is a new rotation assignment
          originalAssignee: undefined,
          originalAssigneeName: undefined,
          takenOverBy: undefined,
          takenOverByName: undefined,
          takenOverAt: undefined,
          takeoverReason: undefined,
          missedBy: undefined,
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

// Takeover and collaboration functions
export const canTakeoverChore = (chore: Chore, currentUser: User, family: Family) => {
  // Check if user can take over this chore
  // Business rules:
  // 1. User must be part of the family
  // 2. Chore must be assigned to someone else (not the current user)
  // 3. Chore must not be completed
  // 4. User must be active in the family
  
  const isFamilyMember = family.members.some(m => m.uid === currentUser.uid && m.isActive);
  const isAssignedToOther = chore.assignedTo && chore.assignedTo !== currentUser.uid;
  const isNotCompleted = chore.status === 'open';
  
  return isFamilyMember && isAssignedToOther && isNotCompleted;
};

export const takeoverChore = async (choreId: string, takingOverUserId: string, takingOverUserName: string, reason?: string) => {
  try {
    const choresCollection = getChoresCollection();
    if (!choresCollection) return null;

    // Get the current chore data
    const choreDoc = await getDoc(doc(choresCollection, choreId));
    if (!choreDoc.exists()) {
      throw new Error('Chore not found');
    }

    const chore = { id: choreDoc.id, ...choreDoc.data() } as Chore;

    // Validate takeover is allowed
    if (chore.status !== 'open') {
      throw new Error('Chore is already completed or not available');
    }

    if (!chore.assignedTo) {
      throw new Error('Chore is not assigned to anyone. Use claim instead.');
    }

    if (chore.assignedTo === takingOverUserId) {
      throw new Error('Chore is already assigned to you');
    }

    // Update the chore with takeover information
    const updateData: Partial<Chore> = {
      // Store original assignee info if this is the first takeover
      originalAssignee: chore.originalAssignee || chore.assignedTo,
      originalAssigneeName: chore.originalAssigneeName || chore.assignedToName,
      
      // Update current assignment
      assignedTo: takingOverUserId,
      assignedToName: takingOverUserName,
      
      // Track takeover details
      takenOverBy: takingOverUserId,
      takenOverByName: takingOverUserName,
      takenOverAt: new Date().toISOString(),
      takeoverReason: reason || 'helping',
      
      // Add to missed list if not already there
      missedBy: chore.missedBy 
        ? (chore.missedBy.includes(chore.assignedTo) ? chore.missedBy : [...chore.missedBy, chore.assignedTo])
        : [chore.assignedTo],
        
      updatedAt: new Date().toISOString()
    };

    await updateDoc(doc(choresCollection, choreId), updateData);

    // Log the takeover for analytics
    console.log(`Chore ${choreId} taken over by ${takingOverUserName} from ${chore.assignedToName}`);

    return { ...chore, ...updateData };
  } catch (error) {
    console.error('Error taking over chore:', error);
    throw error;
  }
};

// Claim function for unassigned chores
export const claimChore = async (choreId: string, claimingUserId: string, claimingUserName: string) => {
  try {
    const choresCollection = getChoresCollection();
    if (!choresCollection) return null;

    // Get the current chore data
    const choreDoc = await getDoc(doc(choresCollection, choreId));
    if (!choreDoc.exists()) {
      throw new Error('Chore not found');
    }

    const chore = { id: choreDoc.id, ...choreDoc.data() } as Chore;

    // Validate claim is allowed
    if (chore.status !== 'open') {
      throw new Error('Chore is already completed or not available');
    }

    if (chore.assignedTo) {
      throw new Error('Chore is already assigned to someone. Use takeover instead.');
    }

    // Update the chore with claim information
    const updateData: Partial<Chore> = {
      assignedTo: claimingUserId,
      assignedToName: claimingUserName,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(doc(choresCollection, choreId), updateData);

    console.log(`Chore ${choreId} claimed by ${claimingUserName}`);

    return { ...chore, ...updateData };
  } catch (error) {
    console.error('Error claiming chore:', error);
    throw error;
  }
};

// Mock family data
const mockFamily: Family = {
  id: 'demo-family-qj7fep',
  name: 'Smith Family',
  adminId: 'guest-admin-user',
  joinCode: 'SMITH1',
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [
    {
      uid: 'guest-admin-user',
      name: 'John Smith',
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
      name: 'Emma Smith',
      email: 'emma@example.com',
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
      name: 'Sarah Smith',
      email: 'sarah@example.com',
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
    // For mock mode, ensure the current user is included in the family
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Check if current user is already in the mock family
      const isUserInFamily = mockFamily.members.some(m => m.uid === currentUser.uid);
      
      if (!isUserInFamily) {
        // Add current user as admin to the mock family
        const userMember = {
          uid: currentUser.uid,
          name: currentUser.displayName || 'Guest User',
          email: currentUser.email || 'guest@familyclean.app',
          role: 'admin' as const,
          familyRole: 'parent' as const,
          points: {
            current: 100,
            lifetime: 100,
            weekly: 25
          },
          photoURL: currentUser.photoURL,
          joinedAt: new Date(),
          isActive: true
        };
        
        // Return mock family with current user as the admin
        return {
          ...mockFamily,
          id: mockFamily.id, // Ensure ID is included
          adminId: currentUser.uid,
          members: [userMember, ...mockFamily.members.slice(1)] // Replace first member with current user
        };
      }
    }
    
    // Ensure mock family always has an ID
    return { ...mockFamily, id: mockFamily.id || 'demo-family-qj7fep' };
  }
  
  try {
    // Use default family ID for consistency
    // const familyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId
    
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
    
    console.log(`Checking for family with ID: ${familyId}`);
    
    // Get Firestore instance
    const db = getFirestore();
    if (!db) {
      console.error('No Firestore instance available, returning mock family');
      return mockFamily;
    }
    
    // Check if family exists
    const familyDocRef = doc(db, 'families', familyId);
    const familySnapshot = await getDoc(familyDocRef);
    
    // If family exists, return it
    if (familySnapshot.exists()) {
      console.log(`Found existing family: ${familyId}`);
      return { id: familySnapshot.id, ...familySnapshot.data() } as Family;
    } 
    
    // Otherwise, create a default family (for demo purposes)
    console.log(`Family not found, creating default family: ${familyId}`);
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
    console.log(`Creating new family with ID ${familyId}:`, formattedFamily);
    await setDoc(doc(db, 'families', familyId), formattedFamily);
    
    // Verify the family was created
    const verifyDoc = await getDoc(doc(db, 'families', familyId));
    if (verifyDoc.exists()) {
      console.log(`Successfully verified family in Firestore with ID: ${familyId}`);
    } else {
      console.error(`Family with ID ${familyId} was not found after creation!`);
    }
    
    return { id: familyId, ...defaultFamily } as Family;
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
    const familyId = getDefaultFamilyId(userId); // Re-enabled with userId parameter
    
    // Check if familyId is null (function is disabled)
    if (!familyId) {
      console.log('getDefaultFamilyId returned null - falling back to mock family');
      return mockFamily;
    }
    
    // For demo purposes, just get the family directly
    return await getFamily(familyId);
  } catch (error) {
    console.error('Error getting user family:', error);
    return null;
  }
};

export const createFamily = async (family: Omit<Family, 'id' | 'createdAt'>) => {
  if (shouldReturnMockImmediately()) {
    // Return the same ID as the mock family for consistency
    return mockFamily.id;
  }
  
  try {
    // For mock implementation, generate a unique ID
    if (isMockImplementation()) {
      const mockFamilyId = `mock-family-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Creating mock family: ${family.name} with ID: ${mockFamilyId}`);
      return mockFamilyId;
    }
    
    // Format data for Firestore
    const formattedFamily = formatForFirestore({
      ...family,
      createdAt: new Date()
    });
    
    // For real Firebase, let Firestore generate a unique ID
    console.log(`Creating family with auto-generated ID:`, formattedFamily);
    const docRef = await addDoc(getFamiliesCollection(), formattedFamily);
    
    console.log(`Family created with unique ID: ${docRef.id}`);
    return docRef.id;
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
      console.log(`[Firestore] Mock create/update user profile: ${userId}`, userData);
      console.log(`[Firestore] User familyId being saved:`, userData.familyId);
      try {
        // Update the user in mock database
        await getUsersCollection().doc(userId).set(userData, { merge: true });
        console.log(`[Firestore] Mock user profile saved successfully`);
        return true;
      } catch (mockSaveError) {
        console.error(`[Firestore] Error saving mock user profile:`, mockSaveError);
        return false;
      }
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
    // Return a complete mock user profile for John Smith with family setup
    return {
      uid: userId,
      email: 'guest@familyclean.app',
      displayName: 'John Smith',
      photoURL: null,
      familyId: 'demo-family-qj7fep',
      points: {
        current: 100,
        lifetime: 500,
        weekly: 25
      },
      xp: {
        current: 150,
        total: 350,
        toNextLevel: 100
      },
      level: 3,
      streak: {
        current: 5,
        longest: 12,
        lastCompletedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      achievements: ['first_chore', 'streak_3', 'chores_10'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`[Firestore] Mock getUserProfile for: ${userId}`);
      try {
        // Try to get from mock database first
        const userDoc = await getUsersCollection().doc(userId).get();
        console.log(`[Firestore] Mock database query result - exists: ${userDoc.exists}`);
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`[Firestore] Found mock user profile:`, userData);
          console.log(`[Firestore] Mock user familyId:`, userData?.familyId);
          return userData;
        }
        
        // Fallback for mock user
        console.log(`[Firestore] No mock user profile found, returning basic mock data`);
        return {
          uid: userId,
          email: 'mock@example.com',
          displayName: 'Mock User',
          photoURL: null,
          familyId: undefined, // Explicitly showing this is undefined
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (mockError) {
        console.error(`[Firestore] Error accessing mock database:`, mockError);
        // Return basic mock data on error
        return {
          uid: userId,
          email: 'mock@example.com',
          displayName: 'Mock User',
          photoURL: null,
          familyId: undefined, // Explicitly showing this is undefined
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
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
    // const familyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId
    console.log(`Getting rewards for family ${familyId}, using mock: ${isMockImplementation()}`);
    
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
    const q = query(rewardsRef, where('familyId', '==', familyId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const rewards = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Reward[];
    
    console.log(`Returning ${rewards.length} rewards for family ${familyId}`);
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
    // Use the familyId from the reward object
    const familyId = reward.familyId;
    
    const rewardWithDefaults = {
      ...reward,
      familyId: familyId,
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
    // const familyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId
    
    if (isMockImplementation()) {
      console.log(`Mock get family redemptions for: ${familyId}`);
      return [];
    }
    
    const db = getFirestore();
    if (!db) {
      return [];
    }
    
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(redemptionsRef, where('familyId', '==', familyId));
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
  _familyId: string, 
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
        familyId: _familyId,
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
  _familyId: string
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

// Pet Management Integration
const getPetsCollection = () => safeCollection('pets');
const getPetCareRecordsCollection = () => safeCollection('petCareRecords');

// Add support for pet chores in the existing addChore function
// This extends the current chore system to handle pet-specific chores

// Room-based Chore Management Functions
export const getChoresByRoom = async (familyId: string, roomId: string): Promise<Chore[]> => {
  // Fast path for iOS
  if (shouldReturnMockImmediately()) {
    return mockChores.filter(chore => 
      chore.familyId === familyId && chore.roomId === roomId
    );
  }

  try {
    // const familyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId
    
    if (isMockImplementation()) {
      return mockChores.filter(chore => 
        chore.familyId === familyId && chore.roomId === roomId
      );
    }

    const q = query(
      getChoresCollection(),
      where('familyId', '==', familyId),
      where('roomId', '==', roomId),
      where('deleted', '!=', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      };
    }) as Chore[];
  } catch (error) {
    console.error('Error getting chores by room:', error);
    return [];
  }
};

export const getChoresByRoomType = async (familyId: string, roomType: string): Promise<Chore[]> => {
  // Fast path for iOS
  if (shouldReturnMockImmediately()) {
    return mockChores.filter(chore => 
      chore.familyId === familyId && chore.roomType === roomType
    );
  }

  try {
    // const familyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId
    
    if (isMockImplementation()) {
      return mockChores.filter(chore => 
        chore.familyId === familyId && chore.roomType === roomType
      );
    }

    const q = query(
      getChoresCollection(),
      where('familyId', '==', familyId),
      where('roomType', '==', roomType),
      where('deleted', '!=', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data
      };
    }) as Chore[];
  } catch (error) {
    console.error('Error getting chores by room type:', error);
    return [];
  }
};

export const getFilteredChores = async (
  familyId: string, 
  filters: {
    roomId?: string;
    roomType?: string;
    type?: string;
    assignedTo?: string;
    status?: string;
  } = {}
): Promise<Chore[]> => {
  try {
    const allChores = await getChores(familyId);
    
    let filteredChores = allChores;

    // Apply room filters
    if (filters.roomId) {
      filteredChores = filteredChores.filter(chore => chore.roomId === filters.roomId);
    }

    if (filters.roomType) {
      filteredChores = filteredChores.filter(chore => chore.roomType === filters.roomType);
    }

    // Apply other filters
    if (filters.type) {
      filteredChores = filteredChores.filter(chore => chore.type === filters.type);
    }

    if (filters.assignedTo) {
      filteredChores = filteredChores.filter(chore => chore.assignedTo === filters.assignedTo);
    }

    if (filters.status) {
      filteredChores = filteredChores.filter(chore => chore.status === filters.status);
    }

    return filteredChores;
  } catch (error) {
    console.error('Error getting filtered chores:', error);
    return [];
  }
};

// Enhanced chore creation with room support
export const createRoomChore = async (
  chore: Omit<Chore, 'id'>,
  roomId: string,
  roomName: string,
  roomType: RoomType
): Promise<string> => {
  const roomChore: Omit<Chore, 'id'> = {
    ...chore,
    type: 'room',
    roomId,
    roomName,
    roomType
  };

  return await createChore(roomChore);
};

// Get room assignments for chore assignment logic
export const getUserAssignedRooms = async (userId: string, familyId: string): Promise<string[]> => {
  try {
    // This would typically query the room assignments
    // For now, we'll return an empty array as a placeholder
    // In a full implementation, you'd query the roomAssignments collection
    return [];
  } catch (error) {
    console.error('Error getting user assigned rooms:', error);
    return [];
  }
};

// Get family completion records for fairness calculations
export const getFamilyCompletionRecords = async (familyId: string, daysBack: number = 30): Promise<ChoreCompletionRecord[]> => {
  if (shouldReturnMockImmediately()) {
    return [];
  }
  
  try {
    if (isMockImplementation()) {
      console.log(`Mock get family completion records for: ${familyId}, ${daysBack} days`);
      // Return mock completion records for testing
      return [
        {
          choreId: 'mock-chore-1',
          userId: 'member-1',
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          pointsEarned: 15,
          xpEarned: 20,
          streakDay: 3,
          familyId
        },
        {
          choreId: 'mock-chore-2',
          userId: 'member-2',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          pointsEarned: 20,
          xpEarned: 25,
          streakDay: 1,
          familyId
        }
      ] as ChoreCompletionRecord[];
    }
    
    const db = getFirestore();
    if (!db) {
      return [];
    }
    
    // Calculate the date threshold
    const dateThreshold = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    
    const completionsRef = collection(db, 'choreCompletions');
    const q = query(
      completionsRef,
      where('familyId', '==', familyId),
      where('completedAt', '>=', dateThreshold.toISOString())
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as ChoreCompletionRecord[];
  } catch (error) {
    console.error('Error getting family completion records:', error);
    return [];
  }
}; 