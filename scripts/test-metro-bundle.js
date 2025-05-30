#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

console.log('🧪 Testing Metro bundler directly...\n');

// Create test entry file
const testEntry = `
import { registerRootComponent } from 'expo';
import App from './app/_layout';
registerRootComponent(App);
`;

const entryPath = path.join(__dirname, '../test-entry.js');
fs.writeFileSync(entryPath, testEntry);

console.log('Running Metro bundle command...\n');

try {
  execSync(
    `cd ${path.dirname(entryPath)} && npx react-native bundle \
      --entry-file test-entry.js \
      --platform ios \
      --dev false \
      --bundle-output /tmp/test.jsbundle \
      --assets-dest /tmp \
      --reset-cache \
      --verbose`,
    { stdio: 'inherit' }
  );
  
  console.log('\n✅ Metro bundler succeeded!');
  
  // Check bundle size
  const stats = fs.statSync('/tmp/test.jsbundle');
  console.log(`Bundle size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Clean up
  fs.unlinkSync('/tmp/test.jsbundle');
} catch (error) {
  console.error('\n❌ Metro bundler failed!');
  console.error('This is the error that will cause your EAS build to fail.');
} finally {
  // Clean up entry file
  fs.unlinkSync(entryPath);
}