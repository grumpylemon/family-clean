#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing New Architecture compatibility issues for iOS builds...\n');

// Function to create null spec files
function createNullSpec(filePath) {
  const content = 'export default null;\n';
  
  try {
    // Create backup
    const backupPath = filePath + '.original';
    if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Write null export
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find and fix spec files in a package
function fixPackageSpecs(packageName, specPaths) {
  const packagePath = path.join(__dirname, '..', 'node_modules', packageName);
  
  if (!fs.existsSync(packagePath)) {
    console.log(`⚠️  Package ${packageName} not found, skipping...`);
    return;
  }
  
  console.log(`📦 Fixing ${packageName}...`);
  
  let fixed = 0;
  specPaths.forEach(specPath => {
    const fullPath = path.join(packagePath, specPath);
    if (fs.existsSync(fullPath)) {
      if (createNullSpec(fullPath)) {
        fixed++;
      }
    }
  });
  
  console.log(`  ✅ Fixed ${fixed}/${specPaths.length} spec files\n`);
}

// 1. Fix react-native-safe-area-context
fixPackageSpecs('react-native-safe-area-context', [
  'lib/module/specs/NativeSafeAreaContext.js',
  'lib/module/specs/NativeSafeAreaProvider.js',
  'lib/module/specs/NativeSafeAreaView.js',
  'lib/commonjs/specs/NativeSafeAreaContext.js',
  'lib/commonjs/specs/NativeSafeAreaProvider.js',
  'lib/commonjs/specs/NativeSafeAreaView.js'
]);

// 2. Fix react-native-svg (if it has fabric components)
const svgFabricPath = path.join(__dirname, '..', 'node_modules', 'react-native-svg', 'lib', 'module', 'fabric');
if (fs.existsSync(svgFabricPath)) {
  console.log('📦 Fixing react-native-svg fabric components...');
  
  const svgFiles = fs.readdirSync(svgFabricPath)
    .filter(file => file.endsWith('NativeComponent.js'));
    
  svgFiles.forEach(file => {
    const filePath = path.join(svgFabricPath, file);
    createNullSpec(filePath);
  });
  
  console.log(`  ✅ Fixed ${svgFiles.length} fabric components\n`);
}

// 3. Fix react-native-screens (if present)
const screensFabricPath = path.join(__dirname, '..', 'node_modules', 'react-native-screens', 'lib', 'module', 'fabric');
if (fs.existsSync(screensFabricPath)) {
  console.log('📦 Fixing react-native-screens fabric components...');
  
  const screensFiles = fs.readdirSync(screensFabricPath)
    .filter(file => file.endsWith('NativeComponent.js'));
    
  screensFiles.forEach(file => {
    const filePath = path.join(screensFabricPath, file);
    createNullSpec(filePath);
  });
  
  // Also fix commonjs versions
  const screensCommonJsPath = path.join(__dirname, '..', 'node_modules', 'react-native-screens', 'lib', 'commonjs', 'fabric');
  if (fs.existsSync(screensCommonJsPath)) {
    const commonJsFiles = fs.readdirSync(screensCommonJsPath)
      .filter(file => file.endsWith('NativeComponent.js'));
      
    commonJsFiles.forEach(file => {
      const filePath = path.join(screensCommonJsPath, file);
      createNullSpec(filePath);
    });
  }
  
  console.log(`  ✅ Fixed all fabric components\n`);
}

// 4. Fix react-native-gesture-handler (if it has spec files)
fixPackageSpecs('react-native-gesture-handler', [
  'lib/module/specs/NativeRNGestureHandlerModule.js',
  'lib/commonjs/specs/NativeRNGestureHandlerModule.js'
]);

// 5. Add to package.json postinstall if not already there
console.log('📝 Updating package.json postinstall script...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const fixScript = 'node scripts/fix-new-architecture-ios.js';
if (!packageJson.scripts.postinstall.includes(fixScript)) {
  packageJson.scripts.postinstall = packageJson.scripts.postinstall 
    ? `${packageJson.scripts.postinstall} && ${fixScript}`
    : fixScript;
    
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('  ✅ Added fix script to postinstall\n');
} else {
  console.log('  ℹ️  Fix script already in postinstall\n');
}

// 6. Clear Metro cache
console.log('🧹 Clearing Metro cache...');
try {
  execSync('npx react-native start --reset-cache --max-workers 1', { 
    stdio: 'pipe',
    timeout: 5000 
  });
} catch (error) {
  // Expected to timeout, we just want to clear cache
}

console.log('\n✨ New Architecture compatibility fixes applied!');
console.log('\n📌 Next steps:');
console.log('  1. Run: npm run build-ios');
console.log('  2. The iOS build should now succeed on EAS');
console.log('\n⚠️  Note: These fixes are temporary until libraries fully support the New Architecture.');