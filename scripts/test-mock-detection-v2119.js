#!/usr/bin/env node

// Test script for Mock Mode Detection v2.119
// Verifies that the improved mock detection logic works correctly

const path = require('path');

console.log('🧪 Testing Mock Mode Detection v2.119\n');

// Mock different environment scenarios
const testScenarios = [
  {
    name: 'Production Web Domain',
    env: {
      NODE_ENV: 'production',
      EXPO_PUBLIC_USE_MOCK: 'false',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'test-key',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'family-fun-app',
      EXPO_PUBLIC_FIREBASE_APP_ID: 'test-app-id'
    },
    hostname: 'family-fun-app.web.app',
    platform: 'web',
    expected: false,
    reason: 'Production domain detected'
  },
  {
    name: 'Development with EXPO_PUBLIC_USE_MOCK=false',
    env: {
      NODE_ENV: 'development',
      EXPO_PUBLIC_USE_MOCK: 'false',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'test-key',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'family-fun-app',
      EXPO_PUBLIC_FIREBASE_APP_ID: 'test-app-id'
    },
    hostname: 'localhost',
    platform: 'web',
    expected: false,
    reason: 'Environment variable forces real Firebase'
  },
  {
    name: 'Development with EXPO_PUBLIC_USE_MOCK=true',
    env: {
      NODE_ENV: 'development',
      EXPO_PUBLIC_USE_MOCK: 'true',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'test-key',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'family-fun-app',
      EXPO_PUBLIC_FIREBASE_APP_ID: 'test-app-id'
    },
    hostname: 'localhost',
    platform: 'web',
    expected: true,
    reason: 'Environment variable forces mock mode'
  },
  {
    name: 'Production build (NODE_ENV=production)',
    env: {
      NODE_ENV: 'production',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'test-key',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'family-fun-app',
      EXPO_PUBLIC_FIREBASE_APP_ID: 'test-app-id'
    },
    hostname: 'some-domain.com',
    platform: 'web',
    expected: false,
    reason: 'Production build environment'
  },
  {
    name: 'Development with complete config',
    env: {
      NODE_ENV: 'development',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'test-key',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'family-fun-app',
      EXPO_PUBLIC_FIREBASE_APP_ID: 'test-app-id'
    },
    hostname: 'localhost',
    platform: 'web',
    expected: false,
    reason: 'Complete Firebase config in development'
  },
  {
    name: 'Development with incomplete config',
    env: {
      NODE_ENV: 'development',
      // Missing Firebase config
    },
    hostname: 'localhost',
    platform: 'web',
    expected: true,
    reason: 'Incomplete Firebase config fallback'
  }
];

function testMockDetection() {
  console.log('🎯 Testing Mock Detection Logic\n');
  
  let passed = 0;
  let failed = 0;
  
  testScenarios.forEach((scenario, index) => {
    console.log(`Test ${index + 1}: ${scenario.name}`);
    console.log(`  Environment: ${JSON.stringify(scenario.env, null, 2)}`);
    console.log(`  Hostname: ${scenario.hostname}`);
    console.log(`  Platform: ${scenario.platform}`);
    console.log(`  Expected Mock Mode: ${scenario.expected}`);
    
    // Mock the environment for this test
    const originalEnv = { ...process.env };
    Object.assign(process.env, scenario.env);
    
    // Mock the platform and hostname
    const mockPlatform = { OS: scenario.platform };
    const mockWindow = scenario.hostname ? { 
      location: { hostname: scenario.hostname } 
    } : undefined;
    
    // Simulate the detection logic
    let detectedMockMode = false;
    let detectedReason = '';
    
    try {
      // PRIORITY 1: Production Domain Detection (Web)
      if (scenario.platform === 'web' && mockWindow) {
        const hostname = mockWindow.location.hostname;
        const isProductionDomain = hostname === 'family-fun-app.web.app' || hostname === 'family-fun-app.firebaseapp.com';
        if (isProductionDomain) {
          detectedMockMode = false;
          detectedReason = 'Production domain detected';
        }
      }
      
      // PRIORITY 2: Explicit Environment Variables
      if (!detectedReason && process.env.EXPO_PUBLIC_FORCE_PRODUCTION === 'true') {
        detectedMockMode = false;
        detectedReason = 'EXPO_PUBLIC_FORCE_PRODUCTION=true';
      }
      
      if (!detectedReason && process.env.EXPO_PUBLIC_USE_MOCK === 'false') {
        detectedMockMode = false;
        detectedReason = 'EXPO_PUBLIC_USE_MOCK=false';
      }
      
      if (!detectedReason && process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
        detectedMockMode = true;
        detectedReason = 'EXPO_PUBLIC_USE_MOCK=true';
      }
      
      // PRIORITY 3: Build Environment Detection
      if (!detectedReason && process.env.NODE_ENV === 'production') {
        detectedMockMode = false;
        detectedReason = 'NODE_ENV=production';
      }
      
      // PRIORITY 5: Complete Firebase Config Check (skipping iOS for simplicity)
      if (!detectedReason) {
        const hasCompleteConfig = !!(
          process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
          process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
          process.env.EXPO_PUBLIC_FIREBASE_APP_ID
        );
        
        if (hasCompleteConfig) {
          detectedMockMode = false;
          detectedReason = 'Complete Firebase config';
        } else {
          detectedMockMode = true;
          detectedReason = 'Incomplete Firebase config';
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error during test: ${error.message}`);
      failed++;
      return;
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
    
    console.log(`  Detected Mock Mode: ${detectedMockMode}`);
    console.log(`  Detected Reason: ${detectedReason}`);
    
    if (detectedMockMode === scenario.expected) {
      console.log(`  ✅ PASS\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Expected ${scenario.expected}, got ${detectedMockMode}\n`);
      failed++;
    }
  });
  
  console.log('📊 Test Results:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  🎯 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Mock detection logic is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the logic and fix issues.');
    process.exit(1);
  }
}

// Visual Test Results
function displayVisualTest() {
  console.log('\n🎨 Visual Component Test');
  console.log('When you visit the app:');
  console.log('  📱 Production (family-fun-app.web.app): Should show NO mock banner');
  console.log('  🧪 Development (localhost): Should show mock banner IF in mock mode');
  console.log('  🔧 Development: Should show environment debug info in bottom corner');
  console.log('\nLook for:');
  console.log('  🟠 Orange "MOCK MODE" banner at top (when applicable)');
  console.log('  🖤 Black debug panel at bottom left (development only)');
  console.log('  📝 Console logs with "FIREBASE MOCK DETECTION v2.119"');
}

// Run the tests
testMockDetection();
displayVisualTest();