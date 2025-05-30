#!/usr/bin/env node

/**
 * Fix for iOS build error with react-native-safe-area-context
 * This script patches the safe area context module to work with React Native's codegen
 * 
 * Error: Could not find component config for native component
 * in node_modules/react-native-safe-area-context/lib/module/specs/NativeSafeAreaView.js
 */

const fs = require('fs');
const path = require('path');

const SAFE_AREA_SPEC_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-safe-area-context',
  'lib',
  'module',
  'specs',
  'NativeSafeAreaView.js'
);

const SAFE_AREA_SPEC_PATH_CJS = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-safe-area-context',
  'lib',
  'commonjs',
  'specs',
  'NativeSafeAreaView.js'
);

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already patched
    if (content.includes('// PATCHED FOR IOS BUILD')) {
      console.log(`✅ Already patched: ${filePath}`);
      return;
    }

    // Add a comment to bypass codegen processing
    const patchedContent = `// PATCHED FOR IOS BUILD - Skip codegen processing
// @codegen-skip
${content}`;

    fs.writeFileSync(filePath, patchedContent, 'utf8');
    console.log(`✅ Patched: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error patching ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing react-native-safe-area-context for iOS build...');

// Patch both module and commonjs versions
patchFile(SAFE_AREA_SPEC_PATH);
patchFile(SAFE_AREA_SPEC_PATH_CJS);

// Also create a dummy component config if needed
const componentConfigPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-safe-area-context',
  'RNCSafeAreaViewNativeComponent.js'
);

if (!fs.existsSync(componentConfigPath)) {
  const dummyConfig = `// Auto-generated component config for iOS build compatibility
import { requireNativeComponent } from 'react-native';

export default requireNativeComponent('RNCSafeAreaView');
`;
  
  try {
    fs.writeFileSync(componentConfigPath, dummyConfig, 'utf8');
    console.log(`✅ Created component config: ${componentConfigPath}`);
  } catch (error) {
    console.error('❌ Error creating component config:', error.message);
  }
}

console.log('✨ iOS build fix complete!');