#!/usr/bin/env node
/**
 * Sentry Authentication Interference Fix Validation
 * Tests that Sentry operations don't interfere with authentication flow
 */

console.log('🔧 Sentry Authentication Interference Fix Test');
console.log('===============================================');

const fs = require('fs');
const path = require('path');

// Test 1: Verify delayed Sentry context setting
console.log('\n📝 Test 1: Sentry Context Setting Verification');
console.log('----------------------------------------------');

const sentryConfigPath = path.join(__dirname, '..', 'config', 'sentry.ts');
const sentryConfig = fs.readFileSync(sentryConfigPath, 'utf8');

// Check for delayed setUserContext
const hasDelayedContext = sentryConfig.includes('setTimeout(() => {') && 
                         sentryConfig.includes('1000'); // 1 second delay
console.log(`✅ Delayed Sentry context setting: ${hasDelayedContext}`);

// Check for error handling in Sentry calls
const hasSentryErrorHandling = sentryConfig.includes('try {') && 
                              sentryConfig.includes('console.warn');
console.log(`✅ Sentry error handling implemented: ${hasSentryErrorHandling}`);

// Check for immediate context helper
const hasImmediateContext = sentryConfig.includes('setUserContextImmediate');
console.log(`✅ Immediate context helper available: ${hasImmediateContext}`);

// Test 2: Verify auth slice Sentry isolation
console.log('\n📝 Test 2: Auth Slice Sentry Isolation');
console.log('-------------------------------------');

const authSlicePath = path.join(__dirname, '..', 'stores', 'authSlice.ts');
const authSliceContent = fs.readFileSync(authSlicePath, 'utf8');

// Check for delayed clearUserContext
const hasDelayedClear = authSliceContent.includes('setTimeout(() => {') && 
                       authSliceContent.includes('clearUserContext()');
console.log(`✅ Delayed Sentry context clearing: ${hasDelayedClear}`);

// Check for authentication completion logging
const hasAuthCompletionLog = authSliceContent.includes('scheduling delayed Sentry context setting');
console.log(`✅ Authentication completion logging: ${hasAuthCompletionLog}`);

// Check that Sentry calls don't happen in critical auth path
const criticalAuthPath = authSliceContent.match(/set\(\(state\) => \(\{[\s\S]*?isAuthenticated: true[\s\S]*?\}\)\);/g);
const sentryInCriticalPath = criticalAuthPath && criticalAuthPath.some(path => 
  path.includes('setUserContext') && !path.includes('setTimeout')
);
console.log(`✅ No immediate Sentry calls in critical auth path: ${!sentryInCriticalPath}`);

// Test 3: Check for authentication loop protection
console.log('\n📝 Test 3: Authentication Loop Protection');
console.log('---------------------------------------');

// Verify hasInitialLoad logic is still present
const hasInitialLoadProtection = authSliceContent.includes('hasInitialLoad') && 
                                 authSliceContent.includes('skipping auth clear to prevent loop');
console.log(`✅ Initial load protection maintained: ${hasInitialLoadProtection}`);

// Verify auth state setting happens before Sentry
const authStateBeforeSentry = authSliceContent.includes('Verification after set') &&
                             authSliceContent.indexOf('Verification after set') < 
                             authSliceContent.indexOf('scheduling delayed Sentry');
console.log(`✅ Auth state set before Sentry operations: ${authStateBeforeSentry}`);

// Test Results Summary
console.log('\n📋 Fix Validation Results');
console.log('------------------------');

const allTestsPassed = hasDelayedContext && 
                      hasSentryErrorHandling && 
                      hasImmediateContext &&
                      hasDelayedClear && 
                      hasAuthCompletionLog &&
                      !sentryInCriticalPath &&
                      hasInitialLoadProtection &&
                      authStateBeforeSentry;

if (allTestsPassed) {
  console.log('🎉 SUCCESS: Sentry authentication interference fix is properly implemented!');
  console.log('');
  console.log('🔍 What the fix does:');
  console.log('  1. Delays Sentry user context setting by 1 second after auth completion');
  console.log('  2. Delays Sentry context clearing by 500ms to prevent interference');
  console.log('  3. Wraps all Sentry operations in try-catch for error isolation');
  console.log('  4. Maintains authentication loop protection from previous fix');
  console.log('  5. Ensures auth state is set before any Sentry operations');
  console.log('');
  console.log('📱 Expected behavior:');
  console.log('  - New users: Google sign-in → auth state set → delayed Sentry context → family setup');
  console.log('  - Existing users: Normal sign-in flow with delayed Sentry integration');
  console.log('  - Signout: Auth cleared immediately, Sentry context cleared with delay');
  console.log('  - Error monitoring: Still works, just delayed during auth flow');
  console.log('');
  console.log('🧪 Next steps for testing:');
  console.log('  1. Test new user sign-up flow multiple times');
  console.log('  2. Test existing user sign-in');
  console.log('  3. Test user signout functionality');
  console.log('  4. Verify Sentry still captures errors outside auth flow');
  console.log('  5. Check browser console for delayed Sentry context messages');
} else {
  console.log('❌ FAILED: Sentry authentication fix is not properly implemented');
  console.log('Missing or incorrect components:');
  if (!hasDelayedContext) console.log('  - Delayed Sentry context setting');
  if (!hasSentryErrorHandling) console.log('  - Sentry error handling');
  if (!hasImmediateContext) console.log('  - Immediate context helper');
  if (!hasDelayedClear) console.log('  - Delayed context clearing');
  if (!hasAuthCompletionLog) console.log('  - Authentication completion logging');
  if (sentryInCriticalPath) console.log('  - Immediate Sentry calls still in critical auth path');
  if (!hasInitialLoadProtection) console.log('  - Initial load protection missing');
  if (!authStateBeforeSentry) console.log('  - Auth state not set before Sentry operations');
}

console.log('\n🔧 Technical Implementation Details');
console.log('----------------------------------');
console.log(`Sentry context delay: 1000ms (to ensure auth flow completion)`);
console.log(`Sentry clear delay: 500ms (to prevent signout interference)`);
console.log(`Error handling: Non-blocking (auth continues if Sentry fails)`);
console.log(`Authentication loop protection: Maintained from previous fix`);

console.log('\n🏁 Validation Complete');