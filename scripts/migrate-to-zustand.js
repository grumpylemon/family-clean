#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to migrate
const filesToMigrate = [
  'app/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/chores.tsx',
  'app/(tabs)/rewards.tsx',
  'app/(tabs)/settings.tsx',
  'app/(tabs)/admin.tsx',
  'app/(tabs)/achievements.tsx',
  'components/AuthStatus.tsx',
  'components/ChoreManagement.tsx',
  'components/FamilySetup.tsx',
  'components/ManageMembers.tsx',
  'components/PointTransfer.tsx',
  'components/RoomManagement.tsx',
  'components/FamilySettings.tsx',
  'components/ZustandAdminPanel.tsx',
  'hooks/useAccessControl.ts',
  'services/collaborationService.ts',
  'services/firestore.ts',
  'services/gamification.ts',
  'services/petService.ts',
  'services/pointsService.ts',
  'services/roomService.ts',
];

// Migration patterns
const patterns = [
  {
    // Pattern 1: Both imports on separate lines
    from: /import\s*{\s*useAuth\s*}\s*from\s*['"]@\/contexts\/AuthContext['"]\s*;\s*\n\s*import\s*{\s*useFamily\s*}\s*from\s*['"]@\/contexts\/FamilyContext['"]\s*;/g,
    to: "import { useAuth, useFamily } from '@/hooks/useZustandHooks';"
  },
  {
    // Pattern 2: Only useAuth import
    from: /import\s*{\s*useAuth\s*}\s*from\s*['"]@\/contexts\/AuthContext['"]\s*;/g,
    to: "import { useAuth } from '@/hooks/useZustandHooks';"
  },
  {
    // Pattern 3: Only useFamily import
    from: /import\s*{\s*useFamily\s*}\s*from\s*['"]@\/contexts\/FamilyContext['"]\s*;/g,
    to: "import { useFamily } from '@/hooks/useZustandHooks';"
  },
  {
    // Pattern 4: Direct AuthContext import (for components that might use the context directly)
    from: /import\s*{\s*AuthContext\s*}\s*from\s*['"]@\/contexts\/AuthContext['"]\s*;/g,
    to: "// TODO: Migrate from AuthContext - use useAuth from '@/hooks/useZustandHooks'"
  },
  {
    // Pattern 5: Direct FamilyContext import
    from: /import\s*{\s*FamilyContext\s*}\s*from\s*['"]@\/contexts\/FamilyContext['"]\s*;/g,
    to: "// TODO: Migrate from FamilyContext - use useFamily from '@/hooks/useZustandHooks'"
  }
];

// Track migration results
const results = {
  migrated: [],
  failed: [],
  skipped: [],
  alreadyMigrated: []
};

// Process each file
filesToMigrate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      results.skipped.push({ file: filePath, reason: 'File not found' });
      return;
    }
    
    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Check if already migrated
    if (content.includes("from '@/hooks/useZustandHooks'")) {
      results.alreadyMigrated.push(filePath);
      return;
    }
    
    // Apply migration patterns
    let changesMade = false;
    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        changesMade = true;
      }
    });
    
    // Write back if changes were made
    if (changesMade) {
      fs.writeFileSync(fullPath, content, 'utf8');
      results.migrated.push(filePath);
    } else {
      results.skipped.push({ file: filePath, reason: 'No matching patterns found' });
    }
    
  } catch (error) {
    results.failed.push({ file: filePath, error: error.message });
  }
});

// Print results
console.log('\n🔄 Zustand Migration Results:');
console.log('================================\n');

if (results.migrated.length > 0) {
  console.log('✅ Successfully migrated:');
  results.migrated.forEach(file => console.log(`   - ${file}`));
  console.log('');
}

if (results.alreadyMigrated.length > 0) {
  console.log('📋 Already migrated:');
  results.alreadyMigrated.forEach(file => console.log(`   - ${file}`));
  console.log('');
}

if (results.skipped.length > 0) {
  console.log('⏭️  Skipped:');
  results.skipped.forEach(item => console.log(`   - ${item.file} (${item.reason})`));
  console.log('');
}

if (results.failed.length > 0) {
  console.log('❌ Failed:');
  results.failed.forEach(item => console.log(`   - ${item.file} (${item.error})`));
  console.log('');
}

console.log(`\n📊 Summary:`);
console.log(`   - Migrated: ${results.migrated.length}`);
console.log(`   - Already migrated: ${results.alreadyMigrated.length}`);
console.log(`   - Skipped: ${results.skipped.length}`);
console.log(`   - Failed: ${results.failed.length}`);
console.log(`   - Total: ${filesToMigrate.length}\n`);

// Exit with appropriate code
process.exit(results.failed.length > 0 ? 1 : 0);