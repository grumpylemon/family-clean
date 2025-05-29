// Centralized Firebase Auth Service
// This service handles all Firebase auth operations to avoid bundling issues

import { isMockImplementation } from '@/config/firebase';
import { Platform } from 'react-native';

// Import types only - avoid importing actual functions to prevent bundling issues
import type { 
  Auth,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';

// Export wrapped functions that handle both mock and real Firebase
export const authService = {
  // Sign in with Google
  async signInWithGoogle(auth: Auth): Promise<UserCredential> {
    console.log('authService.signInWithGoogle called');
    
    // Check if we're using mock implementation
    if (isMockImplementation()) {
      console.log('Using mock auth.signInWithPopup');
      const googleProvider = { providerId: 'google.com' }; // Mock provider
      return await (auth as any).signInWithPopup(googleProvider);
    }
    
    // Use real Firebase auth
    console.log('Using real Firebase signInWithPopup');
    
    // For web platform, use web-specific service to avoid bundling issues
    if (Platform.OS === 'web') {
      console.log('Using web-specific auth service');
      const { authServiceWeb } = await import('./authServiceWeb');
      return await authServiceWeb.signInWithGoogle(auth);
    }
    
    // For other platforms, use dynamic import
    const firebaseAuth = await import('firebase/auth');
    const moduleKeys = Object.keys(firebaseAuth);
    console.log('Firebase auth module loaded with keys:', moduleKeys.join(', '));
    
    // Check if we got the React Native version by mistake
    if (!moduleKeys.includes('signInWithPopup')) {
      console.error('ERROR: signInWithPopup not found in Firebase Auth module!');
      console.error('Available functions:', moduleKeys.filter(k => typeof firebaseAuth[k] === 'function').join(', '));
      throw new Error('signInWithPopup is not available - possibly loaded React Native version of Firebase Auth');
    }
    
    const { signInWithPopup, GoogleAuthProvider } = firebaseAuth;
    
    if (!signInWithPopup || typeof signInWithPopup !== 'function') {
      throw new Error('signInWithPopup is not a function');
    }
    
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Sign in successful');
      return result;
    } catch (error) {
      console.error('signInWithGoogle error:', error);
      throw error;
    }
  },

  // Sign in anonymously
  async signInAnonymously(auth: Auth): Promise<UserCredential> {
    console.log('authService.signInAnonymously called');
    
    // Check if we're using mock implementation
    if (isMockImplementation()) {
      console.log('Using mock auth.signInAnonymously');
      return await (auth as any).signInAnonymously();
    }
    
    // Use real Firebase auth
    console.log('Using real Firebase signInAnonymously');
    
    // For web platform, use web-specific service
    if (Platform.OS === 'web') {
      console.log('Using web-specific auth service');
      const { authServiceWeb } = await import('./authServiceWeb');
      return await authServiceWeb.signInAnonymously(auth);
    }
    
    // For other platforms, use dynamic import
    const { signInAnonymously } = await import('firebase/auth');
    return await signInAnonymously(auth);
  },

  // Sign out
  async signOut(auth: Auth): Promise<void> {
    console.log('authService.signOut called');
    
    // Check if we're using mock implementation
    if (isMockImplementation()) {
      console.log('Using mock auth.signOut');
      return await (auth as any).signOut();
    }
    
    // Use real Firebase auth
    console.log('Using real Firebase signOut');
    
    // For web platform, use web-specific service
    if (Platform.OS === 'web') {
      console.log('Using web-specific auth service');
      const { authServiceWeb } = await import('./authServiceWeb');
      return await authServiceWeb.signOut(auth);
    }
    
    // For other platforms, use dynamic import
    const { signOut } = await import('firebase/auth');
    return await signOut(auth);
  },

  // Auth state listener
  onAuthStateChanged(auth: Auth, callback: (user: FirebaseUser | null) => void) {
    console.log('authService.onAuthStateChanged called');
    
    // Check if we're using mock implementation
    if (isMockImplementation()) {
      console.log('Using mock auth.onAuthStateChanged');
      return (auth as any).onAuthStateChanged(callback);
    }
    
    // Use real Firebase auth
    console.log('Using real Firebase onAuthStateChanged');
    
    // For web platform, use web-specific service
    if (Platform.OS === 'web') {
      console.log('Using web-specific auth service');
      // Import synchronously for web
      const { authServiceWeb } = require('./authServiceWeb');
      return authServiceWeb.onAuthStateChanged(auth, callback);
    }
    
    // For other platforms, use require
    const { onAuthStateChanged } = require('firebase/auth');
    return onAuthStateChanged(auth, callback);
  },

  // Create GoogleAuthProvider instance
  async createGoogleAuthProvider() {
    const { GoogleAuthProvider } = await import('firebase/auth');
    return new GoogleAuthProvider();
  }
};

// Also export individual functions for convenience
export const { signInWithGoogle, signInAnonymously, signOut, onAuthStateChanged } = authService;