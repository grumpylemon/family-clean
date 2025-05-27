import { FirestoreTest } from '@/components/FirestoreTest';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { getFamily, getUserFamily } from '@/services/firestore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Version tracking for updates
console.log("Home Screen version: v3");

export default function HomeScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  // Fetch family data if user is logged in
  useEffect(() => {
    async function fetchFamily() {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // For iOS or when using mock, use simplified flow
        if (Platform.OS === 'ios') {
          console.log("iOS detected, using mock family data");
          const mockFamilyData = await getFamily('mock-family-id');
          setFamily(mockFamilyData);
          return;
        }
        
        // Try to get user's family
        const familyData = await getUserFamily(user.uid);
        if (familyData) {
          setFamily(familyData);
        } else {
          // If no family found, could show UI to create one
          console.log("No family found for user");
        }
      } catch (err) {
        console.error("Error fetching family:", err);
        setError(`Failed to load family data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFamily();
  }, [user]);

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Welcome, {user.displayName || 'User'}!</ThemedText>
        
        {/* User info */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your Profile</ThemedText>
          <ThemedText>Email: {user.email || 'No email'}</ThemedText>
          <ThemedText>User ID: {user.uid}</ThemedText>
          {user.isAnonymous && (
            <ThemedText style={styles.note}>
              You're signed in as a guest. Create an account to save your data.
            </ThemedText>
          )}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutButtonText}>
              Logout
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        {/* Family info if available */}
        {family && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Family Info</ThemedText>
            <ThemedText>Name: {family.name}</ThemedText>
            <ThemedText>Members: {family.members?.length || 0}</ThemedText>
          </ThemedView>
        )}
        
        {/* Firestore test component */}
        <FirestoreTest />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#FF6B6B',
    marginVertical: 8,
  },
  note: {
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.7,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
