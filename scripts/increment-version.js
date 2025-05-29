#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the Version.ts file
const versionFilePath = path.join(__dirname, '..', 'constants', 'Version.ts');

// Function to increment version
function incrementVersion(currentVersion) {
  // Extract the numeric part from version string (e.g., 'v2.11' -> 2.11)
  const match = currentVersion.match(/v(\d+)\.(\d+)/);
  if (!match) {
    throw new Error('Invalid version format. Expected format: vX.Y');
  }
  
  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);
  
  // Increment minor version by 0.1 (which is +1 in integer form)
  const newMinor = minor + 1;
  
  return `v${major}.${newMinor}`;
}

// Function to get current git hash (first 7 characters)
function getGitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.warn('Could not get git hash, using default');
    return 'unknown';
  }
}

// Read the current version file
const versionContent = fs.readFileSync(versionFilePath, 'utf8');

// Extract current version
const versionMatch = versionContent.match(/export const APP_VERSION = '(v\d+\.\d+)'/);
if (!versionMatch) {
  console.error('Could not find APP_VERSION in Version.ts');
  process.exit(1);
}

const currentVersion = versionMatch[1];
const newVersion = incrementVersion(currentVersion);
const gitHash = getGitHash();

// Update the version file
const updatedContent = versionContent
  .replace(/export const APP_VERSION = 'v\d+\.\d+'/, `export const APP_VERSION = '${newVersion}'`)
  .replace(/export const BUILD_HASH = '[^']+'/, `export const BUILD_HASH = '${gitHash}'`);

// Write the updated content
fs.writeFileSync(versionFilePath, updatedContent);

console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);
console.log(`✅ Build hash updated: ${gitHash}`);

// Now run the actual expo export command
console.log('\n📦 Running expo export...\n');
try {
  execSync('npx expo export --platform web', { stdio: 'inherit' });
  
  // After successful export, deploy to Firebase
  console.log('\n🚀 Deploying to Firebase Hosting...\n');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  
  console.log('\n✅ Successfully deployed to Firebase Hosting!');
  console.log('🌐 Live at: https://family-fun-app.web.app');
} catch (error) {
  console.error('Failed to complete deployment:', error.message);
  process.exit(1);
}