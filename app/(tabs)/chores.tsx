import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
      case 'easy': return '#34A853';
      case 'medium': return '#FBBC04';
      case 'hard': return '#EA4335';
      default: return '#666';
    }
  };

  const filteredChores = getFilteredChores();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Chores</ThemedText>
      </ThemedView>

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
            <ThemedText style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </ThemedText>
            {tab.count > 0 && (
              <ThemedView style={[styles.filterBadge, filter === tab.key && styles.filterBadgeActive]}>
                <ThemedText style={[styles.filterBadgeText, filter === tab.key && styles.filterBadgeTextActive]}>
                  {tab.count}
                </ThemedText>
              </ThemedView>
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
          <ThemedView style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={48} color="#ccc" />
            <ThemedText style={styles.emptyText}>No chores found</ThemedText>
          </ThemedView>
        ) : (
          filteredChores.map((chore) => (
            <ThemedView key={chore.id} style={styles.choreCard}>
              <ThemedView style={styles.choreHeader}>
                <ThemedView style={styles.choreTypeIcon}>
                  <Ionicons 
                    name={getChoreTypeIcon(chore.type) as any} 
                    size={20} 
                    color="#666" 
                  />
                </ThemedView>
                <ThemedView style={styles.choreHeaderInfo}>
                  <ThemedText style={styles.choreTitle}>{chore.title}</ThemedText>
                  {chore.description && (
                    <ThemedText style={styles.choreDescription}>{chore.description}</ThemedText>
                  )}
                </ThemedView>
                <ThemedView style={styles.chorePointsBadge}>
                  <ThemedText style={styles.chorePoints}>{chore.points}</ThemedText>
                  <ThemedText style={styles.chorePointsLabel}>pts</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.choreDetails}>
                <ThemedView style={styles.choreDetailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <ThemedText style={styles.choreDetailText}>
                    Due: {new Date(chore.dueDate).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.choreDetailRow}>
                  <ThemedView 
                    style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(chore.difficulty) }]} 
                  />
                  <ThemedText style={styles.choreDetailText}>
                    {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)}
                  </ThemedText>
                </ThemedView>

                {chore.assignedTo && (
                  <ThemedView style={styles.choreDetailRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <ThemedText style={styles.choreDetailText}>
                      {family?.members.find(m => m.uid === chore.assignedTo)?.name || 'Unknown'}
                    </ThemedText>
                  </ThemedView>
                )}

                {chore.status === 'completed' && chore.completedAt && (
                  <ThemedView style={styles.choreDetailRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#34A853" />
                    <ThemedText style={[styles.choreDetailText, { color: '#34A853' }]}>
                      Completed {new Date(chore.completedAt).toLocaleDateString()}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>

              {/* Action Buttons */}
              {chore.status === 'open' && (
                <ThemedView style={styles.choreActions}>
                  {chore.assignedTo === user?.uid ? (
                    <TouchableOpacity
                      style={[styles.choreActionButton, styles.completeButton]}
                      onPress={() => handleCompleteChore(chore.id!)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <ThemedText style={styles.completeButtonText}>Complete</ThemedText>
                    </TouchableOpacity>
                  ) : !chore.assignedTo ? (
                    <TouchableOpacity
                      style={[styles.choreActionButton, styles.claimButton]}
                      onPress={() => handleClaimChore(chore.id!)}
                    >
                      <Ionicons name="hand-right" size={20} color="#4285F4" />
                      <ThemedText style={styles.claimButtonText}>Claim</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </ThemedView>
              )}
            </ThemedView>
          ))
        )}
      </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#fff',
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
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#4285F4',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#e0e0e0',
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
    color: '#666',
  },
  filterBadgeTextActive: {
    color: '#fff',
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
    color: '#999',
    marginTop: 16,
  },
  choreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  choreHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  choreTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  choreHeaderInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  choreDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  chorePointsBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  chorePoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  chorePointsLabel: {
    fontSize: 10,
    color: '#4285F4',
  },
  choreDetails: {
    gap: 8,
    marginBottom: 12,
  },
  choreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choreDetailText: {
    fontSize: 14,
    color: '#666',
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
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#34A853',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#E8F0FE',
  },
  claimButtonText: {
    color: '#4285F4',
    fontWeight: '600',
  },
});