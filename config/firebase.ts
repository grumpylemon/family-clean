import { getApps, initializeApp } from 'firebase/app';
import { Platform } from 'react-native';

// Import only the types to avoid bundling issues
import type { Auth } from 'firebase/auth';

// Conditionally import Firebase auth based on platform
let connectAuthEmulator: any;
let getAuth: any;
let initializeAuth: any;
let getReactNativePersistence: any;
let GoogleAuthProvider: any;

if (Platform.OS === 'web') {
  // For web, use standard imports
  const webAuth = require('firebase/auth');
  connectAuthEmulator = webAuth.connectAuthEmulator;
  getAuth = webAuth.getAuth;
  initializeAuth = webAuth.initializeAuth;
  GoogleAuthProvider = webAuth.GoogleAuthProvider;
} else {
  // For React Native, import with persistence support
  const rnAuth = require('firebase/auth');
  connectAuthEmulator = rnAuth.connectAuthEmulator;
  getAuth = rnAuth.getAuth;
  initializeAuth = rnAuth.initializeAuth;
  getReactNativePersistence = rnAuth.getReactNativePersistence;
  GoogleAuthProvider = rnAuth.GoogleAuthProvider;
}

// Import AsyncStorage only for React Native
let AsyncStorage: any;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

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

// Initialize _isUsingMock immediately based on current environment
// Using simplified detection logic to match shouldUseMock()
_isUsingMock = (() => {
  console.log('🔍 EARLY MOCK DETECTION v2.119: Determining Firebase mode...');
  console.log('process.env.EXPO_PUBLIC_FORCE_PRODUCTION:', process.env.EXPO_PUBLIC_FORCE_PRODUCTION);
  console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('__DEV__:', __DEV__);
  console.log('process.env.EXPO_PUBLIC_USE_MOCK:', process.env.EXPO_PUBLIC_USE_MOCK);
  
  // 🚨 PRIORITY 1: Explicit Environment Variables (early detection can't check hostname)
  if (process.env.EXPO_PUBLIC_FORCE_REAL_FIREBASE === 'true') {
    console.log('🚀 EARLY: Real Firebase forced via EXPO_PUBLIC_FORCE_REAL_FIREBASE');
    return false;
  }
  
  if (process.env.EXPO_PUBLIC_FORCE_PRODUCTION === 'true') {
    console.log('🚀 EARLY: Production forced via EXPO_PUBLIC_FORCE_PRODUCTION');
    return false;
  }
  
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'false') {
    console.log('🚀 EARLY: Real Firebase forced via EXPO_PUBLIC_USE_MOCK=false');
    return false;
  }
  
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    console.log('🧪 EARLY: Mock Firebase forced via EXPO_PUBLIC_USE_MOCK=true');
    return true;
  }
  
  // 🚨 PRIORITY 2: Build Environment Detection
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 EARLY: Production build (NODE_ENV) - Real Firebase');
    return false;
  }
  
  if (typeof __DEV__ !== 'undefined' && __DEV__ === false) {
    console.log('🚀 EARLY: Production build (__DEV__=false) - Real Firebase');
    return false;
  }
  
  // 🚨 PRIORITY 3: iOS Expo Go Detection
  try {
    if (Platform.OS === 'ios') {
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        console.log('📱 EARLY: iOS Expo Go detected - Mock Firebase');
        return true;
      } else {
        console.log('📱 EARLY: iOS standalone build - Real Firebase');
        return false;
      }
    }
  } catch (e) {
    console.log('Could not check iOS Constants early:', e);
  }
  
  // 🚨 PRIORITY 4: Complete Firebase Config Check
  const hasCompleteConfig = !!(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  );
  
  if (hasCompleteConfig) {
    console.log('✅ EARLY: Complete Firebase config - Real Firebase');
    return false;
  }
  
  // 🚨 FALLBACK: Development with incomplete config
  console.log('⚠️ EARLY: Defaulting to mock for development');
  return true;
})();

console.log('🎯 FINAL DECISION: _isUsingMock =', _isUsingMock);

// Function to determine if we should use mock implementation
// SIMPLIFIED LOGIC (v2.119): Clear priority order to prevent production mock mode issues
export const shouldUseMock = (): boolean => {
  console.log('=== FIREBASE MOCK DETECTION v2.119 ===');
  console.log('Platform.OS:', Platform.OS);
  console.log('__DEV__:', __DEV__);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EXPO_PUBLIC_USE_MOCK:', process.env.EXPO_PUBLIC_USE_MOCK);
  console.log('EXPO_PUBLIC_FORCE_PRODUCTION:', process.env.EXPO_PUBLIC_FORCE_PRODUCTION);
  
  // 🚨 PRIORITY 1: Production Domain Detection (Web)
  if (Platform.OS === 'web') {
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const isProductionDomain = hostname === 'family-fun-app.web.app' || hostname === 'family-fun-app.firebaseapp.com';
      if (isProductionDomain) {
        console.log('🌐 PRODUCTION DOMAIN DETECTED:', hostname, '- FORCING REAL FIREBASE');
        return false;
      }
      console.log('Web hostname:', hostname);
    } catch (e) {
      console.log('Could not check hostname:', e);
    }
  }
  
  // 🚨 PRIORITY 2: Explicit Environment Variables
  if (process.env.EXPO_PUBLIC_FORCE_PRODUCTION === 'true') {
    console.log('🚀 PRODUCTION FORCED via EXPO_PUBLIC_FORCE_PRODUCTION - REAL FIREBASE');
    return false;
  }
  
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'false') {
    console.log('🚀 REAL FIREBASE FORCED via EXPO_PUBLIC_USE_MOCK=false');
    return false;
  }
  
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    console.log('🧪 MOCK FIREBASE FORCED via EXPO_PUBLIC_USE_MOCK=true');
    return true;
  }
  
  // 🚨 PRIORITY 3: Build Environment Detection
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 PRODUCTION BUILD (NODE_ENV) - REAL FIREBASE');
    return false;
  }
  
  if (typeof __DEV__ !== 'undefined' && __DEV__ === false) {
    console.log('🚀 PRODUCTION BUILD (__DEV__=false) - REAL FIREBASE');
    return false;
  }
  
  // 🚨 PRIORITY 4: Expo Go vs Standalone Detection (iOS only)
  if (Platform.OS === 'ios') {
    try {
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';
      
      console.log('=== iOS EXPO GO DETECTION ===');
      console.log('Constants.appOwnership:', Constants.appOwnership);
      console.log('isExpoGo:', isExpoGo);
      console.log('isDevice:', Constants.isDevice);
      
      if (isExpoGo) {
        console.log('📱 iOS EXPO GO DETECTED - USING MOCK (Firebase native modules not available)');
        return true;
      } else {
        console.log('📱 iOS STANDALONE BUILD - USING REAL FIREBASE');
        return false;
      }
    } catch (error) {
      console.log('❌ Error checking iOS Constants:', error);
      // If Constants check fails, assume standalone and use real Firebase
      console.log('📱 Constants check failed - ASSUMING STANDALONE, USING REAL FIREBASE');
      return false;
    }
  }
  
  // 🚨 PRIORITY 5: Complete Firebase Config Check
  const hasCompleteConfig = !!(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  );
  
  if (hasCompleteConfig) {
    console.log('✅ COMPLETE FIREBASE CONFIG - USING REAL FIREBASE');
    return false;
  }
  
  // 🚨 FALLBACK: Development with incomplete config
  console.log('⚠️  FALLBACK: Development with incomplete config - USING MOCK');
  return true;
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
    
    // Initialize Firestore with modern cache persistence for web
    if (Platform.OS === 'web') {
      console.log("Initializing Firestore with modern cache persistence for web");
      try {
        // Initialize Firestore with modern cache persistence using the new API
        console.log("Using modern cache-based persistence approach");
        
        // Configure Firestore with persistent cache and multi-tab support
        try {
          // Use initializeFirestore with long polling for better compatibility
          const { initializeFirestore } = await import('firebase/firestore');
          _firestoreDb = initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            }),
            experimentalForceLongPolling: true
          });
          
          // Set up error handlers for Firestore network operations
          if (_firestoreDb) {
            // Add a listener for network errors
            const unsubscribe = _firestoreDb._delegate?._databaseId?.isDefaultDatabase;
            console.log("Firestore initialized with long polling");
          }
        } catch (cacheError) {
          console.warn("Cache initialization failed, trying with long polling only:", cacheError);
          try {
            const { initializeFirestore } = await import('firebase/firestore');
            _firestoreDb = initializeFirestore(app, {
              experimentalForceLongPolling: true
            });
          } catch (fallbackError) {
            console.warn("Long polling initialization failed, using standard Firestore:", fallbackError);
            _firestoreDb = getFirestore(app);
          }
        }
        
        console.log("Successfully initialized Firestore with cache persistence");
      } catch (error) {
        console.error("Error initializing Firestore with cache persistence:", error);
        
        // Fall back to regular Firestore without persistence
        console.log("Falling back to standard Firestore without persistence");
        _firestoreDb = getFirestore(app);
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

// Get reason for mock mode - helpful for debugging
export const getMockModeReason = (): string => {
  if (!_isUsingMock) {
    return 'Real Firebase in use';
  }
  
  // Check reasons in priority order
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname === 'family-fun-app.web.app' || hostname === 'family-fun-app.firebaseapp.com') {
      return 'Production domain detected - should use Real Firebase';
    }
  }
  
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    return 'EXPO_PUBLIC_USE_MOCK=true environment variable';
  }
  
  if (Platform.OS === 'ios') {
    try {
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) {
        return 'iOS Expo Go detected (Firebase native modules unavailable)';
      }
    } catch (e) {
      // Ignore
    }
  }
  
  const hasCompleteConfig = !!(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  );
  
  if (!hasCompleteConfig) {
    return 'Incomplete Firebase configuration';
  }
  
  return 'Development environment fallback';
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
    console.log("Platform.OS:", Platform.OS);
    console.log("typeof window:", typeof window);
    console.log("navigator.userAgent:", typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined');
    
    // More robust web detection
    const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
    console.log("isWeb:", isWeb);
    
    // For web, use standard getAuth (no AsyncStorage needed)
    if (isWeb) {
      console.log("Using standard getAuth for web platform");
      const app = getApps()[0];
      if (!app) {
        throw new Error('Firebase app not initialized');
      }
      return getAuth(app);
    }
    
    // For native platforms, use initializeAuth with AsyncStorage persistence
    const app = getApps()[0];
    if (!app) {
      throw new Error('Firebase app not initialized');
    }
    
    try {
      // Try to get existing auth instance first
      return getAuth(app);
    } catch {
      // If no auth instance exists, initialize with AsyncStorage persistence
      console.log("Initializing auth with AsyncStorage persistence for React Native");
      if (!AsyncStorage || !getReactNativePersistence) {
        throw new Error('AsyncStorage or getReactNativePersistence not available');
      }
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
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

// Note: GoogleAuthProvider is now created dynamically in authService to avoid bundling issues
// The bundler was having trouble preserving the function references when exported directly

