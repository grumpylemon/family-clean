#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting comprehensive iOS build test...\n');

let hasErrors = false;
const errors = [];

// Helper function to run command and capture output
function runCommand(command, options = {}) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

// Helper to check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// 1. Check prerequisites
console.log('📋 Checking prerequisites...');

const prerequisites = [
  { command: 'node', minVersion: '16.0.0' },
  { command: 'npm', minVersion: '8.0.0' },
  { command: 'expo', minVersion: '6.0.0' },
  { command: 'eas', minVersion: '0.0.0' }
];

for (const prereq of prerequisites) {
  if (!commandExists(prereq.command)) {
    errors.push(`❌ ${prereq.command} is not installed`);
    hasErrors = true;
  } else {
    const versionResult = runCommand(`${prereq.command} --version`, { silent: true });
    if (versionResult.success) {
      console.log(`✅ ${prereq.command}: ${versionResult.output.trim()}`);
    }
  }
}

// 2. Check package versions
console.log('\n📦 Checking package versions...');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Check for version mismatches reported by expo doctor
const versionChecks = [
  { 
    package: 'react-native-svg', 
    expected: '15.11.2', 
    actual: packageJson.dependencies['react-native-svg']
  }
];

for (const check of versionChecks) {
  if (check.actual !== check.expected) {
    console.log(`⚠️  ${check.package}: ${check.actual} (expected ${check.expected})`);
  }
}

// 3. Validate babel configuration
console.log('\n🔧 Validating babel configuration...');

const babelConfig = fs.readFileSync(path.join(__dirname, '../babel.config.js'), 'utf8');
if (babelConfig.includes('@react-native/babel-plugin-codegen')) {
  console.log('⚠️  babel-plugin-codegen detected - this may cause build issues');
}

// 4. Test Metro bundler for iOS
console.log('\n📱 Testing Metro bundler for iOS production build...');

// Create a test entry file to check bundling
const testEntry = `
import { AppRegistry } from 'react-native';
import App from '../app/_layout';
AppRegistry.registerComponent('main', () => App);
`;

fs.writeFileSync(path.join(__dirname, 'test-bundle-entry.js'), testEntry);

console.log('Starting Metro bundler test (this may take a minute)...');

// Run Metro bundler with production settings
const bundleResult = runCommand(
  `npx react-native bundle \
    --entry-file scripts/test-bundle-entry.js \
    --platform ios \
    --dev false \
    --bundle-output /tmp/test-bundle.jsbundle \
    --assets-dest /tmp`,
  { silent: true }
);

// Clean up test file
fs.unlinkSync(path.join(__dirname, 'test-bundle-entry.js'));

if (!bundleResult.success) {
  hasErrors = true;
  errors.push('❌ Metro bundler failed to create production bundle');
  
  // Parse the error to find specific issues
  if (bundleResult.error.includes('Cannot read properties of null')) {
    errors.push('❌ Babel codegen error detected - this is the same error you\'ll get on EAS');
    errors.push('   Fix: Update babel.config.js to handle codegen properly');
  }
  
  console.log('Metro bundler error:', bundleResult.error);
} else {
  console.log('✅ Metro bundler successfully created production bundle');
}

// 5. Run expo export:embed simulation
console.log('\n📦 Testing expo export:embed (simulating EAS build)...');

const exportResult = runCommand(
  'EXPO_PUBLIC_USE_MOCK=false npx expo export:embed --platform ios --dev false --output /tmp/expo-embed-test',
  { silent: true }
);

if (!exportResult.success) {
  hasErrors = true;
  errors.push('❌ Expo export:embed failed - this simulates EAS build bundling');
  
  if (exportResult.error.includes('Cannot read properties of null')) {
    errors.push('   This is the exact error you\'re seeing on EAS');
  }
} else {
  console.log('✅ Expo export:embed succeeded');
}

// 6. Check for common iOS build issues
console.log('\n🔍 Checking for common iOS build issues...');

// Check expo config
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
const iosConfig = appJson.expo?.ios || {};

if (!iosConfig.bundleIdentifier) {
  errors.push('❌ Missing iOS bundle identifier in app.json');
}

if (!iosConfig.buildNumber) {
  errors.push('⚠️  Missing iOS build number in app.json');
}

// 7. Validate EAS configuration
console.log('\n⚙️  Validating EAS configuration...');

if (fs.existsSync(path.join(__dirname, '../eas.json'))) {
  const easJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../eas.json'), 'utf8'));
  console.log('✅ eas.json found');
  
  if (easJson.build?.production?.ios?.image) {
    console.log(`   Build image: ${easJson.build.production.ios.image}`);
  }
} else {
  errors.push('⚠️  eas.json not found');
}

// 8. Check node_modules integrity
console.log('\n📚 Checking node_modules integrity...');

const nodeModulesCheck = runCommand('npm ls --depth=0', { silent: true });
if (!nodeModulesCheck.success) {
  errors.push('⚠️  npm ls shows dependency issues - run npm install');
}

// 9. Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
console.log('='.repeat(60));

if (hasErrors) {
  console.log('\n❌ Build will likely fail on EAS\n');
  console.log('Issues found:');
  errors.forEach(error => console.log(`  ${error}`));
  
  console.log('\n💡 Recommended fixes:');
  console.log('  1. Fix the babel configuration to handle @react-native/babel-plugin-codegen');
  console.log('  2. Update react-native-svg to the expected version');
  console.log('  3. Ensure all dependencies are properly installed');
  
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Build should succeed on EAS.\n');
  process.exit(0);
}