/**
 * Script to create sample advanced chore cards for testing
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

// Firebase config (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyAd_vT8oCINZo7F2X3vNjEqEv6gFFQz_TQ",
  authDomain: "family-fun-app.firebaseapp.com",
  projectId: "family-fun-app",
  storageBucket: "family-fun-app.appspot.com",
  messagingSenderId: "278448490194",
  appId: "1:278448490194:web:8a3f4e9b1c2d5e6f7g8h9i",
  measurementId: "G-ABCDEFGHIJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample advanced card data
const createAdvancedCards = async () => {
  try {
    console.log('Creating sample advanced chore cards...');
    
    // Get existing chores
    const choresSnapshot = await getDocs(collection(db, 'chores'));
    const chores = choresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${chores.length} existing chores`);
    
    for (const chore of chores.slice(0, 3)) { // Create advanced cards for first 3 chores
      const advancedCard = {
        choreId: chore.id,
        familyId: chore.familyId,
        
        // Multi-level instructions
        instructions: {
          child: {
            title: `${chore.title} - For Kids`,
            description: `Simple steps to complete ${chore.title}`,
            steps: [
              {
                id: 'step1',
                title: 'Get Ready',
                description: 'Gather everything you need first',
                estimatedTime: 2,
                safetyWarnings: ['Ask an adult if you need help'],
                media: []
              },
              {
                id: 'step2', 
                title: 'Do the Task',
                description: 'Follow the steps carefully',
                estimatedTime: 10,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step3',
                title: 'Clean Up',
                description: 'Put everything back where it belongs',
                estimatedTime: 3,
                safetyWarnings: [],
                media: []
              }
            ]
          },
          teen: {
            title: `${chore.title} - For Teens`,
            description: `Complete guide for ${chore.title}`,
            steps: [
              {
                id: 'step1',
                title: 'Preparation',
                description: 'Set up your workspace and gather materials',
                estimatedTime: 3,
                safetyWarnings: ['Check for any safety requirements'],
                media: []
              },
              {
                id: 'step2',
                title: 'Execute Task',
                description: 'Complete the main task efficiently',
                estimatedTime: 15,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step3',
                title: 'Quality Check',
                description: 'Review your work and make improvements',
                estimatedTime: 5,
                safetyWarnings: [],
                media: []
              }
            ]
          },
          adult: {
            title: `${chore.title} - Expert Level`,
            description: `Professional approach to ${chore.title}`,
            steps: [
              {
                id: 'step1',
                title: 'Strategic Planning',
                description: 'Plan the most efficient approach',
                estimatedTime: 2,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step2',
                title: 'Implementation',
                description: 'Execute with focus on quality and efficiency',
                estimatedTime: 20,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step3',
                title: 'Optimization',
                description: 'Identify improvements for next time',
                estimatedTime: 3,
                safetyWarnings: [],
                media: []
              }
            ]
          }
        },
        
        // Educational content
        educationalContent: {
          facts: ['fact_1', 'fact_2'],
          quotes: ['quote_1', 'quote_2'],
          learningObjectives: ['Learn proper technique', 'Understand importance of consistency']
        },
        
        // Gamification
        gamification: {
          specialAchievements: ['first_advanced_completion'],
          qualityMultipliers: {
            incomplete: 0,
            partial: 0.5,
            complete: 1.0,
            excellent: 1.2
          },
          learningRewards: {
            instructionCompleted: 5,
            factEngagement: 2,
            certificationProgress: 10
          },
          certificationBonuses: {
            basic: 10,
            intermediate: 20,
            advanced: 30
          }
        },
        
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        isActive: true,
        version: 1
      };
      
      // Create the advanced card
      const docRef = await addDoc(collection(db, 'advancedChoreCards'), advancedCard);
      console.log(`Created advanced card for chore "${chore.title}" with ID: ${docRef.id}`);
    }
    
    console.log('Sample advanced cards created successfully!');
  } catch (error) {
    console.error('Error creating sample advanced cards:', error);
  }
};

// Run the script
createAdvancedCards();