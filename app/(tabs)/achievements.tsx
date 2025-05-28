import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

export default function AchievementsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Achievements</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileLevel}>Newbie</Text>
            <Text style={styles.profileSubtitle}>Level 1</Text>
            <Text style={styles.achievementStats}>Total Achievements Unlocked: 0 / 27</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chores Achievements</Text>
            <Text style={styles.comingSoon}>Achievement system coming soon!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Levels Achievements</Text>
            <Text style={styles.comingSoon}>Level progression achievements coming soon!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points Achievements</Text>
            <Text style={styles.comingSoon}>Points milestone achievements coming soon!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Achievements</Text>
            <Text style={styles.comingSoon}>Special category achievements coming soon!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Streaks Achievements</Text>
            <Text style={styles.comingSoon}>Streak achievements coming soon!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teamwork Achievements</Text>
            <Text style={styles.comingSoon}>Collaboration achievements coming soon!</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
  },
  content: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#be185d',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#f9a8d4',
    marginBottom: 12,
  },
  achievementStats: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  comingSoon: {
    fontSize: 16,
    color: '#9f1239',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});