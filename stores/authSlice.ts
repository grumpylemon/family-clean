// Auth Slice - Authentication functionality for Zustand store
// Integrates with Firebase Auth for seamless migration from React Context

import { StateCreator } from 'zustand';
import { User } from '@/types';
import { auth, isMockImplementation } from '@/config/firebase';
import { createOrUpdateUserProfile, getUserProfile } from '@/services/firestore';
import { authService } from '@/services/authService';
import { FamilyStore } from './types';

// Import types only
import type { 
  Auth,
  User as FirebaseUser,
  UserCredential 
} from 'firebase/auth';

export interface AuthSlice {
  // State
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    // Actions
    signInWithGoogle: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    checkAuthState: () => void;
    clearError: () => void;
  };
}

export const createAuthSlice: StateCreator<
  FamilyStore,
  [],
  [],
  AuthSlice
> = (set, get) => {
  // Log slice creation for debugging
  console.log('[AuthSlice] Creating auth slice');
  
  return {
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signInWithGoogle: async () => {
        console.log('[AuthSlice] signInWithGoogle called');
      const isMock = isMockImplementation();
      
      set((state) => ({
        auth: { ...state.auth, isLoading: true, error: null }
      }));

      try {
        // Use centralized auth service
        const result = await authService.signInWithGoogle(auth);
        
        const firebaseUser = result.user;
        
        // Create User object from Firebase user
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || null,
          displayName: firebaseUser.displayName || null,
          photoURL: firebaseUser.photoURL || null,
          familyId: null,
          points: {
            current: 0,
            weekly: 0,
            lifetime: 0,
            lastReset: new Date().toISOString()
          },
          level: 1,
          xp: 0,
          achievements: [],
          streakDays: 0,
          lastActiveDate: new Date().toISOString(),
          preferences: {
            notifications: true,
            theme: 'light',
            defaultChoreDifficulty: 'medium'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Update auth state
        set((state) => ({
          auth: {
            ...state.auth,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          }
        }));

        // Create/update user profile
        await createOrUpdateUserProfile(user.uid, user);
      } catch (error) {
        console.error('Error signing in with Google:', error);
        set((state) => ({
          auth: {
            ...state.auth,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sign in with Google'
          }
        }));
      }
    },

    signInAsGuest: async () => {
      const isMock = isMockImplementation();
      
      set((state) => ({
        auth: { ...state.auth, isLoading: true, error: null }
      }));

      try {
        // Use centralized auth service
        const result = await authService.signInAnonymously(auth);
        
        const firebaseUser = result.user;
        
        // Create User object from Firebase user
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || null,
          displayName: firebaseUser.displayName || 'Guest',
          photoURL: firebaseUser.photoURL || null,
          familyId: null,
          points: {
            current: 0,
            weekly: 0,
            lifetime: 0,
            lastReset: new Date().toISOString()
          },
          level: 1,
          xp: 0,
          achievements: [],
          streakDays: 0,
          lastActiveDate: new Date().toISOString(),
          preferences: {
            notifications: true,
            theme: 'light',
            defaultChoreDifficulty: 'medium'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Update auth state
        set((state) => ({
          auth: {
            ...state.auth,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          }
        }));

        // Create/update user profile
        await createOrUpdateUserProfile(user.uid, user);
      } catch (error) {
        console.error('Error signing in as guest:', error);
        set((state) => ({
          auth: {
            ...state.auth,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sign in as guest'
          }
        }));
      }
    },

    logout: async () => {
      const isMock = isMockImplementation();
      
      set((state) => ({
        auth: { ...state.auth, isLoading: true, error: null }
      }));

      try {
        // Use centralized auth service
        await authService.signOut(auth);

        // Clear all user data
        set((state) => ({
          auth: {
            ...state.auth,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          },
          // Clear family data too
          family: {
            ...state.family,
            family: null,
            members: [],
            isAdmin: false,
            currentMember: null
          }
        }));
      } catch (error) {
        console.error('Error signing out:', error);
        set((state) => ({
          auth: {
            ...state.auth,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sign out'
          }
        }));
      }
    },

    checkAuthState: () => {
      const isMock = isMockImplementation();
      
      set((state) => ({
        auth: { ...state.auth, isLoading: true }
      }));

      if (isMock) {
        // For mock auth, check current user
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Create User object from mock
          const user: User = {
            uid: currentUser.uid,
            email: currentUser.email || null,
            displayName: currentUser.displayName || 'Guest',
            photoURL: currentUser.photoURL || null,
            familyId: null,
            points: {
              current: 0,
              weekly: 0,
              lifetime: 0,
              lastReset: new Date().toISOString()
            },
            level: 1,
            xp: 0,
            achievements: [],
            streakDays: 0,
            lastActiveDate: new Date().toISOString(),
            preferences: {
              notifications: true,
              theme: 'light',
              defaultChoreDifficulty: 'medium'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          set((state) => ({
            auth: {
              ...state.auth,
              user,
              isAuthenticated: true,
              isLoading: false
            }
          }));
        } else {
          set((state) => ({
            auth: {
              ...state.auth,
              user: null,
              isAuthenticated: false,
              isLoading: false
            }
          }));
        }
      } else {
        // Use Firebase auth state listener from centralized service
        const unsubscribe = authService.onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            try {
              // Try to get existing user profile
              const profile = await getUserProfile(firebaseUser.uid);
              
              if (profile) {
                set((state) => ({
                  auth: {
                    ...state.auth,
                    user: profile,
                    isAuthenticated: true,
                    isLoading: false
                  }
                }));
              } else {
                // Create new user profile
                const user: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || 'User',
                  photoURL: firebaseUser.photoURL,
                  familyId: null,
                  points: {
                    current: 0,
                    weekly: 0,
                    lifetime: 0,
                    lastReset: new Date().toISOString()
                  },
                  level: 1,
                  xp: 0,
                  achievements: [],
                  streakDays: 0,
                  lastActiveDate: new Date().toISOString(),
                  preferences: {
                    notifications: true,
                    theme: 'light',
                    defaultChoreDifficulty: 'medium'
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                await createOrUpdateUserProfile(user.uid, user);
                
                set((state) => ({
                  auth: {
                    ...state.auth,
                    user,
                    isAuthenticated: true,
                    isLoading: false
                  }
                }));
              }
            } catch (error) {
              console.error('Error loading user profile:', error);
              set((state) => ({
                auth: {
                  ...state.auth,
                  isLoading: false,
                  error: 'Failed to load user profile'
                }
              }));
            }
          } else {
            set((state) => ({
              auth: {
                ...state.auth,
                user: null,
                isAuthenticated: false,
                isLoading: false
              }
            }));
          }
        });

        // Store unsubscribe function for cleanup
        (window as any).__authUnsubscribe = unsubscribe;
      }
    },

    clearError: () => {
      set((state) => ({
        auth: { ...state.auth, error: null }
      }));
    }
  }
  };
};