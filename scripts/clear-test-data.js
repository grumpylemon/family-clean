#!/usr/bin/env node

/**
 * Clear Test Data Script
 * 
 * This script clears all test data from Firestore while preserving collection structure.
 * Run with: node scripts/clear-test-data.js
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
    console.error(`❌ Error clearing ${collectionName}:`, error);
  }
}

async function clearAllTestData() {
  console.log('🚀 Starting database cleanup...\n');
  
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
  
  console.log('\n🎉 Database cleanup completed!');
  console.log('📝 Collections preserved, all documents deleted');
  process.exit(0);
}

// Run the cleanup
clearAllTestData().catch((error) => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});