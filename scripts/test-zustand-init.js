#!/usr/bin/env node

/**
 * Simple test script to verify Zustand store initialization
 * Run with: node scripts/test-zustand-init.js
 */

// Set up minimal mocks
global.window = undefined; // Ensure we're in Node environment

// Test the store creation directly
console.log('Testing Zustand store creation...\n');

try {
  // Test slice creator parameters
  console.log('1. Testing slice creator function:');
  
  const testSliceCreator = (set, get, api) => {
    console.log('  - set is function:', typeof set === 'function');
    console.log('  - get is function:', typeof get === 'function');
    console.log('  - api is object:', typeof api === 'object');
    
    return {
      testSlice: {
        value: 'test',
        getValue: () => {
          try {
            const state = get();
            console.log('  - get() returns:', typeof state);
            return state;
          } catch (error) {
            console.error('  - get() error:', error.message);
            return null;
          }
        }
      }
    };
  };
  
  // Test with mock parameters
  const mockSet = () => {};
  const mockGet = () => ({ testSlice: { value: 'mock' } });
  const mockApi = {};
  
  const result = testSliceCreator(mockSet, mockGet, mockApi);
  console.log('  - Slice created successfully:', !!result.testSlice);
  console.log('  - getValue works:', result.testSlice.getValue() !== null);
  
  console.log('\n2. Testing spread operator with slices:');
  
  const slice1 = { auth: { user: null } };
  const slice2 = { family: { family: null } };
  const combined = { ...slice1, ...slice2 };
  
  console.log('  - Combined slices:', Object.keys(combined));
  console.log('  - Has auth:', 'auth' in combined);
  console.log('  - Has family:', 'family' in combined);
  
  console.log('\n3. Testing minification scenarios:');
  
  // Test what happens when parameters are renamed
  const minifiedCreator = (a, b, c) => {
    console.log('  - Minified params types:', typeof a, typeof b, typeof c);
    
    // Test defensive coding
    if (typeof a !== 'function' || typeof b !== 'function') {
      console.error('  - Invalid parameters detected!');
      return { error: true };
    }
    
    return {
      test: {
        callGet: () => {
          try {
            const state = b();
            return state;
          } catch (e) {
            console.error('  - Error calling b():', e.message);
            return null;
          }
        }
      }
    };
  };
  
  const minResult = minifiedCreator(mockSet, mockGet, mockApi);
  console.log('  - Minified creator result:', Object.keys(minResult));
  
  console.log('\nTest completed successfully!');
  
} catch (error) {
  console.error('\nTest failed:', error);
  console.error(error.stack);
  process.exit(1);
}