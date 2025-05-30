// Helper to create slices with proper parameter handling
// This ensures slices work correctly even with minification

import { StateCreator } from 'zustand';

/**
 * Safe slice creator wrapper that ensures parameters are properly handled
 * even when minified
 */
export function createSliceSafe<T, U>(
  sliceCreator: (set: any, get: any, api: any) => U
): StateCreator<T, [], [], U> {
  return (...args: any[]) => {
    // Ensure we have the required parameters
    if (args.length < 2) {
      console.error('[createSliceSafe] Invalid number of arguments:', args.length);
      throw new Error('Invalid slice creator arguments');
    }
    
    const [set, get, api] = args;
    
    // Validate parameters
    if (typeof set !== 'function' || typeof get !== 'function') {
      console.error('[createSliceSafe] Invalid parameter types:', {
        set: typeof set,
        get: typeof get,
        api: typeof api
      });
      throw new Error('Invalid slice creator parameters');
    }
    
    // Create a safe getter that validates the store state
    const safeGet = () => {
      try {
        const state = get();
        if (!state) {
          console.error('[createSliceSafe] get() returned undefined');
          throw new Error('Store state is undefined');
        }
        return state;
      } catch (error) {
        console.error('[createSliceSafe] Error in get():', error);
        throw error;
      }
    };
    
    // Call the original slice creator with validated parameters
    return sliceCreator(set, safeGet, api);
  };
}

/**
 * Creates a defensive getter function that safely accesses store state
 */
export function createDefensiveGetter(get: () => any) {
  return () => {
    try {
      const state = get();
      if (!state) {
        console.error('[DefensiveGetter] Store state is undefined');
        return {
          auth: { user: null, isAuthenticated: false, isLoading: false, error: null },
          family: { family: null, members: [], isAdmin: false, currentMember: null, isLoading: false, error: null },
          offline: { isOnline: true, pendingActions: [], failedActions: [] },
          chores: { chores: [], filter: 'available', pendingCompletions: [], isLoading: false, error: null },
          rewards: { rewards: [], redemptionHistory: [], isLoading: false, error: null }
        };
      }
      return state;
    } catch (error) {
      console.error('[DefensiveGetter] Error accessing store:', error);
      return {
        auth: { user: null, isAuthenticated: false, isLoading: false, error: null },
        family: { family: null, members: [], isAdmin: false, currentMember: null, isLoading: false, error: null },
        offline: { isOnline: true, pendingActions: [], failedActions: [] },
        chores: { chores: [], filter: 'available', pendingCompletions: [], isLoading: false, error: null },
        rewards: { rewards: [], redemptionHistory: [], isLoading: false, error: null }
      };
    }
  };
}