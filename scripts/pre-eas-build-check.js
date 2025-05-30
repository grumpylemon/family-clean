#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

console.log('🚀 Pre-EAS Build Validation\n');
console.log('This script validates your project before sending to EAS Build.');
console.log('It will save you time and money by catching issues locally.\n');

let allPassed = true;
const issues = [];
const warnings = [];

// Helper functions
function runCommand(command, options = {}) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

function checkStep(name, fn) {
  process.stdout.write(`⏳ ${name}... `);
  try {
    const result = fn();
    if (result === true) {
      console.log('✅');
    } else if (result === 'warning') {
      console.log('⚠️');
    } else {
      console.log('❌');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌');
    issues.push(`${name}: ${error.message}`);
    allPassed = false;
  }
}

// 1. Check if all dependencies are installed
checkStep('Checking node_modules', () => {
  const nodeModulesExists = fs.existsSync(path.join(__dirname, '../node_modules'));
  if (!nodeModulesExists) {
    issues.push('node_modules not found - run npm install');
    return false;
  }
  
  // Check for dependency issues
  const npmLs = runCommand('npm ls --depth=0', { silent: true });
  if (!npmLs.success && npmLs.stderr.includes('missing')) {
    warnings.push('Some dependencies may be missing - run npm install');
    return 'warning';
  }
  
  return true;
});

// 2. Run expo doctor
checkStep('Running expo doctor', () => {
  const doctorResult = runCommand('npx expo doctor', { silent: true });
  if (!doctorResult.success) {
    // Parse the output for specific issues
    const output = doctorResult.output + doctorResult.stderr;
    
    if (output.includes('react-native-svg')) {
      warnings.push('Package version mismatch detected - run npx expo install --check');
    }
    
    if (output.includes('Failed')) {
      issues.push('Expo doctor found critical issues');
      return false;
    }
    
    return 'warning';
  }
  return true;
});

// 3. Test Metro bundler
checkStep('Testing Metro bundler', () => {
  console.log('\n  📦 Creating test bundle (this may take 30-60 seconds)...');
  
  // Create a minimal test entry
  const testEntry = `
import { registerRootComponent } from 'expo';
import App from '../app/_layout';
registerRootComponent(App);
`;
  
  const testPath = path.join(__dirname, 'test-entry.js');
  fs.writeFileSync(testPath, testEntry);
  
  try {
    const bundleResult = runCommand(
      `npx react-native bundle \
        --entry-file ${testPath} \
        --platform ios \
        --dev false \
        --bundle-output /tmp/test.jsbundle \
        --assets-dest /tmp \
        --reset-cache`,
      { silent: true }
    );
    
    fs.unlinkSync(testPath);
    
    if (!bundleResult.success) {
      const error = bundleResult.error + bundleResult.stderr;
      
      if (error.includes('Cannot read properties of null')) {
        issues.push('Babel plugin error - check babel.config.js');
        issues.push('This is the error that will fail your EAS build!');
        return false;
      }
      
      if (error.includes('Module not found')) {
        issues.push('Missing module in bundle - check imports');
        return false;
      }
      
      issues.push('Metro bundler failed - see error above');
      return false;
    }
    
    // Check if bundle was created
    if (!fs.existsSync('/tmp/test.jsbundle')) {
      issues.push('Bundle file not created');
      return false;
    }
    
    // Check bundle size
    const stats = fs.statSync('/tmp/test.jsbundle');
    const sizeMB = stats.size / 1024 / 1024;
    console.log(`  ✅ Bundle size: ${sizeMB.toFixed(2)} MB`);
    
    // Clean up
    try {
      fs.unlinkSync('/tmp/test.jsbundle');
    } catch {}
    
    return true;
  } catch (error) {
    fs.unlinkSync(testPath);
    throw error;
  }
});

// 4. Check iOS configuration
checkStep('Checking iOS configuration', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
  const iosConfig = appJson.expo?.ios || {};
  
  if (!iosConfig.bundleIdentifier) {
    issues.push('Missing ios.bundleIdentifier in app.json');
    return false;
  }
  
  if (!iosConfig.buildNumber) {
    warnings.push('Missing ios.buildNumber in app.json');
    return 'warning';
  }
  
  // Check for GoogleService-Info.plist
  const googleServicePaths = [
    path.join(__dirname, '../ios/GoogleService-Info.plist'),
    path.join(__dirname, '../GoogleService-Info.plist')
  ];
  
  const hasGoogleService = googleServicePaths.some(p => fs.existsSync(p));
  if (!hasGoogleService) {
    warnings.push('GoogleService-Info.plist not found - Firebase may not work');
    return 'warning';
  }
  
  return true;
});

// 5. Check EAS configuration
checkStep('Checking EAS configuration', () => {
  const easJsonPath = path.join(__dirname, '../eas.json');
  
  if (!fs.existsSync(easJsonPath)) {
    issues.push('eas.json not found - run eas build:configure');
    return false;
  }
  
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  
  if (!easJson.build?.production) {
    warnings.push('No production build profile in eas.json');
    return 'warning';
  }
  
  return true;
});

// 6. Check environment variables
checkStep('Checking environment variables', () => {
  const envVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingEnvVars = envVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length > 0) {
    warnings.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    warnings.push('Make sure these are set in EAS secrets or eas.json');
    return 'warning';
  }
  
  return true;
});

// 7. Test expo export:embed (simulates EAS build)
checkStep('Testing expo export:embed', () => {
  console.log('\n  🏗️  Simulating EAS build process...');
  
  // Create temporary directory for output
  const tmpDir = '/tmp/expo-embed-test-' + Date.now();
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {}
  
  const exportResult = runCommand(
    `npx expo export:embed --platform ios --dev false --bundle-output ${tmpDir}/main.jsbundle --assets-dest ${tmpDir} --reset-cache`,
    { silent: true }
  );
  
  if (!exportResult.success) {
    const error = exportResult.error + exportResult.stderr;
    
    if (error.includes('Cannot read properties of null')) {
      issues.push('Babel codegen error in expo export - THIS WILL FAIL ON EAS!');
      return false;
    }
    
    if (error.includes('Could not find component config')) {
      issues.push('New Architecture codegen error - run: node scripts/fix-new-architecture-ios.js');
      return false;
    }
    
    issues.push('Expo export:embed failed - check error above');
    console.log('\n  ❌ Error details:', error.split('\n').slice(0, 5).join('\n'));
    return false;
  }
  
  // Check if bundle was created
  if (!fs.existsSync(`${tmpDir}/main.jsbundle`)) {
    issues.push('Bundle file not created during export:embed');
    return false;
  }
  
  // Clean up
  try {
    execSync(`rm -rf ${tmpDir}`, { stdio: 'pipe' });
  } catch {}
  
  return true;
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Pre-Build Validation Summary');
console.log('='.repeat(60) + '\n');

if (allPassed && issues.length === 0) {
  console.log('✅ All checks passed! Your build should succeed on EAS.\n');
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings (non-critical):');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }
  
  console.log('🚀 Ready to build! Run: npm run build-ios');
  process.exit(0);
} else {
  console.log('❌ Build validation failed!\n');
  
  if (issues.length > 0) {
    console.log('🛑 Critical issues that WILL cause build failure:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }
  
  console.log('💡 Fix these issues before running EAS build to save time and money.');
  process.exit(1);
}