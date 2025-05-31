// Auth Slice - Authentication functionality for Zustand store
// Integrates with Firebase Auth for seamless migration from React Context

import { StateCreator } from 'zustand';
import { User } from '../types';
import { auth, isMockImplementation } from '../config/firebase';
import { createOrUpdateUserProfile, getUserProfile } from '../services/firestore';
import { authService } from '../services/authService';
import { FamilyStore } from './types';
import { Platform } from 'react-native';
import { setUserContext, clearUserContext } from '../config/sentry';

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
    checkAuthState: () => Promise<void>;
    clearError: () => void;
  };
}

// Factory function for creating auth slice with defensive coding
function createAuthSliceFactory(): StateCreator<FamilyStore, [], [], AuthSlice> {
  return (set, get) => {
    // Validate that set and get are functions
    if (typeof set !== 'function' || typeof get !== 'function') {
      console.error('[AuthSlice] Invalid slice creator parameters:', { set: typeof set, get: typeof get });
      // Return a minimal valid structure instead of throwing
      return {
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          signInWithGoogle: async () => { console.error('Store not initialized'); },
          signInAsGuest: async () => { console.error('Store not initialized'); },
          logout: async () => { console.error('Store not initialized'); },
          checkAuthState: async () => { console.error('Store not initialized'); },
          clearError: () => { console.error('Store not initialized'); }
        }
      };
    }

    // Helper function for safe get() calls
    const safeGet = () => {
      try {
        const store = get();
        if (!store) {
          console.error('[AuthSlice] get() returned undefined');
          return { family: { fetchFamily: null } };
        }
        return store;
      } catch (error) {
        console.error('[AuthSlice] Error calling get():', error);
        return { family: { fetchFamily: null } };
      }
    };

    // Log slice creation for debugging
    console.log('[AuthSlice] Creating auth slice with valid parameters');
    
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
            console.log('[AuthSlice] SignInWithGoogle - Firebase user:', firebaseUser.uid, firebaseUser.email);
            
            // First try to get existing user profile
            console.log('[AuthSlice] SignInWithGoogle - Attempting to get user profile for:', firebaseUser.uid);
            let user: User | null = await getUserProfile(firebaseUser.uid);
            console.log('[AuthSlice] SignInWithGoogle - Retrieved user profile:', user ? `Found user with familyId: ${user.familyId}` : 'No user profile found');
            
            if (!user) {
              // Create new user object only if profile doesn't exist
              user = {
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
              
              // Create new user profile
              console.log('[AuthSlice] SignInWithGoogle - Creating new user profile:', user);
              await createOrUpdateUserProfile(user.uid, user);
              console.log('[AuthSlice] SignInWithGoogle - New user profile created');
            } else {
              // Update existing user's last active date
              console.log('[AuthSlice] SignInWithGoogle - Updating existing user profile');
              user.lastActiveDate = new Date().toISOString();
              user.displayName = firebaseUser.displayName || user.displayName;
              user.photoURL = firebaseUser.photoURL || user.photoURL;
              await createOrUpdateUserProfile(user.uid, user);
              console.log('[AuthSlice] SignInWithGoogle - User profile updated, familyId:', user.familyId);
            }

            // Update auth state with the complete user profile
            console.log('[AuthSlice] SignInWithGoogle - Setting user in store:', user);
            set((state) => ({
              auth: {
                ...state.auth,
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null
              }
            }));
            
            // Verify the state was set correctly
            const verifyState = get();
            console.log('[AuthSlice] SignInWithGoogle - Verification after set:', {
              user: verifyState.auth?.user,
              isAuthenticated: verifyState.auth?.isAuthenticated,
              isLoading: verifyState.auth?.isLoading
            });

            console.log('[AuthSlice] Authentication successful, scheduling delayed Sentry context setting');
            // Set Sentry user context (delayed to prevent auth interference)
            if (user) {
              setUserContext({
                id: user.uid,
                familyId: user.familyId || undefined
              });
            }

            // If user has a familyId, load family data
            if (user.familyId) {
              console.log('[AuthSlice] User has familyId, loading family data:', user.familyId);
              
              // Defensive get() call
              const store = safeGet();
              const familySlice = store.family;
              if (familySlice && typeof familySlice.fetchFamily === 'function') {
                try {
                  await familySlice.fetchFamily(user.familyId);
                  console.log('[AuthSlice] Family data loaded successfully');
                } catch (familyError) {
                  console.error('[AuthSlice] Error loading family data:', familyError);
                  // Don't fail the whole auth process if family loading fails
                }
              } else {
                console.error('[AuthSlice] fetchFamily function not available:', {
                  hasFamilySlice: !!familySlice,
                  familySliceType: typeof familySlice,
                  storeKeys: Object.keys(store)
                });
              }
            } else {
              console.log('[AuthSlice] User has no familyId, will show family setup');
            }
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

            // Set Sentry user context
            if (user) {
              setUserContext({
                id: user.uid,
                familyId: user.familyId || undefined
              });
            }

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

            // Clear Sentry user context
            clearUserContext();

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

        checkAuthState: async () => {
          const isMock = isMockImplementation();
          
          set((state) => ({
            auth: { ...state.auth, isLoading: true }
          }));

          // For real Firebase on web, check for redirect results first
          if (!isMock && Platform.OS === 'web') {
            try {
              const { firebaseAuthBrowser } = await import('../services/firebaseAuthBrowser');
              const { getRedirectResult } = await import('firebase/auth');
              
              console.log('[AuthSlice] Checking for redirect authentication result...');
              const redirectResult = await getRedirectResult(auth);
              
              if (redirectResult) {
                console.log('[AuthSlice] Found redirect result, processing user...');
                // Handle redirect result similar to normal sign in
                const firebaseUser = redirectResult.user;
                
                // Try to get existing user profile
                let user: User | null = await getUserProfile(firebaseUser.uid);
                
                if (!user) {
                  // Create new user if profile doesn't exist
                  user = {
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
                  
                  await createOrUpdateUserProfile(user.uid, user);
                }
                
                console.log('[AuthSlice] Redirect auth completed, setting user state');
                set((state) => ({
                  auth: {
                    ...state.auth,
                    user,
                    isAuthenticated: true,
                    isLoading: false
                  }
                }));
                
                // Set Sentry user context
                if (user) {
                  setUserContext({
                    id: user.uid,
                    familyId: user.familyId || undefined
                  });
                }
                
                // Load family data if user has a familyId
                if (user.familyId) {
                  const familySlice = safeGet().family;
                  if (familySlice?.fetchFamily) {
                    try {
                      await familySlice.fetchFamily(user.familyId);
                    } catch (familyError) {
                      console.error('[AuthSlice] Error loading family data after redirect:', familyError);
                    }
                  }
                }
                
                return; // Exit early as redirect auth is complete
              }
            } catch (error) {
              console.warn('[AuthSlice] Error checking redirect result:', error);
            }
          }

          if (isMock) {
            // For mock auth, check current user
            const currentUser = auth.currentUser;
            if (currentUser) {
              try {
                // Try to get existing user profile first
                const profile = await getUserProfile(currentUser.uid);
                
                if (profile) {
                  set((state) => ({
                    auth: {
                      ...state.auth,
                      user: profile,
                      isAuthenticated: true,
                      isLoading: false
                    }
                  }));

                  // Set Sentry user context
                  setUserContext({
                    id: profile.uid,
                    familyId: profile.familyId || undefined
                  });

                  // If user has a familyId, load family data
                  if (profile.familyId) {
                    console.log('[AuthSlice] Mock auth - User has familyId, loading family data:', profile.familyId);
                    const familySlice = safeGet().family;
                    if (familySlice?.fetchFamily) {
                      try {
                        await familySlice.fetchFamily(profile.familyId);
                        console.log('[AuthSlice] Mock auth - Family data loaded successfully');
                      } catch (familyError) {
                        console.error('[AuthSlice] Error loading family data in mock mode:', familyError);
                      }
                    } else {
                      console.error('[AuthSlice] Mock auth - fetchFamily function not available');
                    }
                  } else {
                    console.log('[AuthSlice] Mock auth - User has no familyId, will show family setup');
                  }
                } else {
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

                  // Set Sentry user context
                  setUserContext({
                    id: user.uid,
                    familyId: user.familyId || undefined
                  });
                }
              } catch (error) {
                console.error('Error loading user profile in mock mode:', error);
                // Clear Sentry user context on error
                clearUserContext();
                
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
              // Clear Sentry user context
              clearUserContext();
              
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
            // Check if we already have an auth listener
            if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).__authUnsubscribe) {
              console.log('[AuthSlice] Auth state listener already exists, skipping duplicate setup');
              set((state) => ({
                auth: { ...state.auth, isLoading: false }
              }));
              return;
            }

            // Use Firebase auth state listener from centralized service
            console.log('[AuthSlice] Setting up new auth state listener');
            
            // Add flag to prevent clearing auth state on initial null
            let hasInitialLoad = false;
            
            const unsubscribe = authService.onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
              console.log('[AuthSlice] Auth state change triggered:', {
                hasUser: !!firebaseUser,
                userEmail: firebaseUser?.email,
                hasInitialLoad,
                timestamp: new Date().toISOString().slice(11, 23)
              });
              
              if (firebaseUser) {
                hasInitialLoad = true;
                
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

                    // Set Sentry user context
                    setUserContext({
                      id: profile.uid,
                      familyId: profile.familyId || undefined
                    });

                    // If user has a familyId, load family data
                    if (profile.familyId) {
                      console.log('[AuthSlice] Auth state change - User has familyId, loading family data:', profile.familyId);
                      const familySlice = safeGet().family;
                      if (familySlice?.fetchFamily) {
                        try {
                          await familySlice.fetchFamily(profile.familyId);
                          console.log('[AuthSlice] Auth state change - Family data loaded successfully');
                        } catch (familyError) {
                          console.error('[AuthSlice] Error loading family data:', familyError);
                        }
                      } else {
                        console.error('[AuthSlice] Auth state change - fetchFamily function not available');
                      }
                    } else {
                      console.log('[AuthSlice] Auth state change - User has no familyId, will show family setup');
                    }
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

                    // Set Sentry user context
                    setUserContext({
                      id: user.uid,
                      familyId: user.familyId || undefined
                    });
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
                // Only clear auth state if this is not the initial null event
                if (hasInitialLoad) {
                  console.log('[AuthSlice] Auth state change - User is null after initial load, clearing auth state');
                  
                  set((state) => ({
                    auth: {
                      ...state.auth,
                      user: null,
                      isAuthenticated: false,
                      isLoading: false
                    }
                  }));
                  
                  // Clear Sentry user context (delayed to prevent auth interference)
                  setTimeout(() => {
                    clearUserContext();
                  }, 500);
                } else {
                  console.log('[AuthSlice] Auth state change - Initial null user, skipping auth clear to prevent loop');
                  hasInitialLoad = true; // Mark that we've seen the initial event
                  
                  // Just clear loading state but don't clear auth
                  set((state) => ({
                    auth: {
                      ...state.auth,
                      isLoading: false
                    }
                  }));
                }
              }
            });

            // Store unsubscribe function for cleanup
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              (window as any).__authUnsubscribe = unsubscribe;
            }
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
}

// Export the auth slice creator
export const createAuthSlice: StateCreator<
  FamilyStore,
  [],
  [],
  AuthSlice
> = createAuthSliceFactory();