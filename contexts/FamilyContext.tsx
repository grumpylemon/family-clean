import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Family, 
  FamilyMember, 
  User,
  UserRole,
  FamilyRole 
} from '@/types';
import {
  getFamily,
  createFamily,
  updateFamily,
  addFamilyMember,
  updateFamilyMember,
  findFamilyByJoinCode,
  createOrUpdateUserProfile,
  getUserProfile,
  generateJoinCode
} from '@/services/firestore';

interface FamilyContextType {
  family: Family | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  createNewFamily: (familyName: string) => Promise<boolean>;
  joinFamily: (joinCode: string) => Promise<boolean>;
  updateFamilySettings: (settings: Partial<Family['settings']>, name?: string) => Promise<boolean>;
  updateMemberRole: (userId: string, role: UserRole, familyRole: FamilyRole) => Promise<boolean>;
  updateMemberName: (userId: string, newName: string) => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  refreshFamily: () => Promise<void>;
  isAdmin: boolean;
  currentMember: FamilyMember | null;
}

const FamilyContext = createContext<FamilyContextType>({
  family: null,
  userProfile: null,
  loading: true,
  error: null,
  createNewFamily: async () => false,
  joinFamily: async () => false,
  updateFamilySettings: async () => false,
  updateMemberRole: async () => false,
  updateMemberName: async () => false,
  removeMember: async () => false,
  refreshFamily: async () => {},
  isAdmin: false,
  currentMember: null,
});

export const useFamily = () => useContext(FamilyContext);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const currentMember = family?.members.find(m => m.uid === user?.uid) || null;
  const isAdmin = currentMember?.role === 'admin';

  // Load family and user profile when user changes
  useEffect(() => {
    if (user) {
      loadUserAndFamily();
    } else {
      setFamily(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserAndFamily = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const profile = await getUserProfile(user.uid);
      
      if (profile) {
        setUserProfile(profile);
        
        // If user has a family, load it
        if (profile.familyId) {
          const familyData = await getFamily(profile.familyId);
          if (familyData) {
            setFamily(familyData);
          }
        }
      } else {
        // Create initial user profile
        await createOrUpdateUserProfile(user.uid, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const newProfile = await getUserProfile(user.uid);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error loading user/family:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createNewFamily = async (familyName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      // Create the family
      const newFamily: Omit<Family, 'id'> = {
        name: familyName,
        adminId: user.uid,
        joinCode: generateJoinCode(),
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [{
          uid: user.uid,
          name: user.displayName || 'Unknown',
          email: user.email,
          role: 'admin',
          familyRole: 'parent',
          points: {
            current: 0,
            lifetime: 0,
            weekly: 0
          },
          photoURL: user.photoURL,
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

      const familyId = await createFamily(newFamily);
      
      if (familyId) {
        // Update user profile with family ID
        await createOrUpdateUserProfile(user.uid, {
          familyId: familyId || undefined,
          role: 'admin',
          familyRole: 'parent'
        });

        // Reload data
        await loadUserAndFamily();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error creating family:', err);
      setError(err instanceof Error ? err.message : 'Failed to create family');
      return false;
    }
  };

  const joinFamily = async (joinCode: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      // Find family by join code
      const familyToJoin = await findFamilyByJoinCode(joinCode);
      
      if (!familyToJoin) {
        setError('Invalid join code');
        return false;
      }

      // Check if already a member
      if (familyToJoin.members.some(m => m.uid === user.uid)) {
        setError('You are already a member of this family');
        return false;
      }

      // Add user as a member
      const newMember: FamilyMember = {
        uid: user.uid,
        name: user.displayName || 'Unknown',
        email: user.email,
        role: 'member',
        familyRole: 'child',
        points: {
          current: 0,
          lifetime: 0,
          weekly: 0
        },
        photoURL: user.photoURL,
        joinedAt: new Date(),
        isActive: true
      };

      const success = await addFamilyMember(familyToJoin.id!, newMember);
      
      if (success) {
        // Update user profile with family ID
        await createOrUpdateUserProfile(user.uid, {
          familyId: familyToJoin.id || undefined,
          role: 'member',
          familyRole: 'child'
        });

        // Reload data
        await loadUserAndFamily();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error joining family:', err);
      setError(err instanceof Error ? err.message : 'Failed to join family');
      return false;
    }
  };

  const updateFamilySettings = async (settings: Partial<Family['settings']>, name?: string): Promise<boolean> => {
    if (!family || !isAdmin) return false;

    try {
      setError(null);
      
      const updates: any = {
        settings: {
          ...family.settings,
          ...settings
        },
        updatedAt: new Date()
      };
      
      if (name && name.trim()) {
        updates.name = name.trim();
      }
      
      const success = await updateFamily(family.id!, updates);

      if (success) {
        await refreshFamily();
      }
      
      return success;
    } catch (err) {
      console.error('Error updating family settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      return false;
    }
  };

  const updateMemberRole = async (userId: string, role: UserRole, familyRole: FamilyRole): Promise<boolean> => {
    if (!family || !isAdmin) return false;

    try {
      setError(null);
      
      const success = await updateFamilyMember(family.id!, userId, {
        role,
        familyRole
      });

      if (success) {
        await refreshFamily();
      }
      
      return success;
    } catch (err) {
      console.error('Error updating member role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member');
      return false;
    }
  };

  const updateMemberName = async (userId: string, newName: string): Promise<boolean> => {
    if (!family || !isAdmin) return false;

    try {
      setError(null);
      
      const success = await updateFamilyMember(family.id!, userId, {
        name: newName
      });

      if (success) {
        await refreshFamily();
      }
      
      return success;
    } catch (err) {
      console.error('Error updating member name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member name');
      return false;
    }
  };

  const removeMember = async (userId: string): Promise<boolean> => {
    if (!family || !isAdmin) return false;

    // Prevent removing the admin
    if (userId === family.adminId) {
      setError('Cannot remove the family admin');
      return false;
    }

    try {
      setError(null);
      
      // Remove member from family
      const updatedMembers = family.members.filter(m => m.uid !== userId);
      const success = await updateFamily(family.id!, {
        members: updatedMembers,
        updatedAt: new Date()
      });

      if (success) {
        // Update the removed user's profile to clear family association
        await createOrUpdateUserProfile(userId, {
          familyId: undefined,
          role: 'member',
          familyRole: 'child'
        });
        
        await refreshFamily();
      }
      
      return success;
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      return false;
    }
  };

  const refreshFamily = async () => {
    if (!family) return;

    try {
      const updatedFamily = await getFamily(family.id!);
      if (updatedFamily) {
        setFamily(updatedFamily);
      }
    } catch (err) {
      console.error('Error refreshing family:', err);
    }
  };

  const value: FamilyContextType = {
    family,
    userProfile,
    loading,
    error,
    createNewFamily,
    joinFamily,
    updateFamilySettings,
    updateMemberRole,
    updateMemberName,
    removeMember,
    refreshFamily,
    isAdmin,
    currentMember
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}