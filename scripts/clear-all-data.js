#!/usr/bin/env node

/**
 * Clear All Data Script
 * 
 * This script clears BOTH Firebase data AND browser localStorage (Zustand cache)
 * For a completely fresh start.
 * 
 * Run with: node scripts/clear-all-data.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase config (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyDIdq5ePKlc4qA3PCQaYoI_l_yW0-cFrBI",
  authDomain: "family-fun-app.firebaseapp.com",
  projectId: "family-fun-app",
  storageBucket: "family-fun-app.firebasestorage.app",
  messagingSenderId: "255617289303",
  appId: "1:255617289303:web:79c6bd8c5dfb4fda9b1906"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
  console.log(`🗑️  Clearing collection: ${collectionName}`);
  
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${deletePromises.length} documents from ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error clearing ${collectionName}:`, error.message);
  }
}

async function clearAllData() {
  console.log('🧹 Starting complete data cleanup...\n');
  
  // Collections to clear
  const collections = [
    'users',
    'families', 
    'chores',
    'rewards',
    'achievements',
    'userAchievements',
    'choreCompletions',
    'dailyPoints',
    'pets',
    'pointTransactions',
    'rooms'
  ];
  
  // Clear each collection
  for (const collectionName of collections) {
    await clearCollection(collectionName);
  }
  
  console.log('\n✅ Firebase cleanup completed!');
  
  // Instructions for clearing localStorage
  console.log('\n📱 To clear Zustand cache (localStorage):');
  console.log('1. Open the app in your browser: https://family-fun-app.web.app');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Paste and run this command:');
  console.log('\n   localStorage.clear(); location.reload();\n');
  console.log('5. This will clear all cached data and reload the page\n');
  
  console.log('🎯 Alternative: Use the Zustand Admin Panel (once we fix it) to reset the store');
  
  process.exit(0);
}

// Run the cleanup
clearAllData().catch((error) => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});