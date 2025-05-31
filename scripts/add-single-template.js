#!/usr/bin/env node
/**
 * Simple script to add one template for testing
 */

// Import required modules
const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin (for server-side operations)
if (!admin.apps.length) {
  // Use default credentials if available, otherwise initialize with project ID
  try {
    admin.initializeApp({
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'family-fun-app'
    });
  } catch (error) {
    console.log('Note: Using Firebase Admin without service account - this is normal for local development');
    console.log('If you have authentication issues, make sure you\'re logged in with: firebase login');
  }
}

const db = admin.firestore();

// Simple test template
const template = {
  id: 'kitchen-daily',
  name: 'Kitchen Daily Clean',
  description: 'Essential daily kitchen cleaning tasks',
  category: 'daily_routines',
  difficulty: 'beginner',
  isOfficial: true,
  isPublic: true,
  popularity: 90,
  rating: 4.5,
  reviewCount: 20,
  targetFamilySize: [2, 6],
  totalEstimatedTime: 20,
  tags: ['kitchen', 'daily', 'cleaning'],
  version: 1,
  chores: [
    {
      title: 'Empty Dishwasher',
      description: 'Unload clean dishes and put them away',
      type: 'cleaning',
      difficulty: 'easy',
      basePoints: 10,
      estimatedDuration: 8,
      frequency: 1,
      cooldownHours: 12,
      importance: 'high',
      isOptional: false,
      canModifyPoints: true,
      canModifySchedule: true
    },
    {
      title: 'Wipe Counters',
      description: 'Clean and disinfect kitchen countertops',
      type: 'cleaning',
      difficulty: 'easy',
      basePoints: 8,
      estimatedDuration: 7,
      frequency: 1,
      cooldownHours: 12,
      importance: 'high',
      isOptional: false,
      canModifyPoints: true,
      canModifySchedule: true
    },
    {
      title: 'Sweep Floor',
      description: 'Sweep kitchen floor of crumbs and debris',
      type: 'cleaning',
      difficulty: 'easy',
      basePoints: 6,
      estimatedDuration: 5,
      frequency: 1,
      cooldownHours: 24,
      importance: 'medium',
      isOptional: false,
      canModifyPoints: true,
      canModifySchedule: true
    }
  ],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
};

async function addTemplate() {
  try {
    console.log('🏠 Adding test template to choreTemplates collection...');
    
    // Check if template already exists
    const existingTemplate = await db.collection('choreTemplates')
      .where('id', '==', template.id)
      .get();
    
    if (!existingTemplate.empty) {
      console.log('⚠️ Template already exists, skipping...');
      return;
    }
    
    // Add the template
    const docRef = await db.collection('choreTemplates').add(template);
    console.log('✅ Template added successfully with ID:', docRef.id);
    console.log('📱 You can now test the template library in the app!');
    
  } catch (error) {
    console.error('❌ Error adding template:', error.message);
    
    if (error.message.includes('Could not load the default credentials')) {
      console.log('\n💡 Authentication Issue:');
      console.log('Try running: firebase login');
      console.log('Or: gcloud auth application-default login');
    }
  }
}

addTemplate();