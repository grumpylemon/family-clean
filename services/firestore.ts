import { auth, isMockImplementation, safeCollection } from '@/config/firebase';
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { Platform } from 'react-native';

// Version to confirm updates (v9)
console.log("Firestore service version: v9");

// Types
export interface Chore {
  id?: string;
  title: string;
  description?: string;
  points: number;
  assignedTo: string;
  assignedToName?: string;
  completedBy?: string;
  completedAt?: Date | string;
  dueDate: Date | string;
  createdAt: Date | string;
  familyId: string;
}

export interface Family {
  id?: string;
  name: string;
  adminId: string;
  createdAt: Date | string;
  members: FamilyMember[];
}

export interface FamilyMember {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'child';
  points: number;
  photoURL?: string;
}

// Collection references using the safe collection helper
const choresCollection = safeCollection('chores');
const familiesCollection = safeCollection('families');
const usersCollection = safeCollection('users');

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
    points: 10,
    assignedTo: 'mock-user-id',
    assignedToName: 'Demo User',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    familyId: 'test-family-id'
  },
  {
    id: 'mock-chore-2',
    title: 'Demo Chore: Do Dishes',
    description: 'Another demo chore from mock implementation',
    points: 5,
    assignedTo: 'mock-user-id',
    assignedToName: 'Demo User',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    familyId: 'test-family-id'
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
    
    const choreDoc = await choresCollection.doc(choreId).get();
    if (choreDoc.exists) {
      return { id: choreDoc.id, ...choreDoc.data() } as Chore;
    } else {
      throw new Error('Chore not found');
    }
  } catch (error) {
    console.error('Error getting chore:', error);
    throw error;
  }
};

export const addChore = async (chore: Omit<Chore, 'id'>) => {
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
    await choresCollection.doc(choreId).set(formattedChore, { merge: true });
    
    // Verify the update
    const verifyDoc = await choresCollection.doc(choreId).get();
    if (verifyDoc.exists) {
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
    
    console.log(`Marking chore ${choreId} as deleted`);
    
    // Instead of actually deleting, mark as deleted
    await choresCollection.doc(choreId).set({ deleted: true }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error deleting chore:', error);
    return false;
  }
};

export const completeChore = async (choreId: string) => {
  if (shouldReturnMockImmediately()) {
    return true;
  }
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    // For mock implementation, we would update the UI state directly
    if (isMockImplementation()) {
      console.log(`Mock complete chore: ${choreId}`);
      return true;
    }
    
    const completionData = formatForFirestore({
      completedBy: currentUser.uid,
      completedAt: new Date()
    });
    
    console.log(`Marking chore ${choreId} as completed`);
    
    await choresCollection.doc(choreId).set(completionData, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error completing chore:', error);
    return false;
  }
};

// Mock family data
const mockFamily: Family = {
  id: 'mock-family-id',
  name: 'Demo Family',
  adminId: 'mock-admin-id',
  createdAt: new Date(),
  members: [
    {
      uid: 'mock-user-id',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'admin',
      points: 100,
      photoURL: 'https://via.placeholder.com/150'
    }
  ]
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
      console.log(`Getting mock family: ${effectiveFamilyId}`);
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
    const defaultFamily = {
      name: auth.currentUser?.displayName ? `${auth.currentUser.displayName}'s Family` : 'Demo Family',
      adminId: auth.currentUser?.uid || 'unknown',
      createdAt: new Date(),
      members: [{
        uid: auth.currentUser?.uid || 'unknown',
        name: auth.currentUser?.displayName || 'Demo User',
        email: auth.currentUser?.email || 'unknown@example.com',
        role: 'admin',
        points: 0,
        photoURL: auth.currentUser?.photoURL || undefined
      }]
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
    await familiesCollection.doc(effectiveFamilyId).set(formattedFamily);
    
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
    
    await familiesCollection.doc(familyId).set(formattedData, { merge: true });
    
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
    
    const familyDoc = await familiesCollection.doc(familyId).get();
    if (!familyDoc.exists) throw new Error('Family not found');
    
    const familyData = familyDoc.data() as Family;
    const updatedMembers = [...(familyData.members || []), member];
    
    console.log(`Adding member ${member.name} to family ${familyId}`);
    
    await familiesCollection.doc(familyId).set({
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
    
    const familyDoc = await familiesCollection.doc(familyId).get();
    if (!familyDoc.exists) throw new Error('Family not found');
    
    const familyData = familyDoc.data() as Family;
    const members = familyData.members || [];
    const memberIndex = members.findIndex(m => m.uid === userId);
    
    if (memberIndex === -1) throw new Error('Member not found in family');
    
    const updatedMembers = [...members];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      ...updates
    };
    
    console.log(`Updating member ${userId} in family ${familyId}`);
    
    await familiesCollection.doc(familyId).set({
      members: updatedMembers
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating family member:', error);
    return false;
  }
}; 