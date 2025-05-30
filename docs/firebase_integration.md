# Firebase Integration Guide for React Native/Expo Apps

## Overview

This guide documents the process, best practices, and common pitfalls when integrating Firebase (Authentication and Firestore) with React Native/Expo applications, based on our experience with the Family Clean app.

**Current as of:** May 2025
**Firebase Version:** 11.8.0
**Expo Version:** ~50.0.5
**React Native Version:** 0.73.2

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Firebase Configuration](#firebase-configuration)
3. [Authentication Setup](#authentication-setup)
4. [Firestore Database Setup](#firestore-database-setup)
5. [Platform-Specific Considerations](#platform-specific-considerations)
6. [Mock Implementations](#mock-implementations)
7. [Common Errors and Solutions](#common-errors-and-solutions)
8. [Best Practices](#best-practices)

## Initial Setup

### 1. Install Required Packages

```bash
# Core Firebase packages
npm install firebase

# For Expo
npx expo install @react-native-async-storage/async-storage
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable Google Analytics if needed

### 3. Register Your App

1. In Firebase Console, click the gear icon > "Project settings"
2. In the "Your apps" section, click the platform icon (Web, iOS, Android)
3. Follow registration steps for each platform
4. Copy the Firebase configuration object (apiKey, authDomain, etc.)

## Firebase Configuration

Create a dedicated configuration file (`config/firebase.ts`) to centralize Firebase setup:

```typescript
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { Platform } from 'react-native';

// Your Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Track initialization state
let _initialized = false;
let _firestoreDb = null;

// Initialize Firebase
export const initializeFirebase = async () => {
  if (_initialized) return;
  
  try {
    // Initialize Firebase if not already done
    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }
    
    const app = getApps()[0];
    
    // Handle persistence differently for web
    if (Platform.OS === 'web') {
      _firestoreDb = getFirestore(app);
      try {
        await enableIndexedDbPersistence(_firestoreDb);
        console.log("Enabled IndexedDB persistence for Firestore");
      } catch (error) {
        console.error("Error enabling persistence:", error);
      }
    } else {
      _firestoreDb = getFirestore(app);
    }
    
    _initialized = true;
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};

// Initialize immediately
initializeFirebase();

// Export Firebase services
export const auth = getAuth();
export const db = () => _firestoreDb || getFirestore();
```

### Key Configuration Points

1. **Initialize Once**: Track initialization state to avoid multiple initializations
2. **Platform Detection**: Handle platform-specific setup (web vs. native)
3. **Persistence**: Enable IndexedDB persistence for offline capabilities
4. **Centralized Exports**: Export Firebase services from a single file

## Authentication Setup

### 1. Create AuthContext

Create a context provider to handle authentication state (`contexts/AuthContext.tsx`):

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Platform } from 'react-native';

// Create provider
const googleProvider = new GoogleAuthProvider();

// Context type
type AuthContextType = {
  user: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        await signInWithPopup(auth, googleProvider);
      } else {
        // Handle native authentication 
        // (requires additional setup with Expo AuthSession)
        console.log("Native auth not implemented");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };
  
  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. Enable Authentication Methods

1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable Google Authentication
3. Add authorized domains for web authentication

### 3. Wrap App with AuthProvider

```typescript
// In app/_layout.tsx or equivalent
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Rest of your app */}
    </AuthProvider>
  );
}
```

## Firestore Database Setup

### 1. Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose starting mode (Test mode for development)
4. Select a location

### 2. Define Data Models

Create type definitions for your data models:

```typescript
// In services/firestore.ts
export interface Chore {
  id?: string;
  title: string;
  description?: string;
  points: number;
  assignedTo: string;
  assignedToName?: string;
  completedBy?: string;
  completedAt?: Date | string;
  dueDate: Date | string;
  createdAt: Date | string;
  familyId: string;
}

export interface Family {
  id?: string;
  name: string;
  adminId: string;
  createdAt: Date | string;
  members: FamilyMember[];
}

export interface FamilyMember {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'child';
  points: number;
  photoURL?: string;
}
```

### 3. Create CRUD Functions

Use the Firebase v9 modular API for all database operations:

```typescript
import { collection, addDoc, setDoc, doc, getDoc, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { auth } from '@/config/firebase';

// Get Firestore instance
const db = getFirestore();

// Helper function to format dates for Firestore
const formatForFirestore = (data: any) => {
  const formattedData = { ...data };
  // Convert Date objects to ISO strings
  Object.keys(formattedData).forEach(key => {
    if (formattedData[key] instanceof Date) {
      formattedData[key] = formattedData[key].toISOString();
    }
  });
  return formattedData;
};

// Example: Get chores for a family
export const getChores = async (familyId: string) => {
  try {
    // Create reference and query
    const choresRef = collection(db, 'chores');
    const q = query(choresRef, where('familyId', '==', familyId));
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Process results
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Chore[];
  } catch (error) {
    console.error('Error getting chores:', error);
    return [];
  }
};

// Example: Add a chore
export const addChore = async (chore: Omit<Chore, 'id'>) => {
  try {
    // Format data for Firestore
    const formattedChore = formatForFirestore(chore);
    
    // Add document with auto-generated ID
    const choresRef = collection(db, 'chores');
    const docRef = await addDoc(choresRef, formattedChore);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding chore:', error);
    throw error;
  }
};

// Example: Get a family by ID
export const getFamily = async (familyId: string) => {
  try {
    // Get document by ID
    const familyDocRef = doc(db, 'families', familyId);
    const familySnapshot = await getDoc(familyDocRef);
    
    if (familySnapshot.exists()) {
      return { 
        id: familySnapshot.id, 
        ...familySnapshot.data() 
      } as Family;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting family:', error);
    throw error;
  }
};
```

### 4. Security Rules

Set up appropriate security rules in Firebase Console:

```
// Example rules for production
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
      
      match /members/{memberId} {
        allow read: if request.auth != null && 
          exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/families/$(familyId)).data.adminId == request.auth.uid;
      }
    }
    
    match /chores/{choreId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/families/$(resource.data.familyId)/members/$(request.auth.uid));
      allow create, update: if request.auth != null && 
        exists(/databases/$(database)/documents/families/$(request.resource.data.familyId)/members/$(request.auth.uid));
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.adminId == request.auth.uid;
    }
  }
}

// For testing/development (less secure)
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Platform-Specific Considerations

### Web

1. **Authentication**: Use `signInWithPopup` for web authentication
2. **IndexedDB Persistence**: Enable for offline support on web
3. **CORS**: Ensure Firebase project settings allow your domains

### iOS/Android with Expo

1. **Authentication**: Use Expo AuthSession for native auth flows
2. **Async Storage**: Install `@react-native-async-storage/async-storage`
3. **Firebase Config**: Use different configurations for native vs web

### Expo Go Limitations

Expo Go has limitations with native Firebase SDKs. Options:

1. **Use Mock Implementation**: Create mock implementations for development
2. **Use EAS Build**: For testing with real native modules
3. **Use Firebase REST API**: As alternative to native SDKs

## Mock Implementations

For development or when Firebase can't be used (like in Expo Go), create mock implementations:

```typescript
// Mock collection
class MockCollectionReference {
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

// Mock user
const mockUser = {
  uid: 'mock-user-id',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: 'https://via.placeholder.com/150'
};

// Mock auth
const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: (callback) => {
    setTimeout(() => callback(mockUser), 100);
    return () => {};
  },
  signInWithPopup: async () => ({ user: mockUser }),
  signOut: async () => {}
};
```

## Common Errors and Solutions

### 1. "Component auth has not been registered yet"

**Cause**: Native Firebase modules not available in Expo Go

**Solution**: 
- Create mock implementations
- Use development builds with EAS Build
- Use Firebase Web SDK

### 2. Missing Firebase Collections/Methods

**Error**: `TypeError: familiesCollection.doc is not a function`

**Solution**:
- Use Firebase v9 modular API: `doc(db, 'collection', 'id')`
- Ensure Firebase is properly initialized
- Check for circular dependencies

### 3. IndexedDB Persistence Errors

**Error**: `FirebaseError: Failed to get document because the client is offline.`

**Solution**:
- Add error handling for offline scenarios
- Simplify persistence configuration
- Check browser compatibility (private browsing issues)

### 4. Authentication Errors on Web

**Error**: `FirebaseError: Firebase: Error (auth/unauthorized-domain).`

**Solution**:
- Add your domain to authorized domains in Firebase Console
- Use `localhost` during development
- Check for protocol mismatch (http vs https)

## Best Practices

### 1. Initialization

- Initialize Firebase only once
- Use async initialization with proper error handling
- Track initialization state to prevent duplicate initialization

### 2. Data Structure

- Use typed interfaces for data models
- Format dates consistently (ISO strings)
- Use consistent ID generation strategies
- Add timestamps for created/updated fields

### 3. Error Handling

- Add comprehensive error handling for all Firebase operations
- Provide fallbacks for offline scenarios
- Log detailed error information for debugging
- Use try/catch blocks around all async operations

### 4. Security

- Set up proper security rules for production
- Validate data before writing to Firestore
- Never expose Firebase API keys in client-side code (use environment variables)
- Implement proper authentication checks

### 5. Performance

- Use batched writes for multiple operations
- Implement pagination for large collections
- Add caching strategies for frequently accessed data
- Consider using Firebase Functions for complex operations

### 6. Testing

- Create separate Firebase projects for development/testing
- Implement mock implementations for testing
- Use Firebase Local Emulator Suite for local development

## Known Issues and Solutions

### 1. Expo Go Limitations
**Issue**: Real Firebase doesn't work in Expo Go on iOS due to native module requirements.  
**Solution**: The app automatically uses mock implementations in this case. Production builds via EAS work correctly with real Firebase.

### 2. Firebase Auth Metro Bundler Warnings (Fixed in v2.118)
**Issue**: Previous versions showed warnings: `[Metro] Could not resolve browser entry for firebase/auth: Package subpath './auth/package.json' is not defined by "exports"`  
**Solution**: Removed custom resolver in `metro.config.js`. Firebase v11+ handles platform-specific builds automatically. The `resolverMainFields` configuration is sufficient.

### 3. Mock Mode Detection
**Issue**: Sometimes the app uses mock mode when it should use real Firebase.  
**Solution**: Check `EXPO_PUBLIC_USE_MOCK` environment variable and ensure it's set to `false` for production builds.

## Conclusion

Firebase provides powerful tools for building authenticated, data-driven applications across web and mobile platforms. By following these best practices and understanding platform-specific considerations, you can create robust applications with seamless online/offline experiences.

Remember to keep Firebase SDKs updated, review security rules regularly, and monitor usage to ensure optimal performance and cost management. 