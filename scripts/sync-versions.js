#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Syncs the app.json version with the version from constants/Version.ts
 * This ensures that iOS builds in TestFlight show the correct version number
 */

// Path to the files
const versionFilePath = path.join(__dirname, '..', 'constants', 'Version.ts');
const appJsonPath = path.join(__dirname, '..', 'app.json');

function syncVersions() {
  try {
    // Read the current version from Version.ts
    const versionContent = fs.readFileSync(versionFilePath, 'utf8');
    const versionMatch = versionContent.match(/export const APP_VERSION = '(v\d+\.\d+)'/);
    
    if (!versionMatch) {
      throw new Error('Could not find APP_VERSION in Version.ts');
    }
    
    const currentAppVersion = versionMatch[1];
    // Convert from 'v2.165' to '2.165' for app.json
    const cleanVersion = currentAppVersion.replace('v', '');
    
    // Read and parse app.json
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(appJsonContent);
    
    const oldVersion = appJson.expo.version;
    
    // Update the version in app.json
    appJson.expo.version = cleanVersion;
    
    // Write the updated app.json
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    
    console.log(`✅ Version synced: app.json updated from "${oldVersion}" to "${cleanVersion}"`);
    console.log(`📱 TestFlight will now show: Version ${cleanVersion} (build number)`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to sync versions:', error.message);
    return false;
  }
}

// Run the sync if this script is called directly
if (require.main === module) {
  syncVersions();
}

module.exports = { syncVersions };