import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Text,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { getChores, completeChore } from '@/services/firestore';
import { Chore, ChoreStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';

type FilterType = 'all' | 'mine' | 'available' | 'completed';

export default function ChoresScreen() {
  const { user } = useAuth();
  const { family, currentMember } = useFamily();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('mine');

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

  const handleCompleteChore = async (choreId: string) => {
    try {
      const success = await completeChore(choreId);
      if (success) {
        // Update local state
        setChores(prevChores => 
          prevChores.map(chore => 
            chore.id === choreId 
              ? { ...chore, status: 'completed' as ChoreStatus, completedBy: user?.uid, completedAt: new Date().toISOString() }
              : chore
          )
        );
        
        if (Platform.OS === 'web') {
          window.alert('Chore completed! Points awarded.');
        }
      }
    } catch (error) {
      console.error('Error completing chore:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to complete chore');
      }
    }
  };

  const handleClaimChore = async (choreId: string) => {
    // TODO: Implement claim chore functionality
    console.log('Claiming chore:', choreId);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Ionicons name="checkbox-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No chores found</Text>
          </View>
        ) : (
          filteredChores.map((chore) => (
            <View key={chore.id} style={styles.choreCard}>
              <View style={styles.choreHeader}>
                <View style={styles.choreTypeIcon}>
                  <Ionicons 
                    name={getChoreTypeIcon(chore.type) as any} 
                    size={20} 
                    color="#64748b" 
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
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
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
                    <Ionicons name="person-outline" size={16} color="#6b7280" />
                    <Text style={styles.choreDetailText}>
                      {family?.members.find(m => m.uid === chore.assignedTo)?.name || 'Unknown'}
                    </Text>
                  </View>
                )}

                {chore.status === 'completed' && chore.completedAt && (
                  <View style={styles.choreDetailRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={[styles.choreDetailText, { color: '#10b981' }]}>
                      Completed {new Date(chore.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {chore.status === 'open' && (
                <View style={styles.choreActions}>
                  {chore.assignedTo === user?.uid ? (
                    <TouchableOpacity
                      style={[styles.choreActionButton, styles.completeButton]}
                      onPress={() => handleCompleteChore(chore.id!)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.completeButtonText}>Complete</Text>
                    </TouchableOpacity>
                  ) : !chore.assignedTo ? (
                    <TouchableOpacity
                      style={[styles.choreActionButton, styles.claimButton]}
                      onPress={() => handleClaimChore(chore.id!)}
                    >
                      <Ionicons name="hand-right" size={20} color="#3b82f6" />
                      <Text style={styles.claimButtonText}>Claim</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: '#e2e8f0',
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
    color: '#6b7280',
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
    color: '#9ca3af',
    marginTop: 16,
    fontWeight: '500',
  },
  choreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  choreHeaderInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  choreDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  chorePointsBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  chorePoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d97706',
  },
  chorePointsLabel: {
    fontSize: 10,
    color: '#d97706',
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
    color: '#6b7280',
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
    gap: 12,
    marginTop: 8,
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
    backgroundColor: '#10b981',
  },
  completeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  claimButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  claimButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
  },
});