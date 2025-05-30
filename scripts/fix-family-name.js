#!/usr/bin/env node

/**
 * Script to fix family name inconsistency
 * Clears stale Zustand cache data that might be showing old family names
 */

console.log('🔧 Family Name Fix Script');
console.log('========================\n');

console.log('This script will help fix the family name inconsistency issue where');
console.log('the admin panel shows an old family name instead of the current one.\n');

console.log('To fix this issue, please do the following:\n');

console.log('1. Open your browser and navigate to the Family Compass app');
console.log('   https://family-fun-app.web.app\n');

console.log('2. Open the browser Developer Console:');
console.log('   - Chrome/Edge: Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)');
console.log('   - Firefox: Press F12 or Ctrl+Shift+K (Cmd+Option+K on Mac)');
console.log('   - Safari: Enable Developer menu in Preferences, then Cmd+Option+C\n');

console.log('3. In the Console tab, paste and run these commands:\n');

console.log('   // Clear all Zustand persisted data');
console.log('   localStorage.removeItem("family-store");');
console.log('   ');
console.log('   // Clear any cached family data');
console.log('   localStorage.removeItem("family-cache");');
console.log('   localStorage.removeItem("user-cache");');
console.log('   ');
console.log('   // Clear auth debug flag');
console.log('   window.__authLogged = false;');
console.log('   ');
console.log('   // Force reload');
console.log('   location.reload();\n');

console.log('4. After the page reloads:');
console.log('   - Sign in again if needed');
console.log('   - Check the Admin Panel - it should show the correct family name');
console.log('   - The continuous auth logs should also be fixed\n');

console.log('📝 Note: This will clear your local cache but will NOT affect');
console.log('   your actual data in Firebase. All your family data, chores,');
console.log('   rewards, etc. will remain intact.\n');

console.log('✅ Done! Follow the steps above to fix the issue.');