import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  Dimensions,
  Text,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { FamilySetup } from '@/components/FamilySetup';
import { ManageMembers } from '@/components/ManageMembers';
import { ChoreManagement } from '@/components/ChoreManagement';
import { FamilySettings } from '@/components/FamilySettings';
import { getChores } from '@/services/firestore';
import { Chore } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function DashboardScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const { family, loading: familyLoading, isAdmin, currentMember } = useFamily();
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  const [showFamilySettings, setShowFamilySettings] = useState(false);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loadingChores, setLoadingChores] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      // Add a small delay to ensure router is ready
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (family) {
      loadChores();
    }
  }, [family]);

  const loadChores = async () => {
    if (!family) return;
    
    setLoadingChores(true);
    try {
      const familyChores = await getChores(family.id!);
      setChores(familyChores);
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setLoadingChores(false);
    }
  };

  const handleLogout = async () => {
    try {
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
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return null;
  }

  if (!family) {
    return <FamilySetup />;
  }

  const myChores = chores.filter(chore => 
    chore.assignedTo === user.uid && chore.status === 'open'
  );
  
  const unassignedChores = chores.filter(chore => 
    !chore.assignedTo && chore.status === 'open'
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedView style={[styles.headerContent, {backgroundColor: 'transparent'}]}>
          <ThemedView style={{backgroundColor: 'transparent'}}>
            <ThemedText style={styles.greeting}>Welcome back,</ThemedText>
            <ThemedText style={styles.userName}>{currentMember?.name || user.displayName}</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>{currentMember?.points.current || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Points</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>{myChores.length}</ThemedText>
            <ThemedText style={styles.statLabel}>My Chores</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>{family.members.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Members</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.primaryAction]}
            onPress={() => router.push('/(tabs)/chores')}
          >
            <Ionicons name="checkmark-circle-outline" size={28} color="#ffffff" />
            <ThemedText style={styles.actionCardTextPrimary}>View Chores</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowFamilySettings(true)}
          >
            <Ionicons name="people-outline" size={28} color="#3b82f6" />
            <ThemedText style={styles.actionCardText}>Family Info</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* My Chores Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>My Chores</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/chores')}>
              <ThemedText style={styles.seeAllText}>See all</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {loadingChores ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : myChores.length === 0 ? (
            <ThemedText style={styles.emptyText}>No chores assigned to you</ThemedText>
          ) : (
            myChores.slice(0, 3).map((chore) => (
              <ThemedView key={chore.id} style={styles.choreItem}>
                <ThemedView style={styles.choreInfo}>
                  <ThemedText style={styles.choreTitle}>{chore.title}</ThemedText>
                  <ThemedText style={styles.choreDate}>
                    Due: {new Date(chore.dueDate).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.chorePoints}>
                  <ThemedText style={styles.chorePointsText}>{chore.points} pts</ThemedText>
                </ThemedView>
              </ThemedView>
            ))
          )}
        </ThemedView>

        {/* Available Chores */}
        {unassignedChores.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Available Chores</ThemedText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/chores')}>
                <ThemedText style={styles.seeAllText}>See all</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            {unassignedChores.slice(0, 2).map((chore) => (
              <ThemedView key={chore.id} style={styles.choreItem}>
                <ThemedView style={styles.choreInfo}>
                  <ThemedText style={styles.choreTitle}>{chore.title}</ThemedText>
                  <ThemedText style={styles.choreDate}>
                    Due: {new Date(chore.dueDate).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.chorePoints}>
                  <ThemedText style={styles.chorePointsText}>{chore.points} pts</ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Admin Tools</ThemedText>
            <ThemedView style={styles.adminGrid}>
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowManageMembers(true)}
              >
                <Ionicons name="people" size={24} color="#64748b" />
                <ThemedText style={styles.adminCardText}>Members</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowChoreManagement(true)}
              >
                <Ionicons name="list" size={24} color="#64748b" />
                <ThemedText style={styles.adminCardText}>Chores</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowFamilySettings(true)}
              >
                <Ionicons name="settings" size={24} color="#64748b" />
                <ThemedText style={styles.adminCardText}>Settings</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

        {/* Family Code */}
        <ThemedView style={styles.familyCodeSection}>
          <ThemedText style={styles.familyCodeLabel}>Family Join Code</ThemedText>
          <ThemedText style={styles.familyCode}>{family.joinCode}</ThemedText>
          <ThemedText style={styles.familyCodeHint}>Share this code with family members</ThemedText>
        </ThemedView>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    minWidth: 140,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  actionCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  actionCardTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  seeAllText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 32,
    fontSize: 16,
    fontWeight: '500',
  },
  choreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  choreDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chorePoints: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chorePointsText: {
    color: '#d97706',
    fontSize: 14,
    fontWeight: '700',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
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
  familyCodeSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  familyCodeLabel: {
    fontSize: 16,
    color: '#0369a1',
    marginBottom: 8,
    fontWeight: '600',
  },
  familyCode: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0c4a6e',
    letterSpacing: 4,
  },
  familyCodeHint: {
    fontSize: 14,
    color: '#0284c7',
    marginTop: 8,
    fontWeight: '500',
  },
});