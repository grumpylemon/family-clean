import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { auth, safeCollection } from '../config/firebase';
import { 
  Pet, 
  PetType, 
  PetChoreTemplate, 
  PetCareRecord, 
  PetWellbeingMetrics,
  PetChore,
  ChoreDifficulty
} from '../types';

// Pet CRUD Operations
export const createPet = async (petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const petsCollection = safeCollection('pets');
    if (!petsCollection) {
      throw new Error('Failed to initialize pets collection');
    }

    const now = new Date().toISOString();
    const docRef = await addDoc(petsCollection, {
      ...petData,
      createdAt: now,
      updatedAt: now,
    });

    console.log('Pet created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating pet:', error);
    throw new Error('Failed to create pet');
  }
};

export const updatePet = async (petId: string, updates: Partial<Pet>): Promise<void> => {
  try {
    const petsCollection = safeCollection('pets');
    if (!petsCollection) {
      throw new Error('Failed to initialize pets collection');
    }

    const petRef = doc(petsCollection, petId);
    await updateDoc(petRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    console.log('Pet updated successfully:', petId);
  } catch (error) {
    console.error('Error updating pet:', error);
    throw new Error('Failed to update pet');
  }
};

export const deletePet = async (petId: string): Promise<void> => {
  try {
    const petsCollection = safeCollection('pets');
    if (!petsCollection) {
      throw new Error('Failed to initialize pets collection');
    }

    const petRef = doc(petsCollection, petId);
    await deleteDoc(petRef);

    console.log('Pet deleted successfully:', petId);
  } catch (error) {
    console.error('Error deleting pet:', error);
    throw new Error('Failed to delete pet');
  }
};

export const getPetsByFamily = async (familyId: string): Promise<Pet[]> => {
  try {
    const petsCollection = safeCollection('pets');
    if (!petsCollection) {
      console.warn('Pets collection not available, returning empty array');
      return [];
    }

    const q = query(
      petsCollection, 
      where('familyId', '==', familyId),
      where('isActive', '==', true),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const pets: Pet[] = [];

    querySnapshot.forEach((doc) => {
      pets.push({
        id: doc.id,
        ...doc.data(),
      } as Pet);
    });

    console.log(`Found ${pets.length} pets for family ${familyId}`);
    return pets;
  } catch (error) {
    console.error('Error fetching pets:', error);
    return [];
  }
};

export const getPetById = async (petId: string): Promise<Pet | null> => {
  try {
    const petsCollection = safeCollection('pets');
    if (!petsCollection) {
      return null;
    }

    const petRef = doc(petsCollection, petId);
    const petDoc = await getDoc(petRef);

    if (!petDoc.exists()) {
      return null;
    }

    return {
      id: petDoc.id,
      ...petDoc.data(),
    } as Pet;
  } catch (error) {
    console.error('Error fetching pet:', error);
    return null;
  }
};

// Pet Chore Templates - Predefined templates for automatic chore generation
export const getPetChoreTemplates = (): PetChoreTemplate[] => {
  return [
    // Dog templates
    {
      id: 'dog-feed-morning',
      name: 'Morning Feeding',
      description: 'Provide morning meal and fresh water',
      petTypes: ['dog'],
      points: 5,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: true,
      category: 'feeding',
    },
    {
      id: 'dog-feed-evening',
      name: 'Evening Feeding', 
      description: 'Provide evening meal and fresh water',
      petTypes: ['dog'],
      points: 5,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: true,
      category: 'feeding',
    },
    {
      id: 'dog-walk',
      name: 'Walk the Dog',
      description: 'Take for a walk to get exercise and fresh air',
      petTypes: ['dog'],
      points: 10,
      difficulty: 'medium' as ChoreDifficulty,
      frequencyHours: 12,
      isRequired: true,
      category: 'exercise',
      conditions: {
        petSize: ['medium', 'large'],
        activityLevel: ['medium', 'high'],
      },
    },
    {
      id: 'dog-play',
      name: 'Play Time',
      description: 'Interactive play session with toys',
      petTypes: ['dog'],
      points: 8,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: false,
      category: 'play',
    },
    {
      id: 'dog-groom',
      name: 'Brush and Groom',
      description: 'Brush fur and basic grooming care',
      petTypes: ['dog'],
      points: 12,
      difficulty: 'medium' as ChoreDifficulty,
      frequencyHours: 168, // Weekly
      isRequired: false,
      category: 'grooming',
    },
    
    // Cat templates
    {
      id: 'cat-feed-morning',
      name: 'Morning Cat Food',
      description: 'Provide morning meal and fresh water',
      petTypes: ['cat'],
      points: 5,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: true,
      category: 'feeding',
    },
    {
      id: 'cat-feed-evening',
      name: 'Evening Cat Food',
      description: 'Provide evening meal and fresh water',
      petTypes: ['cat'],
      points: 5,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: true,
      category: 'feeding',
    },
    {
      id: 'cat-litter-clean',
      name: 'Clean Litter Box',
      description: 'Scoop and clean the litter box',
      petTypes: ['cat'],
      points: 8,
      difficulty: 'medium' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: true,
      category: 'cleaning',
    },
    {
      id: 'cat-play',
      name: 'Cat Play Session',
      description: 'Interactive play with cat toys',
      petTypes: ['cat'],
      points: 7,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: false,
      category: 'play',
    },
    {
      id: 'cat-groom',
      name: 'Brush Cat',
      description: 'Brush fur and check for mats',
      petTypes: ['cat'],
      points: 10,
      difficulty: 'medium' as ChoreDifficulty,
      frequencyHours: 72, // Every 3 days
      isRequired: false,
      category: 'grooming',
    },

    // Universal pet templates
    {
      id: 'pet-health-check',
      name: 'Daily Health Check',
      description: 'Check pet for any signs of illness or injury',
      petTypes: ['dog', 'cat', 'bird', 'rabbit'],
      points: 6,
      difficulty: 'easy' as ChoreDifficulty,
      frequencyHours: 24,
      isRequired: true,
      category: 'health',
    },
    {
      id: 'pet-area-clean',
      name: 'Clean Pet Area',
      description: 'Clean and tidy pet living space',
      petTypes: ['dog', 'cat', 'bird', 'fish', 'hamster', 'rabbit'],
      points: 10,
      difficulty: 'medium' as ChoreDifficulty,
      frequencyHours: 168, // Weekly
      isRequired: true,
      category: 'cleaning',
    },
  ];
};

// Generate chores for a specific pet based on templates
export const generateChoresForPet = (
  pet: Pet, 
  familyId: string, 
  assignToUserId?: string
): Omit<PetChore, 'id' | 'createdAt'>[] => {
  const templates = getPetChoreTemplates();
  const applicableTemplates = templates.filter(template => {
    // Check if template applies to this pet type
    if (!template.petTypes.includes(pet.type)) {
      return false;
    }

    // Check conditions if they exist
    if (template.conditions) {
      const { petAge, petSize, activityLevel } = template.conditions;
      
      if (petAge && pet.age) {
        if (petAge.min && pet.age < petAge.min) return false;
        if (petAge.max && pet.age > petAge.max) return false;
      }
      
      if (petSize && pet.size && !petSize.includes(pet.size)) {
        return false;
      }
      
      if (activityLevel && pet.activityLevel && !activityLevel.includes(pet.activityLevel)) {
        return false;
      }
    }

    return true;
  });

  const now = new Date();
  
  return applicableTemplates.map(template => ({
    title: `${template.name} for ${pet.name}`,
    description: template.description,
    type: 'pet' as const,
    petId: pet.id!,
    petName: pet.name,
    careCategory: template.category,
    difficulty: template.difficulty,
    points: template.points,
    assignedTo: assignToUserId || '', // Will be assigned by rotation logic
    dueDate: new Date(now.getTime() + (template.frequencyHours * 60 * 60 * 1000)).toISOString(),
    familyId: familyId,
    status: 'open' as const,
    autoGenerated: true,
    templateId: template.id,
    isUrgent: template.isRequired,
    createdBy: 'system',
    cooldownHours: Math.max(template.frequencyHours - 2, 1), // Slight overlap prevention
  }));
};

// Pet care tracking
export const recordPetCare = async (record: Omit<PetCareRecord, 'id'>): Promise<string> => {
  try {
    const careCollection = safeCollection('petCareRecords');
    if (!careCollection) {
      throw new Error('Failed to initialize pet care records collection');
    }

    const docRef = await addDoc(careCollection, record);
    console.log('Pet care record created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error recording pet care:', error);
    throw new Error('Failed to record pet care');
  }
};

export const getPetCareHistory = async (petId: string, limit: number = 50): Promise<PetCareRecord[]> => {
  try {
    const careCollection = safeCollection('petCareRecords');
    if (!careCollection) {
      return [];
    }

    const q = query(
      careCollection,
      where('petId', '==', petId),
      orderBy('completedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records: PetCareRecord[] = [];

    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
      } as PetCareRecord);
    });

    return records.slice(0, limit);
  } catch (error) {
    console.error('Error fetching pet care history:', error);
    return [];
  }
};

// Pet wellbeing calculations
export const calculatePetWellbeing = async (petId: string, date: string): Promise<PetWellbeingMetrics> => {
  try {
    const careRecords = await getPetCareHistory(petId, 100);
    const dayStart = new Date(date);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Filter records for the specific date
    const dayRecords = careRecords.filter(record => {
      const recordDate = new Date(record.completedAt);
      return recordDate >= dayStart && recordDate < dayEnd;
    });

    // Calculate scores based on care completion
    const feedingScore = dayRecords.some(r => r.careType === 'feeding') ? 100 : 0;
    const exerciseScore = dayRecords.some(r => r.careType === 'exercise') ? 100 : 0;
    const groomingScore = dayRecords.some(r => r.careType === 'grooming') ? 100 : 50; // Not daily
    const healthScore = dayRecords.some(r => r.careType === 'vet' || r.careType === 'medication') ? 100 : 80;

    // Overall happiness calculation
    const overallHappiness = Math.round((feedingScore + exerciseScore + groomingScore + healthScore) / 4);

    // Calculate consistency (simplified for now)
    const careConsistency = dayRecords.length > 0 ? Math.min(dayRecords.length * 25, 100) : 0;

    return {
      petId,
      date,
      feedingScore,
      exerciseScore,
      groomingScore,
      healthScore,
      overallHappiness,
      missedCareCount: 0, // Would be calculated based on expected vs actual care
      careConsistency,
    };
  } catch (error) {
    console.error('Error calculating pet wellbeing:', error);
    // Return default scores on error
    return {
      petId,
      date,
      feedingScore: 0,
      exerciseScore: 0,
      groomingScore: 0,
      healthScore: 0,
      overallHappiness: 0,
      missedCareCount: 0,
      careConsistency: 0,
    };
  }
};

// Helper function to get pet chore templates by pet type
export const getTemplatesForPetType = (petType: PetType): PetChoreTemplate[] => {
  const allTemplates = getPetChoreTemplates();
  return allTemplates.filter(template => template.petTypes.includes(petType));
};

// Helper function to check if a pet needs urgent care
export const checkUrgentCareNeeded = async (pet: Pet): Promise<string[]> => {
  const urgentNeeds: string[] = [];
  const now = new Date();
  const careHistory = await getPetCareHistory(pet.id!, 20);

  // Check last feeding (more than 12 hours ago)
  const lastFeeding = careHistory.find(record => record.careType === 'feeding');
  if (!lastFeeding) {
    urgentNeeds.push('First feeding needed');
  } else {
    const lastFeedingTime = new Date(lastFeeding.completedAt);
    const hoursSinceFeeding = (now.getTime() - lastFeedingTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceFeeding > 12) {
      urgentNeeds.push('Feeding overdue');
    }
  }

  // Check exercise for dogs (more than 24 hours)
  if (pet.type === 'dog') {
    const lastExercise = careHistory.find(record => record.careType === 'exercise');
    if (!lastExercise) {
      urgentNeeds.push('Exercise needed');
    } else {
      const lastExerciseTime = new Date(lastExercise.completedAt);
      const hoursSinceExercise = (now.getTime() - lastExerciseTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceExercise > 24) {
        urgentNeeds.push('Exercise overdue');
      }
    }
  }

  return urgentNeeds;
};