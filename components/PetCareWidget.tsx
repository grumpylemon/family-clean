import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { UniversalIcon } from './ui/UniversalIcon';
import { useFamily } from '../hooks/useZustandHooks';
import { Pet, Chore } from '../types';
import { getPetsByFamily, checkUrgentCareNeeded } from '../services/petService';
import { getChores } from '../services/firestore';
import { router } from 'expo-router';

interface PetCareWidgetProps {
  colors?: any; // Theme colors
  onPetPress?: (pet: Pet) => void;
}

export const PetCareWidget: React.FC<PetCareWidgetProps> = ({ 
  colors, 
  onPetPress 
}) => {
  const { family } = useFamily();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petChores, setPetChores] = useState<Chore[]>([]);
  const [urgentCare, setUrgentCare] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (family?.id) {
      loadPetData();
    }
  }, [family?.id]);

  const loadPetData = async () => {
    if (!family?.id) return;

    try {
      setLoading(true);
      
      // Load family pets
      const familyPets = await getPetsByFamily(family.id);
      setPets(familyPets);

      // Load pet chores (chores with type 'pet')
      const allChores = await getChores(family.id);
      const petChoresList = allChores.filter(chore => 
        chore.type === 'pet' && chore.status === 'open'
      );
      setPetChores(petChoresList);

      // Check for urgent care needs
      const urgentPets: Pet[] = [];
      for (const pet of familyPets) {
        const isUrgent = await checkUrgentCareNeeded(pet);
        if (isUrgent) {
          urgentPets.push(pet);
        }
      }
      setUrgentCare(urgentPets);

    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPetEmoji = (petType: string): string => {
    switch (petType) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'fish': return '🐠';
      case 'hamster': return '🐹';
      case 'rabbit': return '🐰';
      case 'reptile': return '🦎';
      default: return '🐾';
    }
  };

  const getNextFeedingTime = (pet: Pet): string => {
    // Find next feeding chore for this pet
    const feedingChore = petChores.find(chore => 
      chore.petId === pet.id && 
      chore.careCategory === 'feeding'
    );
    
    if (feedingChore) {
      const dueTime = new Date(feedingChore.dueDate);
      const now = new Date();
      const diffHours = Math.max(0, Math.floor((dueTime.getTime() - now.getTime()) / (1000 * 60 * 60)));
      
      if (diffHours === 0) return 'Due now';
      if (diffHours < 24) return `${diffHours}h`;
      return `${Math.floor(diffHours / 24)}d`;
    }
    
    return '—';
  };

  const getPetChoreCount = (petId: string): number => {
    return petChores.filter(chore => chore.petId === petId).length;
  };

  const handleViewAllPets = () => {
    router.push('/(tabs)/pets');
  };

  const handleViewPetChores = () => {
    router.push('/(tabs)/chores');
  };

  // If no pets, don't show the widget
  if (!family || pets.length === 0) {
    return null;
  }

  const safeColors = colors || {
    background: '#ffffff',
    text: '#831843',
    textMuted: '#9f1239',
    primary: '#be185d',
    accent: '#fdf2f8',
    cardBackground: '#ffffff',
    cardShadow: '#be185d',
  };

  return (
    <View style={[styles.container, { backgroundColor: safeColors.cardBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: safeColors.text }]}>🐾 Pet Care</Text>
          {urgentCare.length > 0 && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>{urgentCare.length} urgent</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleViewAllPets} style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color: safeColors.primary }]}>View All</Text>
          <UniversalIcon name="chevron-forward" size={16} color={safeColors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: safeColors.textMuted }]}>Loading pets...</Text>
        </View>
      ) : (
        <>
          {/* Pet Care Summary */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.totalPetsCard]}>
              <Text style={[styles.summaryNumber, { color: safeColors.primary }]}>{pets.length}</Text>
              <Text style={[styles.summaryLabel, { color: safeColors.textMuted }]}>Pets</Text>
            </View>
            <View style={[styles.summaryCard, styles.choresCard]}>
              <Text style={[styles.summaryNumber, { color: '#f59e0b' }]}>{petChores.length}</Text>
              <Text style={[styles.summaryLabel, { color: safeColors.textMuted }]}>Care Tasks</Text>
            </View>
            <View style={[styles.summaryCard, styles.urgentCard]}>
              <Text style={[styles.summaryNumber, { color: urgentCare.length > 0 ? '#ef4444' : '#10b981' }]}>
                {urgentCare.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: safeColors.textMuted }]}>Urgent</Text>
            </View>
          </View>

          {/* Pet List */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.petsList}
            contentContainerStyle={styles.petsListContent}
          >
            {pets.slice(0, 5).map((pet, index) => {
              const choreCount = getPetChoreCount(pet.id!);
              const nextFeeding = getNextFeedingTime(pet);
              const isUrgent = urgentCare.some(urgentPet => urgentPet.id === pet.id);
              
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petCard,
                    { backgroundColor: safeColors.accent },
                    isUrgent && styles.urgentPetCard
                  ]}
                  onPress={() => onPetPress?.(pet)}
                >
                  <View style={styles.petHeader}>
                    <Text style={styles.petEmoji}>{getPetEmoji(pet.type)}</Text>
                    {isUrgent && (
                      <View style={styles.urgentIndicator}>
                        <UniversalIcon name="warning" size={12} color="#ef4444" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.petName, { color: safeColors.text }]} numberOfLines={1}>
                    {pet.name}
                  </Text>
                  <View style={styles.petInfo}>
                    <Text style={[styles.petDetail, { color: safeColors.textMuted }]}>
                      {choreCount} tasks
                    </Text>
                    {nextFeeding !== '—' && (
                      <Text style={[styles.petDetail, { color: safeColors.textMuted }]}>
                        🍽️ {nextFeeding}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Actions */}
          {petChores.length > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: safeColors.primary }]}
              onPress={handleViewPetChores}
            >
              <UniversalIcon name="list" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>
                View {petChores.length} Pet Care Task{petChores.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  urgentBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  totalPetsCard: {
    backgroundColor: '#fdf2f8',
  },
  choresCard: {
    backgroundColor: '#fffbeb',
  },
  urgentCard: {
    backgroundColor: '#fef2f2',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  petsList: {
    marginBottom: 16,
  },
  petsListContent: {
    gap: 12,
  },
  petCard: {
    width: 110,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  urgentPetCard: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  petHeader: {
    position: 'relative',
    marginBottom: 8,
  },
  petEmoji: {
    fontSize: 32,
  },
  urgentIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 2,
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  petInfo: {
    alignItems: 'center',
    gap: 2,
  },
  petDetail: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});