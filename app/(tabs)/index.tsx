import { FirestoreTest } from '@/components/FirestoreTest';
import { FamilySetup } from '@/components/FamilySetup';
import { ManageMembers } from '@/components/ManageMembers';
import { ChoreManagement } from '@/components/ChoreManagement';
import { FamilySettings } from '@/components/FamilySettings';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Version tracking for updates
console.log("Home Screen version: v5");

export default function HomeScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const { family, loading: familyLoading, error, isAdmin, currentMember } = useFamily();
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  const [showFamilySettings, setShowFamilySettings] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Add a small delay to ensure router is ready
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      await logout();
      // Add a small delay to ensure router is ready
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  if (authLoading || familyLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Family</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to {family.name}!</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your family and track progress together
          </Text>
        </View>
        
        {/* User Profile Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Your Profile</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {currentMember?.name || user.displayName || 'User'}
            </Text>
            <Text style={styles.profileRole}>
              {currentMember?.familyRole || 'Member'} • {currentMember?.role || 'member'}
            </Text>
          </View>

          {currentMember && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentMember.points.current}</Text>
                <Text style={styles.statLabel}>Current Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentMember.points.weekly}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentMember.points.lifetime}</Text>
                <Text style={styles.statLabel}>All Time</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Family Info Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Family Info</Text>
          </View>
          
          <View style={styles.familyDetails}>
            <View style={styles.familyDetailRow}>
              <Text style={styles.familyDetailLabel}>Join Code:</Text>
              <View style={styles.joinCodeContainer}>
                <Text style={styles.joinCode}>{family.joinCode}</Text>
              </View>
            </View>
            <View style={styles.familyDetailRow}>
              <Text style={styles.familyDetailLabel}>Members:</Text>
              <Text style={styles.familyDetailValue}>{family.members?.length || 0}</Text>
            </View>
          </View>
          
          {/* Member list */}
          <View style={styles.memberList}>
            <Text style={styles.memberListTitle}>Family Members</Text>
            {family.members.map((member) => (
              <View key={member.uid} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={20} color="#6b7280" />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.familyRole}</Text>
                </View>
                {member.uid === family.adminId && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          
          {!isAdmin && (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowFamilySettings(true)}
            >
              <Ionicons name="settings-outline" size={20} color="#3b82f6" />
              <Text style={styles.settingsButtonText}>View Settings</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-outline" size={24} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Admin Tools</Text>
            </View>
            
            <View style={styles.adminGrid}>
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowManageMembers(true)}
              >
                <Ionicons name="people" size={24} color="#64748b" />
                <Text style={styles.adminCardText}>Manage Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowChoreManagement(true)}
              >
                <Ionicons name="list" size={24} color="#64748b" />
                <Text style={styles.adminCardText}>Manage Chores</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowFamilySettings(true)}
              >
                <Ionicons name="settings" size={24} color="#64748b" />
                <Text style={styles.adminCardText}>Family Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Development Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-outline" size={24} color="#6b7280" />
            <Text style={styles.sectionTitle}>Development</Text>
          </View>
          <FirestoreTest />
        </View>
      </ScrollView>
      
      {/* Modals */}
      <ManageMembers 
        visible={showManageMembers}
        onClose={() => setShowManageMembers(false)}
      />
      
      <ChoreManagement
        visible={showChoreManagement}
        onClose={() => setShowChoreManagement(false)}
      />
      
      <FamilySettings
        visible={showFamilySettings}
        onClose={() => setShowFamilySettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  profileInfo: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
  },
  familyDetails: {
    marginBottom: 20,
  },
  familyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  familyDetailLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  familyDetailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  joinCodeContainer: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  joinCode: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0c4a6e',
    letterSpacing: 1,
  },
  memberList: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  memberListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  memberRole: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  adminBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  settingsButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  adminCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    minWidth: 100,
    maxWidth: 110,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adminCardText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#475569',
  },
});