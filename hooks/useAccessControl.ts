import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

/**
 * Comprehensive access control hook for admin/user permissions
 * 
 * This hook provides a centralized way to check user permissions
 * throughout the application, ensuring consistent access control.
 */
export function useAccessControl() {
  const { user } = useAuth();
  const { family, isAdmin } = useFamily();

  // Core permission checks
  const permissions = {
    // Admin-only permissions
    canManageFamily: isAdmin,
    canManageMembers: isAdmin,
    canManageChores: isAdmin,
    canManageRewards: isAdmin,
    canChangeFamilySettings: isAdmin,
    canPromoteDemoteMembers: isAdmin,
    canRemoveMembers: isAdmin,
    canViewAdminPanel: isAdmin,
    canAccessFamilySettings: isAdmin,

    // User permissions (available to all authenticated users)
    canViewFamily: !!user && !!family,
    canCompleteChores: !!user && !!family,
    canViewChores: !!user && !!family,
    canViewRewards: !!user && !!family,
    canRedeemRewards: !!user && !!family,
    canViewDashboard: !!user && !!family,
    canUpdateProfile: !!user,

    // Mixed permissions (some admin features, some user features)
    canViewFamilyMembers: !!user && !!family, // Users can view, only admins can modify
    canJoinFamily: !!user && !family, // Only users without a family can join
    canCreateFamily: !!user && !family, // Only users without a family can create
  };

  // Helper functions for common permission patterns
  const requireAdmin = (action: string = 'this action') => {
    if (!isAdmin) {
      console.warn(`Access denied: ${action} requires admin privileges`);
      return false;
    }
    return true;
  };

  const requireAuth = (action: string = 'this action') => {
    if (!user) {
      console.warn(`Access denied: ${action} requires authentication`);
      return false;
    }
    return true;
  };

  const requireFamily = (action: string = 'this action') => {
    if (!family) {
      console.warn(`Access denied: ${action} requires family membership`);
      return false;
    }
    return true;
  };

  // UI helper functions
  const getAccessLevel = () => {
    if (!user) return 'guest';
    if (isAdmin) return 'admin';
    return 'user';
  };

  const getAccessLevelDisplay = () => {
    const level = getAccessLevel();
    return level === 'admin' ? 'Admin' : level === 'user' ? 'User' : 'Guest';
  };

  // Permission error messages
  const getPermissionErrorMessage = (permission: string) => {
    const messages = {
      admin: 'This feature is only available to family administrators.',
      auth: 'Please sign in to access this feature.',
      family: 'You must be part of a family to access this feature.',
      default: 'You do not have permission to perform this action.'
    };

    if (permission.includes('admin') || permission.includes('manage')) {
      return messages.admin;
    }
    if (!user) {
      return messages.auth;
    }
    if (!family) {
      return messages.family;
    }
    return messages.default;
  };

  return {
    // Permission flags
    ...permissions,
    
    // Helper functions
    requireAdmin,
    requireAuth,
    requireFamily,
    getAccessLevel,
    getAccessLevelDisplay,
    getPermissionErrorMessage,
    
    // State information
    isAuthenticated: !!user,
    isAdmin,
    hasFamilyAccess: !!family,
    currentUserId: user?.uid,
    familyId: family?.id,
  };
}

// Export permission constants for use in components
export const ADMIN_PERMISSIONS = [
  'canManageFamily',
  'canManageMembers', 
  'canManageChores',
  'canManageRewards',
  'canChangeFamilySettings',
  'canPromoteDemoteMembers',
  'canRemoveMembers',
  'canViewAdminPanel',
  'canAccessFamilySettings'
] as const;

export const USER_PERMISSIONS = [
  'canViewFamily',
  'canCompleteChores',
  'canViewChores',
  'canViewRewards',
  'canRedeemRewards',
  'canViewDashboard',
  'canUpdateProfile',
  'canViewFamilyMembers'
] as const;