// Family Slice - Family management functionality for Zustand store
// Integrates with Firestore for seamless migration from React Context

import { StateCreator } from 'zustand';
import { FamilyStore } from './types';
import { Family, FamilyMember } from '@/types';
import {
  createFamily,
  joinFamilyByCode,
  updateFamily,
  updateFamilyMember,
  removeFamilyMember,
  getFamily,
  getUserProfile,
  createOrUpdateUserProfile
} from '@/services/firestore';

export interface FamilySlice {
  // State
  family: {
    family: Family | null;
    members: FamilyMember[];
    isAdmin: boolean;
    currentMember: FamilyMember | null;
    isLoading: boolean;
    error: string | null;
    // Actions
    createFamily: (name: string) => Promise<boolean>;
    joinFamily: (joinCode: string) => Promise<boolean>;
    fetchFamily: (familyId: string) => Promise<void>;
    updateFamilySettings: (settings: Partial<Family['settings']>, name?: string) => Promise<boolean>;
    updateMemberRole: (familyId: string, userId: string, role: 'admin' | 'member', familyRole: 'parent' | 'child' | 'other') => Promise<boolean>;
    removeMember: (familyId: string, userId: string) => Promise<boolean>;
    clearError: () => void;
  };
}

export const createFamilySlice: StateCreator<
  FamilyStore,
  [],
  [],
  FamilySlice
> = (set, get) => ({
  family: {
    family: null,
    members: [],
    isAdmin: false,
    currentMember: null,
    isLoading: false,
    error: null,

    createFamily: async (name: string) => {
      const { auth } = get();
      const user = auth.user;
      
      if (!user) {
        set((state) => ({
          family: { ...state.family, error: 'User not authenticated' }
        }));
        return false;
      }

      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        // Create the family
        const familyId = await createFamily(name, user.uid);
        
        if (familyId) {
          // Update user profile with family ID
          await createOrUpdateUserProfile(user.uid, {
            familyId
          });

          // Fetch the newly created family
          const familyData = await getFamily(familyId);
          
          if (familyData) {
            // Find current member
            const currentMember = familyData.members.find(m => m.userId === user.uid) || null;
            const isAdmin = currentMember?.role === 'admin' || familyData.adminId === user.uid;

            set((state) => ({
              family: {
                ...state.family,
                family: familyData,
                members: familyData.members,
                isAdmin,
                currentMember,
                isLoading: false,
                error: null
              },
              // Update auth user with familyId
              auth: {
                ...state.auth,
                user: user ? { ...user, familyId } : null
              }
            }));
            return true;
          }
        }
        
        throw new Error('Failed to create family');
      } catch (error) {
        console.error('Error creating family:', error);
        set((state) => ({
          family: {
            ...state.family,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create family'
          }
        }));
        return false;
      }
    },

    joinFamily: async (joinCode: string) => {
      const { auth } = get();
      const user = auth.user;
      
      if (!user) {
        set((state) => ({
          family: { ...state.family, error: 'User not authenticated' }
        }));
        return false;
      }

      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        // Join the family
        const success = await joinFamilyByCode(joinCode, user.uid);
        
        if (success) {
          // Get user profile to find family ID
          const profile = await getUserProfile(user.uid);
          
          if (profile?.familyId) {
            // Update local user with family ID
            set((state) => ({
              auth: {
                ...state.auth,
                user: user ? { ...user, familyId: profile.familyId } : null
              }
            }));

            // Fetch the family data
            await get().family.fetchFamily(profile.familyId);
            return true;
          }
        }
        
        throw new Error('Failed to join family');
      } catch (error) {
        console.error('Error joining family:', error);
        set((state) => ({
          family: {
            ...state.family,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to join family'
          }
        }));
        return false;
      }
    },

    fetchFamily: async (familyId: string) => {
      const { auth } = get();
      const user = auth.user;
      
      if (!user) {
        return;
      }

      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        const familyData = await getFamily(familyId);
        
        if (familyData) {
          // Find current member
          const currentMember = familyData.members.find(m => m.userId === user.uid) || null;
          const isAdmin = currentMember?.role === 'admin' || familyData.adminId === user.uid;

          set((state) => ({
            family: {
              ...state.family,
              family: familyData,
              members: familyData.members,
              isAdmin,
              currentMember,
              isLoading: false,
              error: null
            }
          }));
        } else {
          throw new Error('Family not found');
        }
      } catch (error) {
        console.error('Error fetching family:', error);
        set((state) => ({
          family: {
            ...state.family,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch family'
          }
        }));
      }
    },

    updateFamilySettings: async (settings: Partial<Family['settings']>, name?: string) => {
      const { family } = get().family;
      
      if (!family) {
        set((state) => ({
          family: { ...state.family, error: 'No family loaded' }
        }));
        return false;
      }

      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        const updates: any = {};
        
        if (name) {
          updates.name = name;
        }
        
        if (settings) {
          updates.settings = { ...family.settings, ...settings };
        }

        const success = await updateFamily(family.id, updates);
        
        if (success) {
          // Update local state optimistically
          set((state) => ({
            family: {
              ...state.family,
              family: state.family.family ? {
                ...state.family.family,
                name: name || state.family.family.name,
                settings: updates.settings || state.family.family.settings
              } : null,
              isLoading: false,
              error: null
            }
          }));
          
          // Refresh family data
          await get().family.fetchFamily(family.id);
          return true;
        }
        
        throw new Error('Failed to update family settings');
      } catch (error) {
        console.error('Error updating family settings:', error);
        set((state) => ({
          family: {
            ...state.family,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update settings'
          }
        }));
        return false;
      }
    },

    updateMemberRole: async (familyId: string, userId: string, role: 'admin' | 'member', familyRole: 'parent' | 'child' | 'other') => {
      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        const success = await updateFamilyMember(familyId, userId, { role, familyRole });
        
        if (success) {
          // Update local state optimistically
          set((state) => ({
            family: {
              ...state.family,
              members: state.family.members.map(member =>
                member.userId === userId
                  ? { ...member, role, familyRole }
                  : member
              ),
              isLoading: false,
              error: null
            }
          }));
          
          // Refresh family data
          await get().family.fetchFamily(familyId);
          return true;
        }
        
        throw new Error('Failed to update member role');
      } catch (error) {
        console.error('Error updating member role:', error);
        set((state) => ({
          family: {
            ...state.family,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update member role'
          }
        }));
        return false;
      }
    },

    removeMember: async (familyId: string, userId: string) => {
      const { auth } = get();
      
      // Don't allow removing yourself
      if (auth.user?.uid === userId) {
        set((state) => ({
          family: { ...state.family, error: 'Cannot remove yourself from the family' }
        }));
        return false;
      }

      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        const success = await removeFamilyMember(familyId, userId);
        
        if (success) {
          // Update local state optimistically
          set((state) => ({
            family: {
              ...state.family,
              members: state.family.members.filter(member => member.userId !== userId),
              isLoading: false,
              error: null
            }
          }));
          
          // Refresh family data
          await get().family.fetchFamily(familyId);
          return true;
        }
        
        throw new Error('Failed to remove member');
      } catch (error) {
        console.error('Error removing member:', error);
        set((state) => ({
          family: {
            ...state.family,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to remove member'
          }
        }));
        return false;
      }
    },

    clearError: () => {
      set((state) => ({
        family: { ...state.family, error: null }
      }));
    }
  }
});