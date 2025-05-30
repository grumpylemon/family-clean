#!/usr/bin/env node

/**
 * Test script to verify Zustand store initialization
 * Run with: node scripts/test-zustand-store.js
 */

// Mock React Native modules
global.Platform = { OS: 'ios' };

// Mock AsyncStorage
global.AsyncStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  getAllKeys: () => Promise.resolve([]),
  multiGet: () => Promise.resolve([]),
  multiSet: () => Promise.resolve(),
  multiRemove: () => Promise.resolve(),
  mergeItem: () => Promise.resolve(),
  flushGetRequests: () => Promise.resolve(),
};

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
  ToastAndroid: { show: jest.fn() },
}), { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: global.AsyncStorage,
}), { virtual: true });

// Run the test
async function testStore() {
  try {
    console.log('Testing Zustand store initialization...\n');
    
    // Import the store
    const { useFamilyStore } = require('../stores/familyStore');
    
    // Get the store state
    const store = useFamilyStore.getState();
    
    console.log('Store initialized successfully!');
    console.log('Available slices:', Object.keys(store));
    
    // Check auth slice
    if (store.auth) {
      console.log('\n✓ Auth slice found');
      console.log('  Methods:', Object.keys(store.auth).filter(k => typeof store.auth[k] === 'function'));
      console.log('  State:', {
        user: store.auth.user,
        isAuthenticated: store.auth.isAuthenticated,
        isLoading: store.auth.isLoading,
        error: store.auth.error
      });
    } else {
      console.error('\n✗ Auth slice missing!');
    }
    
    // Check family slice
    if (store.family) {
      console.log('\n✓ Family slice found');
      console.log('  Methods:', Object.keys(store.family).filter(k => typeof store.family[k] === 'function'));
      console.log('  State:', {
        family: store.family.family,
        members: store.family.members,
        isAdmin: store.family.isAdmin,
        currentMember: store.family.currentMember,
        isLoading: store.family.isLoading,
        error: store.family.error
      });
    } else {
      console.error('\n✗ Family slice missing!');
    }
    
    // Check offline slice
    if (store.offline) {
      console.log('\n✓ Offline slice found');
      console.log('  Methods:', Object.keys(store.offline).filter(k => typeof store.offline[k] === 'function'));
    } else {
      console.error('\n✗ Offline slice missing!');
    }
    
    // Test calling a function
    console.log('\nTesting function calls...');
    
    if (store.auth && typeof store.auth.signInWithGoogle === 'function') {
      console.log('✓ signInWithGoogle is a function');
    } else {
      console.error('✗ signInWithGoogle is not a function');
    }
    
    if (store.family && typeof store.family.fetchFamily === 'function') {
      console.log('✓ fetchFamily is a function');
    } else {
      console.error('✗ fetchFamily is not a function');
    }
    
    console.log('\nStore test completed!');
    
  } catch (error) {
    console.error('Error testing store:', error);
    process.exit(1);
  }
}

// Run the test
testStore();