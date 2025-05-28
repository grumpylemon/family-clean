import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { auth, safeCollection } from '../config/firebase';
import { 
  Room, 
  RoomAssignment, 
  RoomChoreTemplate, 
  RoomType, 
  RoomSharingType,
  ChoreDifficulty,
  Chore 
} from '../types';

// Get collections with proper error handling
const getRoomsCollection = () => safeCollection('rooms');
const getRoomAssignmentsCollection = () => safeCollection('roomAssignments');
const getChoresCollection = () => safeCollection('chores');

// Room CRUD Operations
export const createRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create rooms');
    }

    const room: Omit<Room, 'id'> = {
      ...roomData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      isActive: true,
      assignedMembers: roomData.assignedMembers || []
    };

    const docRef = await addDoc(getRoomsCollection(), room);
    
    return {
      ...room,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
};

export const updateRoom = async (roomId: string, updates: Partial<Room>): Promise<void> => {
  try {
    const roomRef = doc(getRoomsCollection(), roomId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(roomRef, updateData);
  } catch (error) {
    console.error('Error updating room:', error);
    throw new Error('Failed to update room');
  }
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  try {
    const roomRef = doc(getRoomsCollection(), roomId);
    
    // Soft delete by setting isActive to false
    await updateDoc(roomRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    // Also remove room assignments
    await removeAllRoomAssignments(roomId);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error('Failed to delete room');
  }
};

export const getFamilyRooms = async (familyId: string): Promise<Room[]> => {
  try {
    const q = query(
      getRoomsCollection(),
      where('familyId', '==', familyId),
      where('isActive', '==', true),
      orderBy('type'),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    const rooms: Room[] = [];
    
    querySnapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      } as Room);
    });
    
    return rooms;
  } catch (error) {
    console.error('Error fetching family rooms:', error);
    return [];
  }
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  try {
    const roomRef = doc(getRoomsCollection(), roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      return {
        id: roomDoc.id,
        ...roomDoc.data()
      } as Room;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching room:', error);
    return null;
  }
};

// Room Assignment Operations
export const assignMemberToRoom = async (
  roomId: string, 
  userId: string, 
  userName: string, 
  familyId: string,
  isPrimary: boolean = false,
  responsibilities?: string[]
): Promise<RoomAssignment> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to assign members');
    }

    // Get room details
    const room = await getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if assignment already exists
    const existingAssignment = await getRoomAssignment(roomId, userId);
    if (existingAssignment) {
      throw new Error('Member is already assigned to this room');
    }

    const assignment: Omit<RoomAssignment, 'id'> = {
      roomId,
      roomName: room.name,
      userId,
      userName,
      familyId,
      isPrimary,
      responsibilities: responsibilities || [],
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser.uid
    };

    const docRef = await addDoc(getRoomAssignmentsCollection(), assignment);

    // Update room's assigned members list
    const updatedAssignedMembers = [...(room.assignedMembers || []), userId];
    await updateRoom(roomId, { 
      assignedMembers: updatedAssignedMembers,
      primaryAssignee: isPrimary ? userId : room.primaryAssignee
    });

    return {
      ...assignment,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error assigning member to room:', error);
    throw new Error('Failed to assign member to room');
  }
};

export const removeMemberFromRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    // Get the assignment
    const assignment = await getRoomAssignment(roomId, userId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Delete the assignment
    const assignmentRef = doc(getRoomAssignmentsCollection(), assignment.id!);
    await deleteDoc(assignmentRef);

    // Update room's assigned members list
    const room = await getRoom(roomId);
    if (room) {
      const updatedAssignedMembers = room.assignedMembers.filter(id => id !== userId);
      const updateData: Partial<Room> = { 
        assignedMembers: updatedAssignedMembers 
      };

      // If removing primary assignee, clear it
      if (room.primaryAssignee === userId) {
        updateData.primaryAssignee = undefined;
      }

      await updateRoom(roomId, updateData);
    }
  } catch (error) {
    console.error('Error removing member from room:', error);
    throw new Error('Failed to remove member from room');
  }
};

export const getRoomAssignment = async (roomId: string, userId: string): Promise<RoomAssignment | null> => {
  try {
    const q = query(
      getRoomAssignmentsCollection(),
      where('roomId', '==', roomId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as RoomAssignment;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching room assignment:', error);
    return null;
  }
};

export const getUserRoomAssignments = async (userId: string, familyId: string): Promise<RoomAssignment[]> => {
  try {
    const q = query(
      getRoomAssignmentsCollection(),
      where('userId', '==', userId),
      where('familyId', '==', familyId)
    );
    
    const querySnapshot = await getDocs(q);
    const assignments: RoomAssignment[] = [];
    
    querySnapshot.forEach((doc) => {
      assignments.push({
        id: doc.id,
        ...doc.data()
      } as RoomAssignment);
    });
    
    return assignments;
  } catch (error) {
    console.error('Error fetching user room assignments:', error);
    return [];
  }
};

export const getRoomAssignments = async (roomId: string): Promise<RoomAssignment[]> => {
  try {
    const q = query(
      getRoomAssignmentsCollection(),
      where('roomId', '==', roomId)
    );
    
    const querySnapshot = await getDocs(q);
    const assignments: RoomAssignment[] = [];
    
    querySnapshot.forEach((doc) => {
      assignments.push({
        id: doc.id,
        ...doc.data()
      } as RoomAssignment);
    });
    
    return assignments;
  } catch (error) {
    console.error('Error fetching room assignments:', error);
    return [];
  }
};

export const removeAllRoomAssignments = async (roomId: string): Promise<void> => {
  try {
    const assignments = await getRoomAssignments(roomId);
    
    for (const assignment of assignments) {
      if (assignment.id) {
        const assignmentRef = doc(getRoomAssignmentsCollection(), assignment.id);
        await deleteDoc(assignmentRef);
      }
    }
  } catch (error) {
    console.error('Error removing room assignments:', error);
    throw new Error('Failed to remove room assignments');
  }
};

// Room Chore Templates
export const getDefaultRoomChoreTemplates = (): RoomChoreTemplate[] => {
  return [
    // Kitchen Templates
    {
      id: 'kitchen_dishes',
      name: 'Wash Dishes',
      description: 'Clean all dishes, utensils, and cookware',
      roomTypes: ['kitchen'],
      points: 15,
      difficulty: 'easy',
      frequencyHours: 12,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'assigned_members',
      estimatedMinutes: 20
    },
    {
      id: 'kitchen_counters',
      name: 'Wipe Down Counters',
      description: 'Clean and sanitize all kitchen counters',
      roomTypes: ['kitchen'],
      points: 10,
      difficulty: 'easy',
      frequencyHours: 24,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'assigned_members',
      estimatedMinutes: 10
    },
    {
      id: 'kitchen_floor',
      name: 'Sweep/Mop Kitchen Floor',
      description: 'Sweep and mop the kitchen floor',
      roomTypes: ['kitchen'],
      points: 20,
      difficulty: 'medium',
      frequencyHours: 48,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'rotating',
      estimatedMinutes: 25
    },
    
    // Bathroom Templates
    {
      id: 'bathroom_clean',
      name: 'Clean Bathroom',
      description: 'Clean toilet, sink, mirror, and counter',
      roomTypes: ['bathroom'],
      points: 25,
      difficulty: 'medium',
      frequencyHours: 72,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'assigned_members',
      estimatedMinutes: 30
    },
    {
      id: 'bathroom_trash',
      name: 'Empty Bathroom Trash',
      description: 'Empty trash and replace liner',
      roomTypes: ['bathroom'],
      points: 5,
      difficulty: 'easy',
      frequencyHours: 168,
      isRequired: true,
      category: 'maintenance',
      assignmentStrategy: 'assigned_members',
      estimatedMinutes: 5
    },
    
    // Bedroom Templates
    {
      id: 'bedroom_make_bed',
      name: 'Make Bed',
      description: 'Make bed with pillows and covers',
      roomTypes: ['bedroom'],
      points: 8,
      difficulty: 'easy',
      frequencyHours: 24,
      isRequired: false,
      category: 'organizing',
      assignmentStrategy: 'primary_only',
      estimatedMinutes: 5
    },
    {
      id: 'bedroom_tidy',
      name: 'Tidy Bedroom',
      description: 'Put away clothes and personal items',
      roomTypes: ['bedroom'],
      points: 15,
      difficulty: 'easy',
      frequencyHours: 48,
      isRequired: true,
      category: 'organizing',
      assignmentStrategy: 'primary_only',
      estimatedMinutes: 15
    },
    
    // Living Room Templates
    {
      id: 'living_room_vacuum',
      name: 'Vacuum Living Room',
      description: 'Vacuum carpets and rugs',
      roomTypes: ['living_room'],
      points: 20,
      difficulty: 'medium',
      frequencyHours: 168,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'rotating',
      estimatedMinutes: 20
    },
    {
      id: 'living_room_dust',
      name: 'Dust Living Room',
      description: 'Dust furniture, electronics, and decorations',
      roomTypes: ['living_room'],
      points: 18,
      difficulty: 'medium',
      frequencyHours: 168,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'assigned_members',
      estimatedMinutes: 25
    },
    
    // General Templates
    {
      id: 'general_trash',
      name: 'Empty Trash',
      description: 'Empty trash and replace liner',
      roomTypes: ['bedroom', 'office', 'playroom'],
      points: 5,
      difficulty: 'easy',
      frequencyHours: 168,
      isRequired: true,
      category: 'maintenance',
      assignmentStrategy: 'assigned_members',
      estimatedMinutes: 5
    },
    {
      id: 'laundry_room_clean',
      name: 'Clean Laundry Room',
      description: 'Wipe down machines and organize supplies',
      roomTypes: ['laundry_room'],
      points: 15,
      difficulty: 'easy',
      frequencyHours: 168,
      isRequired: true,
      category: 'cleaning',
      assignmentStrategy: 'anyone',
      estimatedMinutes: 15
    }
  ];
};

// Generate room-based chores
export const generateRoomChores = async (
  familyId: string, 
  roomId: string, 
  templates?: RoomChoreTemplate[]
): Promise<Chore[]> => {
  try {
    const room = await getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const choreTemplates = templates || getDefaultRoomChoreTemplates();
    const applicableTemplates = choreTemplates.filter(template => 
      template.roomTypes.includes(room.type)
    );

    const generatedChores: Chore[] = [];

    for (const template of applicableTemplates) {
      // Determine who should be assigned
      let assignedTo = '';
      
      switch (template.assignmentStrategy) {
        case 'primary_only':
          assignedTo = room.primaryAssignee || room.assignedMembers[0] || '';
          break;
        case 'assigned_members':
          assignedTo = room.assignedMembers[0] || '';
          break;
        case 'rotating':
          // For now, assign to first member (rotation logic would be more complex)
          assignedTo = room.assignedMembers[0] || '';
          break;
        case 'anyone':
          // Leave unassigned for anyone to claim
          assignedTo = '';
          break;
      }

      if (!assignedTo && template.assignmentStrategy !== 'anyone') {
        console.warn(`No assignee found for room ${room.name} template ${template.name}`);
        continue;
      }

      const chore: Omit<Chore, 'id'> = {
        title: template.name,
        description: template.description,
        type: 'room',
        difficulty: template.difficulty,
        points: template.points,
        assignedTo,
        dueDate: new Date(Date.now() + template.frequencyHours * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'system',
        familyId,
        status: 'open',
        roomId: room.id!,
        roomName: room.name,
        roomType: room.type,
        autoGenerated: true,
        templateId: template.id,
        category: template.category,
        cooldownHours: template.frequencyHours
      };

      generatedChores.push(chore as Chore);
    }

    return generatedChores;
  } catch (error) {
    console.error('Error generating room chores:', error);
    return [];
  }
};

// Helper functions for room types and sharing
export const getRoomTypeDisplayName = (roomType: RoomType): string => {
  const displayNames: Record<RoomType, string> = {
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
    kitchen: 'Kitchen',
    living_room: 'Living Room',
    dining_room: 'Dining Room',
    laundry_room: 'Laundry Room',
    garage: 'Garage',
    basement: 'Basement',
    attic: 'Attic',
    office: 'Office',
    playroom: 'Playroom',
    guest_room: 'Guest Room',
    outdoor: 'Outdoor',
    pantry: 'Pantry',
    closet: 'Closet',
    other: 'Other'
  };
  
  return displayNames[roomType] || roomType;
};

export const getSharingTypeDisplayName = (sharingType: RoomSharingType): string => {
  const displayNames: Record<RoomSharingType, string> = {
    private: 'Private',
    shared: 'Shared',
    common: 'Common Area'
  };
  
  return displayNames[sharingType] || sharingType;
};

export const getRoomTypeEmoji = (roomType: RoomType): string => {
  const emojis: Record<RoomType, string> = {
    bedroom: '🛏️',
    bathroom: '🚿',
    kitchen: '🍳',
    living_room: '🛋️',
    dining_room: '🍽️',
    laundry_room: '🧺',
    garage: '🚗',
    basement: '🏠',
    attic: '🏚️',
    office: '💼',
    playroom: '🧸',
    guest_room: '🛌',
    outdoor: '🌳',
    pantry: '🥫',
    closet: '👗',
    other: '🏠'
  };
  
  return emojis[roomType] || '🏠';
};