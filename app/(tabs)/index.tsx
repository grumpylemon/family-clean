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
        <ActivityIndicator size="large" color="#be185d" />
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
          <Ionicons name="log-out-outline" size={24} color="#831843" />
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
            <Ionicons name="person-circle-outline" size={24} color="#be185d" />
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
            <Ionicons name="people-outline" size={24} color="#be185d" />
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
                  <Ionicons name="person" size={20} color="#be185d" />
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
              <Ionicons name="settings-outline" size={20} color="#be185d" />
              <Text style={styles.settingsButtonText}>View Settings</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-outline" size={24} color="#be185d" />
              <Text style={styles.sectionTitle}>Admin Tools</Text>
            </View>
            
            <View style={styles.adminGrid}>
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowManageMembers(true)}
              >
                <Ionicons name="people" size={24} color="#be185d" />
                <Text style={styles.adminCardText}>Manage Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowChoreManagement(true)}
              >
                <Ionicons name="list" size={24} color="#be185d" />
                <Text style={styles.adminCardText}>Manage Chores</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowFamilySettings(true)}
              >
                <Ionicons name="settings" size={24} color="#be185d" />
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
    backgroundColor: '#fdf2f8',
  },
  header: {
    backgroundColor: '#fdf2f8',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#831843',
  },
  logoutButton: {
    padding: 12,
    backgroundColor: '#f9a8d4',
    borderRadius: 20,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#be185d',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  profileInfo: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 17,
    color: '#be185d',
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
    fontSize: 26,
    fontWeight: '800',
    color: '#831843',
  },
  statLabel: {
    fontSize: 13,
    color: '#be185d',
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.8,
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
    fontSize: 17,
    color: '#be185d',
    fontWeight: '500',
  },
  familyDetailValue: {
    fontSize: 17,
    color: '#831843',
    fontWeight: '600',
  },
  joinCodeContainer: {
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinCode: {
    fontWeight: '700',
    fontSize: 17,
    color: '#022c22',
    letterSpacing: 1,
  },
  memberList: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  memberListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#831843',
  },
  memberRole: {
    fontSize: 15,
    color: '#be185d',
    fontWeight: '500',
    opacity: 0.8,
  },
  adminBadge: {
    backgroundColor: '#f9a8d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  adminBadgeText: {
    color: '#831843',
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
    backgroundColor: '#fce7f3',
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsButtonText: {
    color: '#be185d',
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
    backgroundColor: '#fce7f3',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
    minWidth: 100,
    maxWidth: 110,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminCardText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#831843',
  },
});