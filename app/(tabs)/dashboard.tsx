import { ChoreManagement } from '@/components/ChoreManagement';
import { CompletionRewardModal } from '@/components/CompletionRewardModal';
import { FamilySettings } from '@/components/FamilySettings';
import { FamilySetup } from '@/components/FamilySetup';
import { ManageMembers } from '@/components/ManageMembers';
import { TestDataGenerator } from '@/components/TestDataGenerator';
import WeeklyProgress from '@/components/WeeklyProgress';
import WeeklyComparison from '@/components/WeeklyComparison';
import { XPProgressBar } from '@/components/ui/XPProgressBar';
import { OfflineStatusIndicator } from '@/components/OfflineStatusIndicator';
import { useAuth, useFamily } from '@/hooks/useZustandHooks';
import { VERSION_STRING, VERSION_DISPLAY } from '@/constants/Version';
import { getChores, shouldResetWeeklyPoints, resetWeeklyPoints, completeChore } from '@/services/firestore';
import { Chore, CompletionReward } from '@/types';
import { UniversalIcon } from '@/components/ui/UniversalIcon';
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
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function DashboardScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const { family, loading: familyLoading, isAdmin, currentMember } = useFamily();
  const { colors, theme, isLoading: themeLoading } = useTheme();
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
    if (family?.id) {
      loadChores();
      checkWeeklyReset();
    }
  }, [family?.id]);

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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (!family) {
    return <FamilySetup onComplete={() => {
      // Navigate to home after family setup
      router.replace('/(tabs)');
    }} />;
  }

  const myChores = chores.filter(chore => 
    chore.assignedTo === user.uid && chore.status === 'open'
  );
  
  const unassignedChores = chores.filter(chore => 
    !chore.assignedTo && chore.status === 'open'
  );

  // Show loading while theme is initializing
  if (themeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#be185d" />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
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
      color: colors.primary,
      fontWeight: '500',
    },
    userName: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Platform.OS === 'web' ? 16 : 12,
      paddingHorizontal: Platform.OS === 'web' ? 20 : 12,
      backgroundColor: colors.primaryLight,
      borderRadius: Platform.OS === 'web' ? 25 : 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    logoutButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
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
      color: colors.textMuted,
      textAlign: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      minWidth: 100,
      maxWidth: 120,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    statIcon: {
      position: 'absolute',
      top: 8,
      right: 8,
      opacity: 0.7,
    },
    statValue: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textMuted,
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
      backgroundColor: colors.cardBackground,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      gap: 10,
      minWidth: 140,
      maxWidth: 160,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionCardText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    progressSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    sectionCard: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 20,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    choresSection: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    choresHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    choresList: {
      gap: 12,
    },
    choreCard: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    choreInfo: {
      flex: 1,
      gap: 4,
    },
    choreTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    choreDetails: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    choreDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    choreDetailText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    choreStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pointsBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    pointsText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 12,
    },
    familySection: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 16,
    },
    infoItem: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
    },
    choreModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    choreModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    closeButton: {
      padding: 8,
    },
    headerSpacer: {
      width: 40,
    },
    choreModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      flex: 1,
    },
    choreModalContent: {
      flex: 1,
      padding: 20,
    },
    choreModalCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 8,
      elevation: 3,
    },
    choreModalChoreTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
    },
    choreModalSection: {
      marginBottom: 20,
    },
    choreModalSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    choreModalDescription: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    choreModalDetailsRow: {
      flexDirection: 'row',
      gap: 20,
      marginBottom: 24,
    },
    choreModalDetail: {
      flex: 1,
    },
    choreModalDetailLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    choreModalPointsBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    choreModalPointsText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
    },
    choreModalDifficultyBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    choreModalDifficultyText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    choreModalDueDate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
    },
    choreModalDueDateText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    choreModalOverdueDate: {
      backgroundColor: '#fee2e2',
    },
    choreModalOverdueDateText: {
      color: '#dc2626',
    },
    choreModalAssignedTo: {
      marginBottom: 24,
    },
    choreModalAssignedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      gap: 12,
    },
    choreModalAssignedAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    choreModalAssignedInitials: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
    },
    choreModalAssignedName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    choreModalCommentSection: {
      marginBottom: 24,
    },
    choreModalCommentInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    choreModalActions: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    choreModalCancelButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    choreModalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textMuted,
    },
    choreModalCompleteButton: {
      flex: 2,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.success,
      alignItems: 'center',
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    choreModalCompleteText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
    },
    versionContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 20,
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    versionText: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    setupCard: {
      backgroundColor: colors.cardBackground,
      padding: 32,
      borderRadius: 24,
      alignItems: 'center',
      maxWidth: 400,
      width: '100%',
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
    setupIcon: {
      marginBottom: 20,
    },
    setupTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    setupDescription: {
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    setupButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    setupButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
    },
    sectionHeader: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    viewAllButton: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    choreArrow: {
      opacity: 0.6,
    },
    choreActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    choreItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    choreDate: {
      fontSize: 13,
      color: colors.textMuted,
    },
    choreDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    choreModalButtonDisabled: {
      opacity: 0.5,
    },
    choreModalCommentHint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Version Number */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>{VERSION_STRING}</Text>
      </View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{currentMember?.name || user.displayName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <UniversalIcon name="log-out-outline" size={20} color={colors.text} />
            {Platform.OS === 'web' && (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
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

        {/* Offline Status - Zustand Demo */}
        <OfflineStatusIndicator />

        {/* Level Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.xpCard}>
            <XPProgressBar 
              currentXP={user?.xp?.total || 0}
              size="medium"
            />
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
            <ActivityIndicator size="small" color={colors.primary} />
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
                    <UniversalIcon name="chevron-forward" size={20} color={colors.primary} style={styles.choreArrow} />
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

        {/* Quick Actions - Removed redundant buttons that are available in nav bar or admin page */}

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

        {/* Admin Tools and Family Code moved to Admin page */}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{VERSION_DISPLAY}</Text>
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
              <UniversalIcon name="close" size={24} color={colors.primary} />
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
                  <UniversalIcon name="checkmark-circle" size={20} color="#ffffff" />
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
