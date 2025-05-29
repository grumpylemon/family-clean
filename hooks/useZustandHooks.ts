/**
 * Central export for Zustand-based hooks
 * This file allows for easy migration from React Context to Zustand
 * 
 * Migration strategy:
 * 1. Import from this file instead of contexts
 * 2. The API is identical to the context-based hooks
 * 3. Once migration is complete, remove the Context providers
 */

export { useAuth } from './useAuthZustand';
export { useFamily } from './useFamilyZustand';

// Re-export types for convenience
export type { UseAuthReturn } from './useAuthZustand';
export type { UseFamilyReturn } from './useFamilyZustand';

// Additional Zustand hooks from the store
export { useFamilyStore } from '@/stores/familyStore';

// Utility hook for checking migration status
export function useMigrationStatus() {
  return {
    isUsingZustand: true,
    migrationComplete: false, // Will be true when contexts are removed
  };
}