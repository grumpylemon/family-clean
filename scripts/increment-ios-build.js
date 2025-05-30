#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the app.json file
const appJsonPath = path.join(__dirname, '..', 'app.json');

// Read the current app.json
const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
const appJson = JSON.parse(appJsonContent);

// Get current build number
const currentBuildNumber = parseInt(appJson.expo.ios.buildNumber || '0');
const newBuildNumber = currentBuildNumber + 1;

// Update the build number
appJson.expo.ios.buildNumber = newBuildNumber.toString();

// Write the updated app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ iOS build number updated: ${currentBuildNumber} → ${newBuildNumber}`);

// Run pre-build validation before sending to EAS
console.log('\n🔍 Running pre-build validation...\n');
try {
  execSync('node scripts/pre-eas-build-check.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('\n❌ Pre-build validation failed!');
  console.error('Fix the issues above before building to save time and money.');
  
  // Revert the build number since we're not proceeding
  appJson.expo.ios.buildNumber = currentBuildNumber.toString();
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log(`\n↩️  Reverted build number back to ${currentBuildNumber}`);
  
  process.exit(1);
}

// If a command was passed as argument, run it
if (process.argv[2]) {
  const command = process.argv.slice(2).join(' ');
  console.log(`\n📱 Running: ${command}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to run command: ${error.message}`);
    process.exit(1);
  }
}