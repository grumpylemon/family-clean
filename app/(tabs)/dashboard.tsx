import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
      router.replace('/login');
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
        <ThemedView style={styles.headerContent}>
          <ThemedView>
            <ThemedText style={styles.greeting}>Welcome back,</ThemedText>
            <ThemedText style={styles.userName}>{currentMember?.name || user.displayName}</ThemedText>
          </ThemedView>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
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
            <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
            <ThemedText style={styles.actionCardTextPrimary}>View Chores</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowFamilySettings(true)}
          >
            <Ionicons name="people-outline" size={32} color="#4285F4" />
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
                <Ionicons name="people" size={24} color="#4285F4" />
                <ThemedText style={styles.adminCardText}>Manage Members</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowChoreManagement(true)}
              >
                <Ionicons name="list" size={24} color="#4285F4" />
                <ThemedText style={styles.adminCardText}>Manage Chores</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowFamilySettings(true)}
              >
                <Ionicons name="settings" size={24} color="#4285F4" />
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
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
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryAction: {
    backgroundColor: '#4285F4',
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionCardTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#4285F4',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 20,
  },
  choreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  choreDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  chorePoints: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chorePointsText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '600',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  adminCard: {
    flex: 1,
    minWidth: isTablet ? 150 : 100,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  adminCardText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  familyCodeSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  familyCodeLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  familyCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4285F4',
    letterSpacing: 2,
  },
  familyCodeHint: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
  },
});