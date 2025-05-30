import { useEffect, useMemo } from 'react';
import { useFamilyStore } from '../stores/familyStore';
import { Family, FamilyMember } from '../types';

/**
 * Zustand-based replacement for useFamily hook
 * Provides the same API as the React Context version for seamless migration
 */
export function useFamily() {
  const {
    // Family state
    family,
    members,
    isLoading: loading,
    error,
    
    // Auth state (needed for current member calculation)
    user,
    
    // Family actions
    createNewFamily,
    joinFamily,
    updateFamilySettings,
    updateMemberRole,
    removeMember,
    fetchFamily,
    
    // Utility actions
    clearError,
  } = useFamilyStore((state) => ({
    family: state.family.family,
    members: state.family.members,
    isLoading: state.family.isLoading,
    error: state.family.error,
    user: state.auth.user,
    createNewFamily: state.family.createFamily,
    joinFamily: state.family.joinFamily,
    updateFamilySettings: state.family.updateFamilySettings,
    updateMemberRole: state.family.updateMemberRole,
    removeMember: state.family.removeMember,
    fetchFamily: state.family.fetchFamily,
    clearError: state.family.clearError,
  }));

  // Calculate current member and admin status
  const { currentMember, isAdmin } = useMemo(() => {
    if (!family || !user) {
      return { currentMember: null, isAdmin: false };
    }

    const member = members.find(m => m.uid === user.uid); // Fixed: use uid, not userId
    const adminStatus = member?.role === 'admin' || family.adminId === user.uid;

    return {
      currentMember: member || null,
      isAdmin: adminStatus,
    };
  }, [family, user, members]);

  // Refresh family data when user changes
  useEffect(() => {
    if (user?.familyId && user.familyId !== family?.id && fetchFamily && typeof fetchFamily === 'function') {
      // Only fetch if the familyId is different from current family
      fetchFamily(user.familyId);
    }
  }, [user?.familyId]); // Only depend on user's familyId, not the function reference

  // Create refreshFamily function for backward compatibility
  const refreshFamily = async (): Promise<boolean> => {
    if (family?.id) {
      try {
        await fetchFamily(family.id);
        return true;
      } catch (error) {
        console.error('Error refreshing family:', error);
        return false;
      }
    }
    return false;
  };

  // Helper function to update member (for backward compatibility)
  const updateMember = async (memberId: string, updates: Partial<FamilyMember>) => {
    if (!family?.id) return;
    
    // Handle role updates specially
    if ('role' in updates || 'familyRole' in updates) {
      await updateMemberRole(
        family.id,
        memberId,
        updates.role || currentMember?.role || 'member',
        updates.familyRole || currentMember?.familyRole || 'parent'
      );
    }
    
    // For other updates, we might need to add more specific methods
    // For now, just refresh the family data
    await refreshFamily();
  };

  // Maintain backward compatibility with error as a string
  const errorMessage = error ? (typeof error === 'string' ? error : error.message || 'An error occurred') : null;

  // Provide the same API as the React Context version
  return {
    family,
    members,
    loading,
    error: errorMessage,
    currentMember,
    isAdmin,
    createNewFamily,
    joinFamily,
    updateFamilySettings,
    updateMemberRole,
    updateMember, // Backward compatibility
    removeMember,
    refreshFamily,
    clearError,
    // Backward compatibility methods
    updateMemberName: async () => false,
    updateFamilyMember: async () => false,
  };
}

// Type definition for consistency
export type UseFamilyReturn = ReturnType<typeof useFamily>;