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

// Mock collection implementation
interface MockCollection {
  doc: (id: string) => any;
  where: (field: string, op: string, value: any) => any;
  add: (data: any) => Promise<{ id: string }>;
}

export class MockCollectionReference implements MockCollection {
  constructor(public path: string) {}
  
  doc(id: string) {
    return {
      id,
      get: async () => ({
        id,
        exists: true,
        data: () => ({ title: 'Mock document' })
      }),
      set: async (data: any, options?: any) => {}
    };
  }
  
  where(field: string, op: string, value: any) {
    return {
      get: async () => ({
        docs: [
          {
            id: 'mock-doc-1',
            data: () => ({ title: 'Mock document 1' })
          }
        ]
      })
    };
  }
  
  add(data: any) {
    return Promise.resolve({ id: `mock-${Date.now()}` });
  }
}

// Version to confirm updates (v8)
console.log("Firebase config version: v8");

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
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
  // Check if running in Expo Go
  const isExpoGo = !__DEV__ ? false : !(global as any).expo?.modules?.ExpoUpdates?.isEmbeddedLaunch;
  
  if (Platform.OS === 'ios' && isExpoGo) {
    console.log('iOS Expo Go detected, using mock implementation');
    return true;
  }
  
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    console.log('Mock mode enabled via environment variable');
    return true;
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
  
  if (_isUsingMock) {
    console.log("Initializing mock Firebase implementation");
    _firebaseInitialized = true;
    return;
  }
  
  try {
    // Check if Firebase is already initialized
    const apps = getApps();
    if (apps.length === 0) {
      console.log("Initializing Firebase with config");
      initializeApp(firebaseConfig);
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
        await enableIndexedDbPersistence(_firestoreDb);
        console.log("Successfully enabled IndexedDB persistence for Firestore");
      } catch (error) {
        console.error("Error enabling Firestore persistence:", error);
        
        // Fall back to regular Firestore
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
export const auth = (() => {
  if (isMockImplementation()) {
    // Return mock auth object compatible with real Firebase Auth API
    console.log("Using mock auth implementation");
    return {
      currentUser: mockUser,
      onAuthStateChanged: (callback: (user: any) => void) => {
        // Simulate auth state change after a short delay
        console.log("Setting up mock auth state listener");
        setTimeout(() => {
          console.log("Mock auth state change - providing mock user");
          callback(mockUser);
        }, 100);
        return () => {}; // Return unsubscribe function
      },
      signInWithPopup: async () => {
        console.log("Mock signInWithPopup called");
        return { user: mockUser };
      },
      signInAnonymously: async () => {
        console.log("Mock signInAnonymously called");
        return { user: { ...mockUser, isAnonymous: true, displayName: 'Guest Admin' } };
      },
      signOut: async () => {
        console.log("Mock signOut called");
      },
    } as any;
  }
  
  try {
    console.log("Getting real Firebase auth instance");
    return getAuth();
  } catch (error) {
    console.error("Error getting auth instance:", error);
    // Return mock auth as fallback
    console.log("Falling back to mock auth after error");
    return {
      currentUser: mockUser,
      onAuthStateChanged: (callback: (user: any) => void) => {
        setTimeout(() => callback(mockUser), 100);
        return () => {};
      },
      signInWithPopup: async () => ({ user: mockUser }),
      signInAnonymously: async () => ({ user: { ...mockUser, isAnonymous: true, displayName: 'Guest Admin' } }),
      signOut: async () => {},
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

