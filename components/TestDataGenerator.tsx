import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { useAuth, useFamily } from '../hooks/useZustandHooks';
import { createChore } from '../services/firestore';
import { Chore } from '../types';

export function TestDataGenerator() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [loading, setLoading] = useState(false);

  const testChores = [
    // Daily chores
    {
      title: "Clean Kitchen Counter",
      description: "Wipe down all kitchen counters and stovetop",
      type: "individual" as const,
      difficulty: "easy" as const,
      points: 5,
      cooldownHours: 24,
      recurring: { enabled: true, frequencyDays: 1 }
    },
    {
      title: "Load/Unload Dishwasher",
      description: "Load dirty dishes and unload clean ones",
      type: "family" as const,
      difficulty: "easy" as const,
      points: 5,
      cooldownHours: 12,
      recurring: { enabled: true, frequencyDays: 1 }
    },
    {
      title: "Take Out Trash",
      description: "Empty all trash cans and take bins to curb",
      type: "family" as const,
      difficulty: "easy" as const,
      points: 5,
      cooldownHours: 24,
      recurring: { enabled: true, frequencyDays: 1 }
    },
    // Weekly chores
    {
      title: "Vacuum Living Room",
      description: "Vacuum all carpets and rugs in living areas",
      type: "individual" as const,
      difficulty: "medium" as const,
      points: 10,
      cooldownHours: 168,
      recurring: { enabled: true, frequencyDays: 7 }
    },
    {
      title: "Clean Bathrooms",
      description: "Clean toilets, sinks, mirrors, and floors",
      type: "family" as const,
      difficulty: "hard" as const,
      points: 15,
      cooldownHours: 168,
      recurring: { enabled: true, frequencyDays: 7 }
    },
    {
      title: "Mow Lawn",
      description: "Mow front and back yard, edge walkways",
      type: "individual" as const,
      difficulty: "hard" as const,
      points: 20,
      cooldownHours: 168,
      recurring: { enabled: true, frequencyDays: 7 }
    },
    {
      title: "Do Laundry",
      description: "Wash, dry, and fold one load of laundry",
      type: "shared" as const,
      difficulty: "medium" as const,
      points: 10,
      cooldownHours: 48,
      recurring: { enabled: true, frequencyDays: 3 }
    },
    // Pet chores
    {
      title: "Feed the Dog",
      description: "Give fresh food and water to the dog",
      type: "pet" as const,
      difficulty: "easy" as const,
      points: 3,
      cooldownHours: 12,
      recurring: { enabled: true, frequencyDays: 1 }
    },
    {
      title: "Walk the Dog",
      description: "Take the dog for a 20-minute walk",
      type: "pet" as const,
      difficulty: "medium" as const,
      points: 8,
      cooldownHours: 24,
      recurring: { enabled: true, frequencyDays: 1 }
    },
    // One-time chores
    {
      title: "Organize Garage",
      description: "Sort items, sweep floor, organize shelves",
      type: "individual" as const,
      difficulty: "hard" as const,
      points: 25,
      cooldownHours: 720,
      recurring: { enabled: false }
    },
    {
      title: "Wash Car",
      description: "Wash and vacuum the family car",
      type: "shared" as const,
      difficulty: "medium" as const,
      points: 12,
      cooldownHours: 336,
      recurring: { enabled: false }
    },
    {
      title: "Clean Out Refrigerator",
      description: "Remove old food, wipe shelves, organize items",
      type: "family" as const,
      difficulty: "medium" as const,
      points: 10,
      cooldownHours: 336,
      recurring: { enabled: true, frequencyDays: 14 }
    }
  ];

  const generateTestData = async () => {
    if (!user || !family) {
      Alert.alert('Error', 'Please log in and join a family first');
      return;
    }

    setLoading(true);
    let created = 0;
    const members = family.members || [];

    try {
      for (let i = 0; i < testChores.length; i++) {
        const chore = testChores[i];
        
        // Assign to different members
        let assignedTo = '';
        let assignedToName = '';
        
        if (chore.type === 'individual' || chore.type === 'pet') {
          const memberIndex = i % members.length;
          assignedTo = members[memberIndex].uid;
          assignedToName = members[memberIndex].name;
        } else if (chore.type === 'family') {
          // Assign to first active member initially
          const activeMember = members.find(m => m.isActive);
          if (activeMember) {
            assignedTo = activeMember.uid;
            assignedToName = activeMember.name;
          }
        }
        // shared chores start unassigned
        
        const choreData: Omit<Chore, 'id'> = {
          ...chore,
          assignedTo,
          assignedToName,
          familyId: family.id!,
          createdBy: user.uid,
          createdAt: new Date(),
          dueDate: new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000),
          status: 'open'
        };
        
        try {
          await createChore(choreData);
          created++;
        } catch (error) {
          console.error(`Failed to create ${chore.title}:`, error);
        }
      }
      
      Alert.alert(
        'Success', 
        `Created ${created} test chores!\n\nGo to the Chores tab to see them.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create test data');
      console.error('Error creating test data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={generateTestData}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <ThemedText style={styles.buttonText}>Generate Test Chores</ThemedText>
        )}
      </TouchableOpacity>
      <ThemedText style={styles.hint}>
        This will create 12 sample chores with different types and difficulties
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});