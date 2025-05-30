#!/usr/bin/env node

/**
 * Fix Hardcoded Family ID Override Script
 * 
 * This script removes the hardcoded override logic that forces all operations
 * to use "demo-family-id" instead of the actual family IDs.
 * 
 * Run with: node scripts/fix-hardcoded-family-override.js
 */

const fs = require('fs').promises;
const path = require('path');

async function fixFirestoreService() {
  const filePath = path.join(__dirname, '..', 'services', 'firestore.ts');
  
  console.log('🔧 Reading firestore.ts...');
  let content = await fs.readFile(filePath, 'utf8');
  
  // Count replacements
  let replacements = 0;
  
  // 1. Comment out the DEFAULT_FAMILY_ID constant
  content = content.replace(
    /const DEFAULT_FAMILY_ID = 'demo-family-id';/g,
    "// const DEFAULT_FAMILY_ID = 'demo-family-id'; // DISABLED: No longer forcing demo family"
  );
  replacements++;
  
  // 2. Update getDefaultFamilyId to return null instead of forcing demo-family-id
  content = content.replace(
    /export const getDefaultFamilyId = \(_userId\?: string\) => {[\s\S]*?return DEFAULT_FAMILY_ID;[\s\S]*?};/g,
    `export const getDefaultFamilyId = (_userId?: string) => {
  // DISABLED: No longer forcing demo family ID
  // This function should not be used in production
  console.warn('getDefaultFamilyId called - this should not happen in production');
  return null;
};`
  );
  replacements++;
  
  // 3. Remove all lines that override familyId with getDefaultFamilyId
  // Pattern: const effectiveFamilyId = getDefaultFamilyId(...);
  content = content.replace(
    /const effectiveFamilyId = getDefaultFamilyId\([^)]*\);/g,
    '// const effectiveFamilyId = getDefaultFamilyId(...); // DISABLED: Use actual familyId'
  );
  
  // 4. Replace all uses of effectiveFamilyId with familyId
  content = content.replace(/effectiveFamilyId/g, 'familyId');
  
  // 5. Remove the override logic in createChore
  content = content.replace(
    /\/\/ ALWAYS use default family ID for consistency, regardless of what was passed in[\s\S]*?familyId: effectiveFamilyId,/g,
    'familyId: chore.familyId, // Use the actual family ID passed in'
  );
  
  // 6. Fix the console.log statements that reference effectiveFamilyId
  content = content.replace(
    /\${effectiveFamilyId}/g,
    '${familyId}'
  );
  
  // 7. Remove the override warning logs
  content = content.replace(
    /if \(chore\.familyId !== effectiveFamilyId\) {[\s\S]*?}/g,
    '// Override logic removed'
  );
  
  console.log('✏️  Writing updated firestore.ts...');
  await fs.writeFile(filePath, content, 'utf8');
  
  console.log(`✅ Fixed firestore.ts - removed hardcoded family ID overrides`);
  console.log('\n📋 Changes made:');
  console.log('   • Disabled DEFAULT_FAMILY_ID constant');
  console.log('   • Updated getDefaultFamilyId to return null with warning');
  console.log('   • Removed all effectiveFamilyId override logic');
  console.log('   • Functions now use the actual familyId passed to them');
  
  console.log('\n⚠️  IMPORTANT: After this fix:');
  console.log('   1. Clear all data: node scripts/clear-all-data.js');
  console.log('   2. Clear browser cache: localStorage.clear(); location.reload();');
  console.log('   3. Deploy the fix: npm run export-web');
}

// Run the fix
fixFirestoreService()
  .then(() => {
    console.log('\n✨ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });