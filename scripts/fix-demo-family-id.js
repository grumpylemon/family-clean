#!/usr/bin/env node

/**
 * Fix Demo Family ID Script
 * 
 * This script fixes the issue where families are created with 'demo-family-id' instead of unique IDs.
 * It finds the demo family, creates a new family with proper unique ID, and updates user references.
 * 
 * Run with: node scripts/fix-demo-family-id.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where 
} = require('firebase/firestore');

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

async function fixDemoFamilyId() {
  console.log('🔧 Starting demo family ID fix...\n');
  
  try {
    // 1. Find the family with ID "demo-family-id"
    console.log('📋 Checking for demo-family-id...');
    const demoFamilyRef = doc(db, 'families', 'demo-family-id');
    const demoFamilyDoc = await getDoc(demoFamilyRef);
    
    if (!demoFamilyDoc.exists()) {
      console.log('ℹ️  No demo-family-id found. Nothing to fix.');
      return;
    }
    
    const demoFamilyData = demoFamilyDoc.data();
    console.log(`✅ Found demo family: "${demoFamilyData.name}" with ${demoFamilyData.members?.length || 0} members`);
    
    // 2. Create a new family with the same data but unique ID
    console.log('🏗️  Creating new family with unique ID...');
    const newFamilyData = {
      ...demoFamilyData,
      updatedAt: new Date()
    };
    
    const newFamilyRef = await addDoc(collection(db, 'families'), newFamilyData);
    const newFamilyId = newFamilyRef.id;
    console.log(`✅ Created new family with ID: ${newFamilyId}`);
    
    // 3. Find all users that reference the demo family ID
    console.log('👥 Finding users that reference demo-family-id...');
    const usersQuery = query(
      collection(db, 'users'), 
      where('familyId', '==', 'demo-family-id')
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    console.log(`📋 Found ${usersSnapshot.size} users to update`);
    
    // 4. Update all user profiles to reference the new family ID
    const updatePromises = [];
    usersSnapshot.forEach((userDoc) => {
      const userRef = doc(db, 'users', userDoc.id);
      updatePromises.push(
        updateDoc(userRef, {
          familyId: newFamilyId,
          updatedAt: new Date().toISOString()
        })
      );
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Updated ${updatePromises.length} user profiles`);
    
    // 5. Update family members array to use new family ID in member objects
    if (demoFamilyData.members && demoFamilyData.members.length > 0) {
      console.log('👨‍👩‍👧‍👦 Updating family members array...');
      const updatedMembers = demoFamilyData.members.map(member => ({
        ...member,
        familyId: newFamilyId // Update familyId in member objects if it exists
      }));
      
      await updateDoc(newFamilyRef, {
        members: updatedMembers,
        updatedAt: new Date()
      });
      console.log('✅ Updated family members array');
    }
    
    // 6. Find and update any other collections that might reference the demo family ID
    const collectionsToCheck = ['chores', 'rewards', 'choreCompletions', 'dailyPoints'];
    
    for (const collectionName of collectionsToCheck) {
      console.log(`🔍 Checking ${collectionName} for demo-family-id references...`);
      try {
        const collectionQuery = query(
          collection(db, collectionName),
          where('familyId', '==', 'demo-family-id')
        );
        const collectionSnapshot = await getDocs(collectionQuery);
        
        if (collectionSnapshot.size > 0) {
          console.log(`📋 Found ${collectionSnapshot.size} documents in ${collectionName} to update`);
          
          const collectionUpdatePromises = [];
          collectionSnapshot.forEach((docSnapshot) => {
            const docRef = doc(db, collectionName, docSnapshot.id);
            collectionUpdatePromises.push(
              updateDoc(docRef, {
                familyId: newFamilyId,
                updatedAt: new Date().toISOString()
              })
            );
          });
          
          await Promise.all(collectionUpdatePromises);
          console.log(`✅ Updated ${collectionUpdatePromises.length} documents in ${collectionName}`);
        } else {
          console.log(`ℹ️  No documents found in ${collectionName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not check ${collectionName}:`, error.message);
      }
    }
    
    // 7. Delete the old demo family
    console.log('🗑️  Deleting old demo-family-id...');
    await deleteDoc(demoFamilyRef);
    console.log('✅ Deleted old demo family');
    
    console.log('\n🎉 Demo family ID fix completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Old family ID: demo-family-id (deleted)`);
    console.log(`   • New family ID: ${newFamilyId}`);
    console.log(`   • Updated ${updatePromises.length} user profiles`);
    console.log(`   • Family name: "${demoFamilyData.name}"`);
    
  } catch (error) {
    console.error('💥 Fix failed:', error);
    throw error;
  }
}

// Run the fix
fixDemoFamilyId()
  .then(() => {
    console.log('\n✨ All done! Users can now create new families with unique IDs.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });