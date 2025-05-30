import { useAuth, useFamily } from '@/hooks/useZustandHooks';
import { completeChore, getChores, claimChore, takeoverChore } from '@/services/firestore';
import { Chore, ChoreStatus, CompletionReward } from '@/types';
import { CompletionRewardModal } from '@/components/CompletionRewardModal';
import ChoreTakeoverModal from '@/components/ChoreTakeoverModal';
import { UniversalIcon } from '@/components/ui/UniversalIcon';
import { createHelpRequest, createTradeProposal } from '@/services/collaborationService';
import { useFamilyStore } from '@/stores/hooks';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';

type FilterType = 'all' | 'mine' | 'available' | 'completed';
type MainTabType = 'active' | 'history';

export default function ChoresScreen() {
  const { user } = useAuth();
  const { family, currentMember, refreshFamily } = useFamily();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('mine');
  const [mainTab, setMainTab] = useState<MainTabType>('active');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [completionReward, setCompletionReward] = useState<CompletionReward | null>(null);
  const [completedChoreTitle, setCompletedChoreTitle] = useState('');
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [selectedChoreForTakeover, setSelectedChoreForTakeover] = useState<Chore | null>(null);
  
  const { checkTakeoverEligibility } = useFamilyStore((state) => state.chores);

  useEffect(() => {
    if (family) {
      loadChores();
    }
  }, [family]);

  const loadChores = async () => {
    if (!family) return;
    
    try {
      const familyChores = await getChores(family.id!);
      setChores(familyChores);
    } catch (error) {
      console.error('Error loading chores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isChoreLocked = (chore: Chore) => {
    if (!chore.lockedUntil) return false;
    const lockedUntil = new Date(chore.lockedUntil);
    return lockedUntil > new Date();
  };

  const handleCompleteChore = async (choreId: string) => {
    try {
      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;

      const result = await completeChore(choreId);
      
      if (result.success && result.reward) {
        // Update chores list
        setChores(prevChores => 
          prevChores.map(c => 
            c.id === choreId 
              ? { ...c, status: 'completed' as ChoreStatus, completedBy: user?.uid, completedAt: new Date().toISOString() }
              : c
          )
        );

        // Show reward modal with celebration
        setCompletedChoreTitle(chore.title);
        setCompletionReward(result.reward);
        setShowRewardModal(true);

        // Reload chores and refresh family data to update points
        // Give Firebase time to update before refreshing
        setTimeout(async () => {
          await loadChores();
          // Force refresh family data to update currentMember points
          await refreshFamily();
          console.log('[ChoresScreen] Refreshed family data after chore completion');
        }, 2000); // Increased delay to ensure Firebase has updated
      } else if (!result.success && result.error) {
        // Show error message
        if (Platform.OS === 'android') {
          ToastAndroid.show(result.error, ToastAndroid.LONG);
        } else {
          Alert.alert('Cannot Complete Chore', result.error);
        }
      }
    } catch (error) {
      console.error('Error completing chore:', error);
      const errorMessage = 'Failed to complete chore. Please try again.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleClaimChore = async (choreId: string) => {
    if (!user || !currentFamily) return;

    try {
      const displayName = user.displayName || user.email || 'User';
      await claimChore(choreId, user.uid, displayName);
      
      // Refresh chores list
      await loadChores();
      
      const successMessage = 'Chore claimed successfully!';
      if (Platform.OS === 'android') {
        ToastAndroid.show(successMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', successMessage);
      }
    } catch (error) {
      console.error('Error claiming chore:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim chore. Please try again.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleTakeoverChore = async (choreId: string) => {
    if (!user || !family) return;

    // Find the chore to get assignee info
    const chore = chores.find(c => c.id === choreId);
    if (!chore || !chore.assignedTo) return;

    // Check if takeover is eligible
    const { eligible, reason } = checkTakeoverEligibility(chore);
    
    if (!eligible) {
      Alert.alert('Cannot Take Over', reason || 'This chore cannot be taken over at this time.');
      return;
    }

    // Show takeover modal
    setSelectedChoreForTakeover(chore);
    setShowTakeoverModal(true);
  };

  const handleTakeoverComplete = async () => {
    // Refresh chores after takeover
    await loadChores();
  };

  const handleRequestHelp = (chore: Chore) => {
    if (!user || !family) return;
    
    Alert.prompt(
      'Request Help',
      `What kind of help do you need with "${chore.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Request',
          onPress: async (description) => {
            try {
              if (!description || description.trim() === '') {
                Alert.alert('Error', 'Please describe what help you need');
                return;
              }
              
              await createHelpRequest(chore.id!, chore.title, {
                familyId: family.id!,
                type: 'assistance',
                urgency: 'medium',
                description: description.trim(),
                pointsSplit: 30, // Default 30% to helper
                xpSplit: 30,
              });
              
              const successMessage = 'Help request sent to family members!';
              if (Platform.OS === 'android') {
                ToastAndroid.show(successMessage, ToastAndroid.SHORT);
              } else {
                Alert.alert('Success', successMessage);
              }
            } catch (error) {
              console.error('Error creating help request:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to send help request';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleProposeTradeFor = (targetChore: Chore) => {
    if (!user || !family) return;
    
    // Find chores that the current user has assigned to them that they could offer
    const myChores = chores.filter(c => c.assignedTo === user.uid && c.status === 'open');
    
    if (myChores.length === 0) {
      Alert.alert('No Chores to Trade', 'You need to have assigned chores to propose a trade');
      return;
    }
    
    // For now, just show the first chore as a simple trade proposal
    const myChore = myChores[0];
    
    Alert.alert(
      'Propose Trade',
      `Do you want to offer "${myChore.title}" (${myChore.points} pts) in exchange for "${targetChore.title}" (${targetChore.points} pts)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Propose Trade',
          onPress: async () => {
            try {
              const targetMember = family.members.find(m => m.uid === targetChore.assignedTo);
              
              await createTradeProposal(
                {
                  receiverId: targetChore.assignedTo!,
                  receiverName: targetMember?.name || 'Unknown',
                  familyId: family.id!,
                },
                [myChore], // offered chores
                [targetChore] // requested chores
              );
              
              const successMessage = `Trade proposal sent to ${targetMember?.name}!`;
              if (Platform.OS === 'android') {
                ToastAndroid.show(successMessage, ToastAndroid.SHORT);
              } else {
                Alert.alert('Success', successMessage);
              }
            } catch (error) {
              console.error('Error creating trade proposal:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to send trade proposal';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const getFilteredChores = () => {
    switch (filter) {
      case 'mine':
        return chores.filter(c => c.assignedTo === user?.uid && c.status === 'open');
      case 'available':
        return chores.filter(c => !c.assignedTo && c.status === 'open');
      case 'completed':
        return chores.filter(c => c.status === 'completed');
      case 'all':
      default:
        return chores;
    }
  };

  const getUserCompletedChores = () =>
    chores.filter(c => c.status === 'completed' && c.completedBy === user?.uid);

  const getChoreTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return 'person-outline';
      case 'family': return 'people-outline';
      case 'pet': return 'paw-outline';
      case 'shared': return 'git-network-outline';
      default: return 'checkbox-outline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredChores = getFilteredChores();

  // Calculate weekly points progress
  const weeklyPoints = currentMember?.points?.weekly || 0;
  const weeklyTarget = 100;
  const weeklyProgress = Math.min(weeklyPoints / weeklyTarget, 1);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#be185d" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Tab Bar */}
      <View style={styles.mainTabBar}>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'active' && styles.mainTabActive]}
          onPress={() => setMainTab('active')}
        >
          <Text style={[styles.mainTabText, mainTab === 'active' && styles.mainTabTextActive]}>Active Chores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'history' && styles.mainTabActive]}
          onPress={() => setMainTab('history')}
        >
          <Text style={[styles.mainTabText, mainTab === 'history' && styles.mainTabTextActive]}>Chore History</Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'active' ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chores</Text>
          </View>

          {/* Filter Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {[
              { key: 'mine', label: 'My Chores', count: chores.filter(c => c.assignedTo === user?.uid && c.status === 'open').length },
              { key: 'available', label: 'Available', count: chores.filter(c => !c.assignedTo && c.status === 'open').length },
              { key: 'completed', label: 'Completed', count: chores.filter(c => c.status === 'completed').length },
              { key: 'all', label: 'All', count: chores.length },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
                onPress={() => setFilter(tab.key as FilterType)}
              >
                <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.filterBadge, filter === tab.key && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, filter === tab.key && styles.filterBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chores List */}
          <ScrollView 
            style={styles.choresList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadChores();
                }}
              />
            }
          >
            {filteredChores.length === 0 ? (
              <View style={styles.emptyState}>
                <UniversalIcon name="checkbox-outline" size={48} color="#f9a8d4" />
                <Text style={styles.emptyText}>No chores found</Text>
              </View>
            ) : (
              filteredChores.map((chore) => {
                const locked = isChoreLocked(chore);
                return (
                  <View key={chore.id} style={styles.choreCard}>
                    <View style={styles.choreHeader}>
                      <View style={styles.choreTypeIcon}>
                        <UniversalIcon 
                          name={getChoreTypeIcon(chore.type) as any} 
                          size={20} 
                          color="#be185d" 
                        />
                      </View>
                      <View style={styles.choreHeaderInfo}>
                        <Text style={styles.choreTitle}>{chore.title}</Text>
                        {chore.description && (
                          <Text style={styles.choreDescription}>{chore.description}</Text>
                        )}
                      </View>
                      <View style={styles.chorePointsBadge}>
                        <Text style={styles.chorePoints}>{chore.points}</Text>
                        <Text style={styles.chorePointsLabel}>pts</Text>
                      </View>
                    </View>

                    <View style={styles.choreDetails}>
                      <View style={styles.choreDetailRow}>
                        <UniversalIcon name="calendar-outline" size={16} color="#9f1239" />
                        <Text style={styles.choreDetailText}>
                          Due: {new Date(chore.dueDate).toLocaleDateString()}
                        </Text>
                      </View>

                      <View style={styles.choreDetailRow}>
                        <View 
                          style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(chore.difficulty) }]} 
                        />
                        <Text style={styles.choreDetailText}>
                          {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)}
                        </Text>
                      </View>

                      {chore.assignedTo && (
                        <View style={styles.choreDetailRow}>
                          <UniversalIcon name="person-outline" size={16} color="#9f1239" />
                          <Text style={styles.choreDetailText}>
                            {family?.members.find(m => m.uid === chore.assignedTo)?.name || 'Unknown'}
                            {chore.takenOverBy && (
                              <Text style={{ color: '#f59e0b' }}> (taken over)</Text>
                            )}
                          </Text>
                        </View>
                      )}

                      {chore.originalAssignee && chore.originalAssignee !== chore.assignedTo && (
                        <View style={styles.choreDetailRow}>
                          <UniversalIcon name="time-outline" size={16} color="#f59e0b" />
                          <Text style={[styles.choreDetailText, { color: '#f59e0b' }]}>
                            Originally: {family?.members.find(m => m.uid === chore.originalAssignee)?.name || 'Unknown'}
                          </Text>
                        </View>
                      )}

                      {chore.status === 'completed' && chore.completedAt && (
                        <View style={styles.choreDetailRow}>
                          <UniversalIcon name="checkmark-circle" size={16} color="#10b981" />
                          <Text style={[styles.choreDetailText, { color: '#10b981' }]}>
                            Completed {new Date(chore.completedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {locked && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <UniversalIcon name="lock-closed" size={16} color="#ef4444" />
                        <Text style={{ color: '#ef4444', marginLeft: 4 }}>
                          Locked until {new Date(chore.lockedUntil!).toLocaleString()}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              'Chore Locked',
                              'This chore is in cooldown and cannot be completed until the unlock time. Cooldown ensures chores are fairly distributed and prevents rapid repeats.'
                            )
                          }
                          style={{ marginLeft: 6 }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <UniversalIcon name="information-circle-outline" size={18} color="#be185d" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Action Buttons */}
                    {chore.status === 'open' && !locked && (
                      <View style={styles.choreActions}>
                        {chore.assignedTo === user?.uid ? (
                          <>
                            <TouchableOpacity
                              style={[styles.choreActionButton, styles.completeButton]}
                              onPress={() => handleCompleteChore(chore.id!)}
                            >
                              <UniversalIcon name="checkmark-circle" size={20} color="#fff" />
                              <Text style={styles.completeButtonText}>Complete</Text>
                            </TouchableOpacity>
                            {family?.collaborationSettings?.helpRequestsEnabled && (
                              <TouchableOpacity
                                style={[styles.choreActionButton, styles.helpButton]}
                                onPress={() => handleRequestHelp(chore)}
                              >
                                <UniversalIcon name="help-circle" size={20} color="#8b5cf6" />
                                <Text style={styles.helpButtonText}>Need Help</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : !chore.assignedTo ? (
                          <TouchableOpacity
                            style={[styles.choreActionButton, styles.claimButton]}
                            onPress={() => handleClaimChore(chore.id!)}
                          >
                            <UniversalIcon name="hand-right" size={20} color="#be185d" />
                            <Text style={styles.claimButtonText}>Claim</Text>
                          </TouchableOpacity>
                        ) : chore.assignedTo !== user?.uid ? (
                          <>
                            <TouchableOpacity
                              style={[styles.choreActionButton, styles.takeoverButton]}
                              onPress={() => handleTakeoverChore(chore.id!)}
                            >
                              <UniversalIcon name="swap-horizontal" size={20} color="#f59e0b" />
                              <Text style={styles.takeoverButtonText}>Take Over</Text>
                            </TouchableOpacity>
                            {family?.collaborationSettings?.tradeProposalsEnabled && (
                              <TouchableOpacity
                                style={[styles.choreActionButton, styles.tradeButton]}
                                onPress={() => handleProposeTradeFor(chore)}
                              >
                                <UniversalIcon name="git-compare" size={20} color="#06b6d4" />
                                <Text style={styles.tradeButtonText}>Trade</Text>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView style={styles.choresList}>
          {getUserCompletedChores().length === 0 ? (
            <View style={styles.emptyState}>
              <UniversalIcon name="checkmark-done-outline" size={48} color="#f9a8d4" />
              <Text style={styles.emptyText}>No completed chores yet</Text>
            </View>
          ) : (
            getUserCompletedChores()
              .sort((a, b) => (b.completedAt && a.completedAt ? new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() : 0))
              .map((chore) => (
                <View key={chore.id} style={styles.choreCard}>
                  <View style={styles.choreHeader}>
                    <UniversalIcon name={getChoreTypeIcon(chore.type) as any} size={20} color="#be185d" style={{ marginRight: 8 }} />
                    <View style={styles.choreHeaderInfo}>
                      <Text style={styles.choreTitle}>{chore.title}</Text>
                      <Text style={styles.choreDescription}>{chore.description}</Text>
                    </View>
                    <View style={styles.chorePointsBadge}>
                      <Text style={styles.chorePoints}>{chore.points}</Text>
                      <Text style={styles.chorePointsLabel}>pts</Text>
                    </View>
                  </View>
                  <View style={styles.choreDetails}>
                    <View style={styles.choreDetailRow}>
                      <UniversalIcon name="calendar-outline" size={16} color="#9f1239" />
                      <Text style={styles.choreDetailText}>
                        Completed: {chore.completedAt ? new Date(chore.completedAt).toLocaleString() : '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
          )}
        </ScrollView>
      )}

      {/* Completion Reward Modal */}
      <CompletionRewardModal
        visible={showRewardModal}
        reward={completionReward}
        choreTitle={completedChoreTitle}
        onClose={() => {
          setShowRewardModal(false);
          setCompletionReward(null);
          setCompletedChoreTitle('');
        }}
      />
      
      {/* Chore Takeover Modal */}
      <ChoreTakeoverModal
        visible={showTakeoverModal}
        chore={selectedChoreForTakeover}
        onClose={() => {
          setShowTakeoverModal(false);
          setSelectedChoreForTakeover(null);
        }}
        onTakeover={handleTakeoverComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  header: {
    backgroundColor: '#fdf2f8',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#831843',
  },
  filterContainer: {
    backgroundColor: '#fdf2f8',
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    gap: 6,
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  filterTabActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: '#fbcfe8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#831843',
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  choresList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9f1239',
    marginTop: 16,
    fontWeight: '500',
  },
  choreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  choreHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  choreTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  choreHeaderInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#831843',
  },
  choreDescription: {
    fontSize: 14,
    color: '#9f1239',
    lineHeight: 20,
  },
  chorePointsBadge: {
    backgroundColor: '#be185d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  chorePoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  chorePointsLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  choreDetails: {
    gap: 10,
    marginBottom: 16,
  },
  choreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choreDetailText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  choreActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  choreActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#be185d',
  },
  completeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  claimButton: {
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  claimButtonText: {
    color: '#be185d',
    fontWeight: '600',
    fontSize: 16,
  },
  takeoverButton: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  takeoverButtonText: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 16,
  },
  helpButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  helpButtonText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 16,
  },
  tradeButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  tradeButtonText: {
    color: '#06b6d4',
    fontWeight: '600',
    fontSize: 16,
  },
  mainTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  mainTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  mainTabActive: {
    borderBottomColor: '#be185d',
    backgroundColor: '#fdf2f8',
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9f1239',
  },
  mainTabTextActive: {
    color: '#be185d',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
  },
  progressBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#be185d',
  },
});