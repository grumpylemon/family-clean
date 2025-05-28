import { ChoreManagement } from '@/components/ChoreManagement';
import { CompletionRewardModal } from '@/components/CompletionRewardModal';
import { FamilySettings } from '@/components/FamilySettings';
import { FamilySetup } from '@/components/FamilySetup';
import { ManageMembers } from '@/components/ManageMembers';
import { TestDataGenerator } from '@/components/TestDataGenerator';
import WeeklyProgress from '@/components/WeeklyProgress';
import WeeklyComparison from '@/components/WeeklyComparison';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { getChores, shouldResetWeeklyPoints, resetWeeklyPoints, completeChore } from '@/services/firestore';
import { Chore, CompletionReward } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function DashboardScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const { family, loading: familyLoading, isAdmin, currentMember } = useFamily();
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  const [showFamilySettings, setShowFamilySettings] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [choreComment, setChoreComment] = useState('');
  const [completingChore, setCompletingChore] = useState(false);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loadingChores, setLoadingChores] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [completionReward, setCompletionReward] = useState<CompletionReward | null>(null);
  const [completedChoreTitle, setCompletedChoreTitle] = useState('');

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
      checkWeeklyReset();
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

  const checkWeeklyReset = async () => {
    if (!family?.id) return;
    
    try {
      const shouldReset = await shouldResetWeeklyPoints(family.id);
      if (shouldReset) {
        await resetWeeklyPoints(family.id);
        console.log('Weekly points have been reset');
        // You might want to refresh family data here if needed
      }
    } catch (error) {
      console.error('Error checking weekly reset:', error);
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

  const handleCompleteChore = async () => {
    if (!selectedChore || !user) return;

    setCompletingChore(true);
    try {
      const result = await completeChore(selectedChore.id!);
      if (result.success && result.reward) {
        // Show the awesome completion modal with rewards
        setCompletedChoreTitle(selectedChore.title);
        setCompletionReward(result.reward);
        setShowRewardModal(true);
        
        // Close the chore details modal
        setSelectedChore(null);
        setChoreComment('');
        
        // Reload chores to update the list
        setTimeout(() => {
          loadChores();
        }, 1000);
      } else if (!result.success && result.error) {
        Alert.alert('Error', result.error || 'Failed to complete chore');
      } else {
        // Fallback success case
        Alert.alert(
          'Chore Completed!', 
          `Great job! You earned ${selectedChore.points} points.`,
          [{ text: 'OK', onPress: () => {
            setSelectedChore(null);
            setChoreComment('');
            loadChores(); // Reload chores to update the list
          }}]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while completing the chore');
      console.error('Error completing chore:', error);
    } finally {
      setCompletingChore(false);
    }
  };

  const closeChoreModal = () => {
    setSelectedChore(null);
    setChoreComment('');
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
    <View style={styles.container}>
      {/* Version Number */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v2.02-172aefe</Text>
      </View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{currentMember?.name || user.displayName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentMember?.points.current || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myChores.length}</Text>
            <Text style={styles.statLabel}>My Chores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{family.members.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>

        {/* My Chores Section - Moved above weekly progress for better visibility */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Chores</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/chores')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {loadingChores ? (
            <ActivityIndicator size="small" color="#be185d" />
          ) : myChores.length === 0 ? (
            <Text style={styles.emptyText}>No chores assigned to you</Text>
          ) : (
            // Show current available chores ordered by due date
            myChores
              .filter(chore => !chore.lockedUntil || new Date(chore.lockedUntil) <= new Date())
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 4)
              .map((chore) => (
                <TouchableOpacity 
                  key={chore.id} 
                  style={styles.choreItem}
                  onPress={() => setSelectedChore(chore)}
                >
                  <View style={styles.choreInfo}>
                    <Text style={styles.choreTitle}>{chore.title}</Text>
                    <Text style={styles.choreDate}>
                      Due: {new Date(chore.dueDate).toLocaleDateString()} at {new Date(chore.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                    {chore.description && (
                      <Text style={styles.choreDescription} numberOfLines={1}>
                        {chore.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.choreActions}>
                    <View style={styles.chorePoints}>
                      <Text style={styles.chorePointsText}>{chore.points} pts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#be185d" style={styles.choreArrow} />
                  </View>
                </TouchableOpacity>
              ))
          )}
        </View>

        {/* Weekly Progress */}
        {user && family && (
          <WeeklyProgress 
            userId={user.uid}
            familyId={family.id!}
            userName={currentMember?.name}
          />
        )}

        {/* Weekly Comparison */}
        {user && family && (
          <WeeklyComparison
            userId={user.uid}
            familyId={family.id!}
            weeksToShow={4}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.primaryAction]}
            onPress={() => router.push('/(tabs)/chores')}
          >
            <Ionicons name="checkmark-circle-outline" size={28} color="#ffffff" />
            <Text style={styles.actionCardTextPrimary}>View Chores</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowFamilySettings(true)}
          >
            <Ionicons name="people-outline" size={28} color="#be185d" />
            <Text style={styles.actionCardText}>Family Info</Text>
          </TouchableOpacity>
        </View>

        {/* Available Chores */}
        {unassignedChores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Chores</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/chores')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            {unassignedChores.slice(0, 2).map((chore) => (
              <View key={chore.id} style={styles.choreItem}>
                <View style={styles.choreInfo}>
                  <Text style={styles.choreTitle}>{chore.title}</Text>
                  <Text style={styles.choreDate}>
                    Due: {new Date(chore.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.chorePoints}>
                  <Text style={styles.chorePointsText}>{chore.points} pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            <View style={styles.adminGrid}>
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowManageMembers(true)}
              >
                <Ionicons name="people" size={24} color="#64748b" />
                <Text style={styles.adminCardText}>Members</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowChoreManagement(true)}
              >
                <Ionicons name="list" size={24} color="#64748b" />
                <Text style={styles.adminCardText}>Chores</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminCard}
                onPress={() => setShowFamilySettings(true)}
              >
                <Ionicons name="settings" size={24} color="#64748b" />
                <Text style={styles.adminCardText}>Settings</Text>
              </TouchableOpacity>
            </View>
            
            {/* Test Data Generator - Only in development */}
            {__DEV__ && (
              <View style={styles.testDataSection}>
                <TestDataGenerator />
              </View>
            )}
          </View>
        )}

        {/* Family Code */}
        <View style={styles.familyCodeSection}>
          <Text style={styles.familyCodeLabel}>Family Join Code</Text>
          <Text style={styles.familyCode}>{family.joinCode}</Text>
          <Text style={styles.familyCodeHint}>Share this code with family members</Text>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v2.03 • Build 172aefe</Text>
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

      {/* Completion Reward Modal */}
      <CompletionRewardModal
        visible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        choreTitle={completedChoreTitle}
        reward={completionReward}
      />

      {/* Detailed Chore View Modal */}
      <Modal
        visible={!!selectedChore}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeChoreModal}
      >
        <View style={styles.choreModalContainer}>
          <View style={styles.choreModalHeader}>
            <TouchableOpacity onPress={closeChoreModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#be185d" />
            </TouchableOpacity>
            <Text style={styles.choreModalTitle}>Chore Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          {selectedChore && (
            <ScrollView style={styles.choreModalContent}>
              <View style={styles.choreModalCard}>
                <Text style={styles.choreModalChoreTitle}>{selectedChore.title}</Text>
                
                {selectedChore.description && (
                  <View style={styles.choreModalSection}>
                    <Text style={styles.choreModalSectionTitle}>Description</Text>
                    <Text style={styles.choreModalDescription}>{selectedChore.description}</Text>
                  </View>
                )}
                
                <View style={styles.choreModalDetailsRow}>
                  <View style={styles.choreModalDetail}>
                    <Text style={styles.choreModalDetailLabel}>Points</Text>
                    <View style={styles.choreModalPointsBadge}>
                      <Text style={styles.choreModalPointsText}>{selectedChore.points} pts</Text>
                    </View>
                  </View>
                  
                  <View style={styles.choreModalDetail}>
                    <Text style={styles.choreModalDetailLabel}>Due Date</Text>
                    <Text style={styles.choreModalDetailValue}>
                      {new Date(selectedChore.dueDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.choreModalDetailTime}>
                      {new Date(selectedChore.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.choreModalDetailsRow}>
                  <View style={styles.choreModalDetail}>
                    <Text style={styles.choreModalDetailLabel}>Difficulty</Text>
                    <Text style={[styles.choreModalDetailValue, { 
                      color: selectedChore.difficulty === 'hard' ? '#ef4444' : 
                             selectedChore.difficulty === 'medium' ? '#f59e0b' : '#10b981' 
                    }]}>
                      {selectedChore.difficulty}
                    </Text>
                  </View>
                  
                  <View style={styles.choreModalDetail}>
                    <Text style={styles.choreModalDetailLabel}>Type</Text>
                    <Text style={styles.choreModalDetailValue}>{selectedChore.type}</Text>
                  </View>
                </View>
                
                {/* Comments Section - Placeholder for future implementation */}
                <View style={styles.choreModalSection}>
                  <Text style={styles.choreModalSectionTitle}>Add a Note (Optional)</Text>
                  <TextInput
                    style={styles.choreModalCommentInput}
                    placeholder="Add any notes about this chore completion..."
                    value={choreComment}
                    onChangeText={setChoreComment}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.choreModalCommentHint}>
                    Notes are for your reference and future feature enhancements
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
          
          {/* Action Buttons */}
          <View style={styles.choreModalActions}>
            <TouchableOpacity 
              style={styles.choreModalCancelButton}
              onPress={closeChoreModal}
            >
              <Text style={styles.choreModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.choreModalCompleteButton, completingChore && styles.choreModalButtonDisabled]}
              onPress={handleCompleteChore}
              disabled={completingChore}
            >
              {completingChore ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.choreModalCompleteText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#be185d',
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#831843',
    marginTop: 4,
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
    backgroundColor: '#be185d',
    borderColor: '#be185d',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  seeAllText: {
    color: '#be185d',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#be185d',
    paddingVertical: 32,
    fontSize: 17,
    fontWeight: '500',
    opacity: 0.7,
  },
  choreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 12,
    backgroundColor: '#fce7f3',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    color: '#831843',
  },
  choreDate: {
    fontSize: 15,
    color: '#be185d',
    fontWeight: '500',
    opacity: 0.8,
  },
  chorePoints: {
    backgroundColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chorePointsText: {
    color: '#065f46',
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
    backgroundColor: '#fce7f3',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    minWidth: 100,
    maxWidth: 110,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  adminCardText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#be185d',
  },
  familyCodeSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#bbf7d0',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  familyCodeLabel: {
    fontSize: 18,
    color: '#064e3b',
    marginBottom: 8,
    fontWeight: '600',
  },
  familyCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#022c22',
    letterSpacing: 4,
  },
  familyCodeHint: {
    fontSize: 16,
    color: '#047857',
    marginTop: 8,
    fontWeight: '500',
  },
  testDataSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 0,
  },
  versionText: {
    fontSize: 14,
    color: '#be185d',
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.6,
  },
  // Enhanced Chore Item Styles
  choreDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  choreActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choreArrow: {
    marginLeft: 4,
  },
  // Chore Modal Styles
  choreModalContainer: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  choreModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  choreModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  headerSpacer: {
    width: 24,
  },
  choreModalContent: {
    flex: 1,
    padding: 20,
  },
  choreModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  choreModalChoreTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 20,
    textAlign: 'center',
  },
  choreModalSection: {
    marginBottom: 24,
  },
  choreModalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#be185d',
    marginBottom: 12,
  },
  choreModalDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  choreModalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  choreModalDetail: {
    flex: 1,
    alignItems: 'center',
  },
  choreModalDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  choreModalDetailValue: {
    fontSize: 16,
    color: '#831843',
    fontWeight: '600',
  },
  choreModalDetailTime: {
    fontSize: 14,
    color: '#be185d',
    fontWeight: '500',
    marginTop: 2,
  },
  choreModalPointsBadge: {
    backgroundColor: '#a7f3d0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  choreModalPointsText: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: '700',
  },
  choreModalCommentInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#831843',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  choreModalCommentHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  choreModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  choreModalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  choreModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  choreModalCompleteButton: {
    flex: 2,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#be185d',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  choreModalCompleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  choreModalButtonDisabled: {
    opacity: 0.6,
  },
});