import { getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  getFirestore
} from 'firebase/firestore';
import { Platform } from 'react-native';

console.log('--- FIREBASE DEBUG ---');
try {
  // Platform might not be available before import, so wrap in try/catch
  // If you get an error, move this after the imports
  // eslint-disable-next-line no-undef
  console.log('Platform.OS:', typeof Platform !== 'undefined' ? Platform.OS : 'undefined');
} catch (e) {
  console.log('Platform.OS: (error)', e);
}
console.log('EXPO_PUBLIC_USE_MOCK:', process.env.EXPO_PUBLIC_USE_MOCK);

// Mock collection implementation with in-memory storage
interface MockCollection {
  doc: (id: string) => any;
  where: (field: string, op: string, value: any) => any;
  add: (data: any) => Promise<{ id: string }>;
}

// In-memory storage for mock data
const mockDatabase: { [collection: string]: { [id: string]: any } } = {};

export class MockCollectionReference implements MockCollection {
  constructor(public path: string) {
    // Initialize collection if it doesn't exist
    if (!mockDatabase[this.path]) {
      mockDatabase[this.path] = {};
    }
  }
  
  doc(id: string) {
    return {
      id,
      get: async () => {
        const data = mockDatabase[this.path][id];
        return {
          id,
          exists: !!data,
          data: () => data || null
        };
      },
      set: async (data: any, options?: any) => {
        // Store data in mock database
        if (options?.merge && mockDatabase[this.path][id]) {
          mockDatabase[this.path][id] = { ...mockDatabase[this.path][id], ...data };
        } else {
          mockDatabase[this.path][id] = data;
        }
        console.log(`Mock: Set document ${id} in ${this.path}:`, data);
      },
      update: async (data: any) => {
        if (mockDatabase[this.path][id]) {
          mockDatabase[this.path][id] = { ...mockDatabase[this.path][id], ...data };
          console.log(`Mock: Updated document ${id} in ${this.path}:`, data);
        }
      },
      delete: async () => {
        delete mockDatabase[this.path][id];
        console.log(`Mock: Deleted document ${id} from ${this.path}`);
      }
    };
  }
  
  where(field: string, op: string, value: any) {
    return {
      get: async () => {
        // Simple mock implementation - just return all docs for now
        const allDocs = Object.entries(mockDatabase[this.path] || {}).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));
        
        // Basic filtering for some common operations
        let filteredDocs = allDocs;
        if (op === '==' && field && value !== undefined) {
          filteredDocs = allDocs.filter(doc => {
            const docData = doc.data();
            return docData && docData[field] === value;
          });
        }
        
        console.log(`Mock: Query ${this.path} where ${field} ${op} ${value}, found ${filteredDocs.length} docs`);
        
        return {
          docs: filteredDocs,
          empty: filteredDocs.length === 0
        };
      }
    };
  }
  
  add(data: any) {
    const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    mockDatabase[this.path][id] = data;
    console.log(`Mock: Added document ${id} to ${this.path}:`, data);
    return Promise.resolve({ id });
  }
}

// Helper function to initialize mock data for testing
export const initializeMockData = () => {
  console.log("Initializing mock data for testing...");
  
  // Create a default family for testing
  const mockFamilyId = 'mock-family-123';
  const mockFamily = {
    id: mockFamilyId,
    name: 'Mock Family',
    adminId: 'guest-admin-user',
    joinCode: 'MOCK123',
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [{
      uid: 'guest-admin-user',
      name: 'Guest Admin',
      email: 'guest@familyclean.app',
      role: 'admin',
      familyRole: 'parent',
      points: {
        current: 100,
        lifetime: 500,
        weekly: 50
      },
      photoURL: 'https://via.placeholder.com/150',
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
  
  // Store in mock database
  if (!mockDatabase['families']) {
    mockDatabase['families'] = {};
  }
  mockDatabase['families'][mockFamilyId] = mockFamily;
  
  // Create user profile
  const mockUserProfile = {
    uid: 'guest-admin-user',
    email: 'guest@familyclean.app',
    displayName: 'Guest Admin',
    photoURL: 'https://via.placeholder.com/150',
    familyId: mockFamilyId,
    role: 'admin',
    familyRole: 'parent',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      theme: 'light',
      notifications: true
    },
    stats: {
      totalChoresCompleted: 25,
      weeklyChoresCompleted: 5,
      currentStreak: 3,
      longestStreak: 10
    },
    xp: {
      current: 350,
      level: 3,
      nextLevelXp: 400
    },
    achievements: [],
    badges: []
  };
  
  if (!mockDatabase['users']) {
    mockDatabase['users'] = {};
  }
  mockDatabase['users']['guest-admin-user'] = mockUserProfile;
  
  console.log("Mock data initialized successfully");
};

// Version to confirm updates (v9)
console.log("Firebase config version: v9");

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

// Validate Firebase configuration
const validateFirebaseConfig = (): boolean => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    return false;
  }
  
  console.log('Firebase configuration validated successfully');
  return true;
};

// Mock user data for testing
export const mockUser = {
  uid: 'guest-admin-user',
  email: 'guest@familyclean.app',
  displayName: 'Guest Admin',
  photoURL: 'https://via.placeholder.com/150',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toString(),
    lastSignInTime: new Date().toString()
  }
};

// Firebase initialization state
let _firebaseInitialized = false;
let _isUsingMock = false;
let _firestoreDb: any = null;

// Function to determine if we should use mock implementation
// We use mock when:
// 1. On iOS in Expo Go (due to Expo Go limitations with Firebase native modules)
// 2. During development/testing if explicitly requested
export const shouldUseMock = (): boolean => {
  console.log('=== FIREBASE DEBUG: shouldUseMock() ===');
  console.log('Platform.OS:', Platform.OS);
  console.log('__DEV__:', __DEV__);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EXPO_PUBLIC_USE_MOCK:', process.env.EXPO_PUBLIC_USE_MOCK);
  
  // Check environment variable first - explicit override
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    console.log('Mock mode enabled via environment variable');
    return true;
  }
  
  // CRITICAL FIX: For production builds, ALWAYS use real Firebase
  // This includes EAS builds and App Store builds
  if (!__DEV__) {
    console.log('PRODUCTION BUILD DETECTED (__DEV__ = false), FORCING REAL FIREBASE');
    console.log('This is a production/EAS build - real Firebase WILL be used');
    return false;
  }
  
  // Additional check: if we have a complete Firebase config, prefer real Firebase
  const hasCompleteConfig = !!(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  );
  
  if (hasCompleteConfig) {
    console.log('Complete Firebase config detected, preferring real Firebase');
  }
  
  // Only in development, check if running in Expo Go
  try {
    // Check if we're in Expo Go vs a standalone build
    // In standalone builds (EAS), Constants.appOwnership will be 'standalone' or undefined
    // In Expo Go, Constants.appOwnership will be 'expo'
    const Constants = require('expo-constants').default;
    const isExpoGo = Constants.appOwnership === 'expo';
    
    console.log('Constants.appOwnership:', Constants.appOwnership);
    console.log('isExpoGo (development only):', isExpoGo);
    console.log('hasCompleteConfig:', hasCompleteConfig);
    
    // Only use mock if we're truly in Expo Go on iOS
    if (Platform.OS === 'ios' && isExpoGo) {
      console.log('iOS Expo Go detected in development, using mock implementation');
      return true;
    }
  } catch (error) {
    console.log('Error checking Expo Go status:', error);
    // If we can't determine, assume we're NOT in Expo Go
    console.log('Could not determine Expo Go status, assuming standalone build');
  }
  
  console.log('Using real Firebase implementation');
  return false;
};

// Function to initialize Firebase (real or mock)
export const initializeFirebase = async () => {
  // Skip if already initialized
  if (_firebaseInitialized) {
    console.log("Firebase already initialized, skipping");
    return;
  }
  
  // Determine if we should use mock
  _isUsingMock = shouldUseMock();
  
  // CRITICAL: Log the decision clearly
  console.log('=== FIREBASE INITIALIZATION DECISION ===');
  console.log('Using Mock Firebase:', _isUsingMock);
  console.log('Build Type:', __DEV__ ? 'Development' : 'Production');
  console.log('Platform:', Platform.OS);
  console.log('=======================================');
  
  if (_isUsingMock) {
    console.log("Initializing mock Firebase implementation");
    initializeMockData();
    _firebaseInitialized = true;
    return;
  }
  
  // Validate Firebase configuration before initializing
  if (!validateFirebaseConfig()) {
    console.error("Invalid Firebase configuration, falling back to mock implementation");
    _isUsingMock = true;
    initializeMockData();
    _firebaseInitialized = true;
    return;
  }
  
  try {
    // Check if Firebase is already initialized
    const apps = getApps();
    if (apps.length === 0) {
      console.log("=== FIREBASE DEBUG: Initializing Firebase ===");
      console.log("Firebase config:", {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey ? '***' : 'MISSING'
      });
      console.log("Full config keys:", Object.keys(firebaseConfig));
      initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully");
    } else {
      console.log("Firebase app already initialized, using existing app");
    }
    
    // Get the active app
    const app = apps.length > 0 ? apps[0] : getApps()[0];
    
    // Initialize Firestore with persistence for web
    if (Platform.OS === 'web') {
      console.log("Initializing Firestore with persistence for web");
      try {
        // Initialize Firestore with persistence using the simpler approach
        console.log("Using simplified persistence approach");
        _firestoreDb = getFirestore(app);
        
        // Try to enable persistence with multi-tab support
        await enableIndexedDbPersistence(_firestoreDb, {
          forceOwnership: false // Allow multiple tabs to share persistence
        }).catch((err) => {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.warn('Persistence failed: Multiple tabs open. Using memory cache instead.');
          } else if (err.code === 'unimplemented') {
            // The current browser doesn't support persistence
            console.warn('Persistence failed: Browser doesn\'t support IndexedDB');
          }
          throw err;
        });
        console.log("Successfully enabled IndexedDB persistence for Firestore");
      } catch (error) {
        console.error("Error enabling Firestore persistence:", error);
        
        // Fall back to regular Firestore without persistence
        console.log("Falling back to standard Firestore without persistence");
        // No need to reinitialize, just continue with the existing instance
      }
    } else {
      // For native platforms, use regular Firestore
      _firestoreDb = getFirestore(app);
    }
    
    // Connect to emulators if in development
    if (process.env.NODE_ENV === 'development' && process.env.EXPO_PUBLIC_USE_EMULATOR === 'true') {
      try {
        const auth = getAuth(app);
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(_firestoreDb, 'localhost', 8080);
        console.log("Connected to Firebase emulators");
      } catch (err) {
        console.warn("Failed to connect to Firebase emulators:", err);
      }
    }
    
    _firebaseInitialized = true;
    console.log("Firebase initialized successfully");
    console.log('Firebase config:', firebaseConfig);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    _isUsingMock = true;
    console.log("Falling back to mock implementation");
  }
};

// Initialize Firebase on import
initializeFirebase()
  .then(() => console.log("Firebase initialization promise resolved"))
  .catch(err => console.error("Firebase initialization promise rejected:", err));

// Helper function to check if we're using mock implementation
export const isMockImplementation = (): boolean => {
  return _isUsingMock;
};

// Get Firestore instance
export const getFirestoreDb = () => {
  if (_firestoreDb) {
    return _firestoreDb;
  }
  
  if (isMockImplementation()) {
    return null;
  }
  
  return getFirestore();
};

// Safe collection helper that works with both real and mock implementations
export const safeCollection = (collectionPath: string): any => {
  console.log(`Creating collection for: ${collectionPath}, mock mode: ${isMockImplementation()}`);
  
  if (isMockImplementation()) {
    console.log(`Returning mock collection for: ${collectionPath}`);
    // Return mock collection
    return new MockCollectionReference(collectionPath);
  }
  
  try {
    // Return real collection
    const db = getFirestoreDb();
    if (!db) {
      console.error(`No Firestore db available for ${collectionPath}, falling back to mock`);
      return new MockCollectionReference(collectionPath);
    }
    
    console.log(`Creating real Firestore collection for: ${collectionPath}`);
    const realCollection = collection(db, collectionPath);
    console.log(`Successfully created real collection for: ${collectionPath}`, realCollection);
    return realCollection;
  } catch (error) {
    console.error(`Error creating collection ${collectionPath}:`, error);
    // Fall back to mock on error
    console.log(`Falling back to mock collection for: ${collectionPath}`);
    return new MockCollectionReference(collectionPath);
  }
};

// Create Firebase Auth instance
let mockAuthStateCallbacks: ((user: any) => void)[] = [];
let mockCurrentUser: any = null;

export const auth = (() => {
  if (isMockImplementation()) {
    // Return mock auth object compatible with real Firebase Auth API
    console.log("Using mock auth implementation");
    return {
      get currentUser() { return mockCurrentUser; },
      onAuthStateChanged: (callback: (user: any) => void) => {
        // Store callback for later use
        console.log("Setting up mock auth state listener");
        mockAuthStateCallbacks.push(callback);
        
        // If there's already a user, call the callback immediately
        if (mockCurrentUser) {
          setTimeout(() => {
            console.log("Mock auth state change - providing existing user");
            callback(mockCurrentUser);
          }, 100);
        }
        
        return () => {
          // Remove callback when unsubscribing
          const index = mockAuthStateCallbacks.indexOf(callback);
          if (index > -1) {
            mockAuthStateCallbacks.splice(index, 1);
          }
        };
      },
      signInWithPopup: async () => {
        console.log("Mock signInWithPopup called");
        mockCurrentUser = mockUser;
        // Notify all listeners
        mockAuthStateCallbacks.forEach(callback => {
          setTimeout(() => callback(mockCurrentUser), 50);
        });
        return { user: mockUser };
      },
      signInAnonymously: async () => {
        console.log("Mock signInAnonymously called");
        const anonymousUser = { ...mockUser, isAnonymous: true, displayName: 'Guest Admin' };
        mockCurrentUser = anonymousUser;
        // Notify all listeners
        mockAuthStateCallbacks.forEach(callback => {
          setTimeout(() => callback(mockCurrentUser), 50);
        });
        return { user: anonymousUser };
      },
      signOut: async () => {
        console.log("Mock signOut called");
        mockCurrentUser = null;
        // Notify all listeners about sign out
        mockAuthStateCallbacks.forEach(callback => {
          setTimeout(() => callback(null), 50);
        });
      },
    } as any;
  }
  
  try {
    console.log("Getting real Firebase auth instance");
    return getAuth();
  } catch (error) {
    console.error("Error getting auth instance:", error);
    // Return mock auth as fallback with proper state management
    console.log("Falling back to mock auth after error");
    return {
      get currentUser() { return mockCurrentUser; },
      onAuthStateChanged: (callback: (user: any) => void) => {
        mockAuthStateCallbacks.push(callback);
        if (mockCurrentUser) {
          setTimeout(() => callback(mockCurrentUser), 100);
        }
        return () => {
          const index = mockAuthStateCallbacks.indexOf(callback);
          if (index > -1) {
            mockAuthStateCallbacks.splice(index, 1);
          }
        };
      },
      signInWithPopup: async () => {
        mockCurrentUser = mockUser;
        mockAuthStateCallbacks.forEach(callback => {
          setTimeout(() => callback(mockCurrentUser), 50);
        });
        return { user: mockUser };
      },
      signInAnonymously: async () => {
        const anonymousUser = { ...mockUser, isAnonymous: true, displayName: 'Guest Admin' };
        mockCurrentUser = anonymousUser;
        mockAuthStateCallbacks.forEach(callback => {
          setTimeout(() => callback(mockCurrentUser), 50);
        });
        return { user: anonymousUser };
      },
      signOut: async () => {
        mockCurrentUser = null;
        mockAuthStateCallbacks.forEach(callback => {
          setTimeout(() => callback(null), 50);
        });
      },
    } as any;
  }
})();

// Create Google Auth Provider
export const googleProvider = (() => {
  if (isMockImplementation()) {
    // Return a minimal mock provider
    console.log("Using mock Google provider");
    return { 
      addScope: () => {},
      providerId: 'google.com'
    } as any;
  }
  
  try {
    console.log("Creating real Google auth provider");
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    return provider;
  } catch (error) {
    console.error("Error creating Google provider:", error);
    // Return mock provider as fallback
    return { 
      addScope: () => {},
      providerId: 'google.com'
    } as any;
  }
})();

