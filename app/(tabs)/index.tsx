import { FirestoreTest } from '@/components/FirestoreTest';
import { FamilySetup } from '@/components/FamilySetup';
import { ManageMembers } from '@/components/ManageMembers';
import { ChoreManagement } from '@/components/ChoreManagement';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';

// Version tracking for updates
console.log("Home Screen version: v4");

export default function HomeScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const { family, loading: familyLoading, error, isAdmin, currentMember } = useFamily();
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  if (authLoading || familyLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Show family setup if user has no family
  if (!family) {
    return <FamilySetup />;
  }

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Welcome to {family.name}!</ThemedText>
        
        {/* User info */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your Profile</ThemedText>
          <ThemedText>Name: {currentMember?.name || user.displayName || 'User'}</ThemedText>
          <ThemedText>Role: {currentMember?.familyRole || 'Member'} ({currentMember?.role || 'member'})</ThemedText>
          {currentMember && (
            <ThemedView style={styles.statsRow}>
              <ThemedView style={styles.statItem}>
                <ThemedText style={styles.statValue}>{currentMember.points.current}</ThemedText>
                <ThemedText style={styles.statLabel}>Points</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statItem}>
                <ThemedText style={styles.statValue}>{currentMember.points.weekly}</ThemedText>
                <ThemedText style={styles.statLabel}>This Week</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statItem}>
                <ThemedText style={styles.statValue}>{currentMember.points.lifetime}</ThemedText>
                <ThemedText style={styles.statLabel}>All Time</ThemedText>
              </ThemedView>
            </ThemedView>
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
        
        {/* Family info */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Family Info</ThemedText>
          <ThemedText>Join Code: <ThemedText style={styles.joinCode}>{family.joinCode}</ThemedText></ThemedText>
          <ThemedText>Members: {family.members?.length || 0}</ThemedText>
          
          {/* Member list */}
          <ThemedView style={styles.memberList}>
            {family.members.map((member) => (
              <ThemedView key={member.uid} style={styles.memberItem}>
                <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                <ThemedText style={styles.memberRole}>{member.familyRole}</ThemedText>
                {member.uid === family.adminId && (
                  <ThemedText style={styles.adminBadge}>Admin</ThemedText>
                )}
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
        
        {/* Admin actions */}
        {isAdmin && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Admin Actions</ThemedText>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowManageMembers(true)}
            >
              <ThemedText style={styles.actionButtonText}>Manage Members</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowChoreManagement(true)}
            >
              <ThemedText style={styles.actionButtonText}>Manage Chores</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <ThemedText style={styles.actionButtonText}>Family Settings</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        
        {/* Firestore test component */}
        <FirestoreTest />
      </ThemedView>
      
      {/* Manage Members Modal */}
      <ManageMembers 
        visible={showManageMembers}
        onClose={() => setShowManageMembers(false)}
      />
      
      {/* Chore Management Modal */}
      <ChoreManagement
        visible={showChoreManagement}
        onClose={() => setShowChoreManagement(false)}
      />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  joinCode: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4285F4',
  },
  memberList: {
    marginTop: 12,
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
  },
  memberRole: {
    fontSize: 14,
    opacity: 0.7,
  },
  adminBadge: {
    backgroundColor: '#4285F4',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderWidth: 1,
    borderColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#4285F4',
    fontWeight: 'bold',
    textAlign: 'center',
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
