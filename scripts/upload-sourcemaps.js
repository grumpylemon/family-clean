#!/usr/bin/env node

/**
 * Upload source maps to Sentry for better error debugging
 * Run after building for production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get version from constants
const versionPath = path.join(__dirname, '..', 'constants', 'Version.ts');
const versionContent = fs.readFileSync(versionPath, 'utf8');
const versionMatch = versionContent.match(/export const CURRENT_VERSION = '(.+)'/);
const version = versionMatch ? versionMatch[1] : 'unknown';

console.log(`Uploading source maps for version: ${version}`);

// Check if Sentry CLI is configured
const sentryCliPath = path.join(__dirname, '..', '.sentryclirc');
if (!fs.existsSync(sentryCliPath)) {
  console.error('Error: .sentryclirc file not found');
  console.error('Please create .sentryclirc with:');
  console.error('[defaults]');
  console.error('org=your-org');
  console.error('project=your-project');
  console.error('');
  console.error('[auth]');
  console.error('token=your-auth-token');
  process.exit(1);
}

// Platform-specific source map locations
const platforms = {
  web: {
    distPath: path.join(__dirname, '..', 'dist'),
    urlPrefix: '~/',
    command: (release) => `sentry-cli releases files ${release} upload-sourcemaps ${path.join(__dirname, '..', 'dist')} --url-prefix ~/`
  },
  ios: {
    distPath: path.join(__dirname, '..', 'ios', 'build'),
    urlPrefix: 'app:///',
    command: (release) => `sentry-cli releases files ${release} upload-sourcemaps ${path.join(__dirname, '..', 'ios', 'build')} --url-prefix app:///`
  },
  android: {
    distPath: path.join(__dirname, '..', 'android', 'app', 'build'),
    urlPrefix: 'app:///',
    command: (release) => `sentry-cli releases files ${release} upload-sourcemaps ${path.join(__dirname, '..', 'android', 'app', 'build')} --url-prefix app:///`
  }
};

// Get platform from command line argument
const platform = process.argv[2] || 'web';
const platformConfig = platforms[platform];

if (!platformConfig) {
  console.error(`Unknown platform: ${platform}`);
  console.error('Usage: node upload-sourcemaps.js [web|ios|android]');
  process.exit(1);
}

// Check if dist directory exists
if (!fs.existsSync(platformConfig.distPath)) {
  console.error(`Build directory not found: ${platformConfig.distPath}`);
  console.error(`Please build the ${platform} app first`);
  process.exit(1);
}

// Create release
const release = `family-compass@${version}+${platform}`;
console.log(`Creating release: ${release}`);

try {
  // Create release
  execSync(`sentry-cli releases new ${release}`, { stdio: 'inherit' });
  
  // Upload source maps
  console.log(`Uploading source maps for ${platform}...`);
  execSync(platformConfig.command(release), { stdio: 'inherit' });
  
  // Finalize release
  console.log('Finalizing release...');
  execSync(`sentry-cli releases finalize ${release}`, { stdio: 'inherit' });
  
  // Set release as deployed (optional)
  console.log('Marking release as deployed...');
  execSync(`sentry-cli releases deploys ${release} new -e production`, { stdio: 'inherit' });
  
  console.log(`✅ Source maps uploaded successfully for ${platform}`);
} catch (error) {
  console.error('Failed to upload source maps:', error.message);
  process.exit(1);
}