#!/usr/bin/env node

// Script to clear Zustand persisted store data
// This helps resolve issues with stale data persisting across sessions

console.log('Clearing Zustand persisted store data...\n');

console.log('To clear on different platforms:\n');

console.log('1. Web (localStorage):');
console.log('   - Open browser DevTools (F12)');
console.log('   - Go to Application/Storage tab');
console.log('   - Find localStorage for your domain');
console.log('   - Delete the "family-store" key');
console.log('   - Or run in console: localStorage.removeItem("family-store")\n');

console.log('2. iOS (AsyncStorage):');
console.log('   - Delete and reinstall the app');
console.log('   - Or use expo-secure-store to clear programmatically\n');

console.log('3. Android (AsyncStorage):');
console.log('   - Clear app data in Settings > Apps > Family Compass > Storage');
console.log('   - Or delete and reinstall the app\n');

console.log('4. Programmatic clear (add to your app):');
console.log('   import { useFamilyStore } from "@/stores/familyStore";');
console.log('   // In a component or function:');
console.log('   useFamilyStore.persist.clearStorage();\n');

console.log('Note: This will clear ALL persisted state including:');
console.log('- User authentication data');
console.log('- Family information');
console.log('- Offline queue');
console.log('- All cached data\n');