// Family Slice - Family management functionality for Zustand store
// Integrates with Firestore for seamless migration from React Context

import { StateCreator } from 'zustand';
import { FamilyStore } from './types';
import { Family, FamilyMember } from '@/types';
import {
  createFamily,
  findFamilyByJoinCode,
  addFamilyMember,
  updateFamily,
  updateFamilyMember,
  getFamily,
  getUserProfile,
  createOrUpdateUserProfile,
  generateJoinCode
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
    createNewFamily: (name: string) => Promise<boolean>; // Alias for createFamily
    joinFamily: (joinCode: string) => Promise<boolean>;
    fetchFamily: (familyId: string) => Promise<void>;
    refreshFamily: () => Promise<boolean>;
    updateFamilySettings: (settings: Partial<Family['settings']>, name?: string) => Promise<boolean>;
    updateMemberRole: (familyId: string, userId: string, role: 'admin' | 'member', familyRole: 'parent' | 'child' | 'other') => Promise<boolean>;
    removeMember: (familyId: string, userId: string) => Promise<boolean>;
    clearError: () => void;
  };
}

// Use a factory function to ensure proper parameter handling with minification
function createFamilySliceFactory() {
  return (set: any, get: any, api: any) => {
    // Validate parameters
    if (typeof set !== 'function' || typeof get !== 'function') {
      console.error('[FamilySlice] Invalid slice creator parameters:', { 
        set: typeof set, 
        get: typeof get,
        argsCount: arguments.length 
      });
      throw new Error('Invalid slice creator parameters');
    }

    console.log('[FamilySlice] Creating family slice with valid parameters');

    // Create a safe getter that handles errors
    const safeGet = () => {
      try {
        const state = get();
        if (!state) {
          console.error('[FamilySlice] get() returned undefined');
          // Return a minimal valid state structure
          return {
            auth: { user: null, isAuthenticated: false },
            family: { family: null, members: [], isAdmin: false, currentMember: null },
            offline: { isOnline: true },
            chores: { chores: [] },
            rewards: { rewards: [] }
          };
        }
        return state;
      } catch (error) {
        console.error('[FamilySlice] Error in safeGet:', error);
        // Return a minimal valid state structure
        return {
          auth: { user: null, isAuthenticated: false },
          family: { family: null, members: [], isAdmin: false, currentMember: null },
          offline: { isOnline: true },
          chores: { chores: [] },
          rewards: { rewards: [] }
        };
      }
    };

    return {
  family: {
    family: null,
    members: [],
    isAdmin: false,
    currentMember: null,
    isLoading: false,
    error: null,

    createFamily: async (name: string) => {
      // Defensive get() call with validation
      const store = safeGet();
      const { auth } = store;
      
      if (!auth || !auth.user) {
        console.error('[FamilySlice] Auth not ready:', { hasAuth: !!auth, hasUser: !!(auth?.user) });
        set((state) => ({
          family: { ...state.family, error: 'User not authenticated' }
        }));
        return false;
      }

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
        console.log('[FamilySlice] Creating family with name:', name);
        
        // Create family object
        const joinCode = generateJoinCode();
        console.log('[FamilySlice] Generated join code:', joinCode);
        
        const familyData: Omit<Family, 'id' | 'createdAt'> = {
          name,
          adminId: user.uid,
          joinCode,
          updatedAt: new Date(),
          members: [{
            uid: user.uid,
            name: user.displayName || 'Family Admin',
            email: user.email || '',
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
        
        // Create the family
        const familyId = await createFamily(familyData);
        console.log('[FamilySlice] Family created with ID:', familyId);
        
        if (familyId) {
          // Update user profile with family ID
          console.log('[FamilySlice] Updating user profile with familyId');
          try {
            await createOrUpdateUserProfile(user.uid, {
              familyId
            });
            console.log('[FamilySlice] User profile updated successfully');
          } catch (profileError) {
            console.error('[FamilySlice] Failed to update user profile:', profileError);
            // Continue anyway - this isn't critical for family creation
          }

          // Fetch the newly created family to get complete data
          console.log('[FamilySlice] Fetching created family with ID:', familyId);
          const family = await getFamily(familyId);
          console.log('[FamilySlice] Fetched created family:', family);
          
          if (family) {
            console.log('[FamilySlice] Family object structure:', {
              id: family.id,
              name: family.name,
              adminId: family.adminId,
              membersCount: family.members?.length || 0,
              hasId: !!family.id
            });
            
            // Find current member - ensure members array exists
            const members = Array.isArray(family.members) ? family.members : [];
            const currentMember = members.find(m => m.uid === user.uid) || null;
            const isAdmin = currentMember?.role === 'admin' || family.adminId === user.uid;
            
            console.log('[FamilySlice] Setting family state - currentMember:', currentMember);
            console.log('[FamilySlice] Setting family state - isAdmin:', isAdmin);

            set((state) => ({
              family: {
                ...state.family,
                family: family, // Use the fetched family data which includes the id
                members: Array.isArray(family.members) ? family.members : [],
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
            
            console.log('[FamilySlice] Family creation complete. State updated with family:', family.name, 'ID:', family.id);
            return true;
          } else {
            console.error('[FamilySlice] getFamily returned null for ID:', familyId);
            throw new Error('Failed to fetch created family data');
          }
        } else {
          console.error('[FamilySlice] createFamily returned null/undefined familyId');
          throw new Error('Failed to get family ID from createFamily');
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
      // Defensive get() call with validation
      const store = safeGet();
      const { auth } = store;
      
      if (!auth || !auth.user) {
        console.error('[FamilySlice] Auth not ready in joinFamily');
        set((state) => ({
          family: { ...state.family, error: 'User not authenticated' }
        }));
        return false;
      }

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
        console.log('[FamilySlice] Attempting to join family with code:', joinCode);
        
        // Find family by join code
        const family = await findFamilyByJoinCode(joinCode);
        
        if (!family) {
          throw new Error('Family not found with that join code');
        }
        
        console.log('[FamilySlice] Found family:', family.name);
        
        // Check if user is already a member - ensure members array exists
        const members = Array.isArray(family.members) ? family.members : [];
        const existingMember = members.find(m => m.uid === user.uid);
        if (existingMember) {
          throw new Error('You are already a member of this family');
        }
        
        // Create new family member
        const newMember: FamilyMember = {
          uid: user.uid,
          name: user.displayName || 'New Member',
          email: user.email || '',
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
        
        // Add member to family
        console.log('[FamilySlice] Adding member to family');
        const addSuccess = await addFamilyMember(family.id!, newMember);
        
        if (addSuccess) {
          // Update user profile with family ID
          console.log('[FamilySlice] Updating user profile with familyId');
          await createOrUpdateUserProfile(user.uid, {
            familyId: family.id
          });
          
          // Update local user with family ID
          set((state) => ({
            auth: {
              ...state.auth,
              user: user ? { ...user, familyId: family.id } : null
            }
          }));

          // Fetch the updated family data
          try {
            const store = safeGet();
            if (store && store.family && store.family.fetchFamily) {
              await store.family.fetchFamily(family.id!);
            }
          } catch (error) {
            console.error('[FamilySlice] Error fetching family after join:', error);
          }
          return true;
        }
        
        throw new Error('Failed to add member to family');
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

    // Alias for createFamily to match component expectations
    createNewFamily: async (name: string) => {
      try {
        const store = safeGet();
        if (!store || !store.family || !store.family.createFamily) {
          console.error('[FamilySlice] Store or createFamily not available');
          return false;
        }
        return await store.family.createFamily(name);
      } catch (error) {
        console.error('[FamilySlice] Error in createNewFamily:', error);
        return false;
      }
    },

    refreshFamily: async () => {
      // Defensive get() call with validation
      const store = safeGet();
      const { auth } = store;
      
      if (!auth || !auth.user) {
        console.log('[FamilySlice] No user to refresh family for');
        return false;
      }

      const user = auth.user;
      
      if (!user?.familyId) {
        console.log('[FamilySlice] No familyId to refresh');
        return false;
      }
      
      try {
        console.log('[FamilySlice] Refreshing family:', user.familyId);
        try {
          const store = safeGet();
          if (store && store.family && store.family.fetchFamily) {
            await store.family.fetchFamily(user.familyId);
            return true;
          } else {
            console.error('[FamilySlice] fetchFamily not available in refreshFamily');
            return false;
          }
        } catch (error) {
          console.error('[FamilySlice] Error in refreshFamily:', error);
          return false;
        }
      } catch (error) {
        console.error('[FamilySlice] Error refreshing family:', error);
        return false;
      }
    },

    fetchFamily: async (familyId: string) => {
      // Defensive get() call with validation
      const store = safeGet();
      const { auth, family } = store;
      
      if (!auth || !family) {
        console.error('[FamilySlice] Required slices not found in fetchFamily');
        return;
      }

      const user = auth.user;
      
      if (!user) {
        return;
      }

      // Prevent duplicate fetches
      if (family.isLoading) {
        console.log('[FamilySlice] Already loading family, skipping duplicate fetch');
        return;
      }

      // Check if we already have this family loaded
      if (family.family?.id === familyId && !family.error) {
        console.log('[FamilySlice] Family already loaded, skipping fetch');
        return;
      }

      set((state) => ({
        family: { ...state.family, isLoading: true, error: null }
      }));

      try {
        const familyData = await getFamily(familyId);
        
        if (familyData) {
          // Find current member (using uid, not userId) - ensure members array exists
          const members = Array.isArray(familyData.members) ? familyData.members : [];
          const currentMember = members.find(m => m.uid === user.uid) || null;
          const isAdmin = currentMember?.role === 'admin' || familyData.adminId === user.uid;
          
          console.log('[FamilySlice] Fetched family data:', familyData.name);
          console.log('[FamilySlice] Current member found:', currentMember);
          console.log('[FamilySlice] User is admin:', isAdmin);

          set((state) => ({
            family: {
              ...state.family,
              family: familyData,
              members: members,
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
      // Defensive get() call
      const store = safeGet();
      const { family } = store.family;
      
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
          try {
            const store = safeGet();
            if (store && store.family && store.family.fetchFamily) {
              await store.family.fetchFamily(family.id);
            }
          } catch (error) {
            console.error('[FamilySlice] Error refreshing family after settings update:', error);
          }
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
                member.uid === userId
                  ? { ...member, role, familyRole }
                  : member
              ),
              isLoading: false,
              error: null
            }
          }));
          
          // Refresh family data
          try {
            const store = safeGet();
            if (store && store.family && store.family.fetchFamily) {
              await store.family.fetchFamily(familyId);
            }
          } catch (error) {
            console.error('[FamilySlice] Error refreshing family after member update:', error);
          }
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
      // Defensive get() call
      const store = safeGet();
      const { auth } = store;
      
      if (!auth) {
        console.error('[FamilySlice] Auth slice not found');
        return false;
      }
      
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
        // Remove member by updating the family with filtered members
        const familyData = store.family?.family;
        if (familyData) {
          const filteredMembers = Array.isArray(familyData.members) ? familyData.members.filter(member => member.uid !== userId) : [];
          const success = await updateFamily(familyId, { members: filteredMembers });
          
          if (success) {
            // Update local state optimistically
            set((state) => ({
              family: {
                ...state.family,
                members: state.family.members.filter(member => member.uid !== userId),
                isLoading: false,
                error: null
              }
            }));
            
            // Refresh family data
            try {
              const refreshStore = safeGet();
              if (refreshStore && refreshStore.family && refreshStore.family.fetchFamily) {
                await refreshStore.family.fetchFamily(familyId);
              }
            } catch (error) {
              console.error('[FamilySlice] Error refreshing family after member removal:', error);
            }
            return true;
          }
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
    };
  };
}

export const createFamilySlice: StateCreator<
  FamilyStore,
  [],
  [],
  FamilySlice
> = createFamilySliceFactory();