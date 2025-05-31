import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chore, AdvancedChoreCard as AdvancedChoreCardType, QualityRating, EducationalFact, InspirationalQuote, AgeGroup } from '../../types';
import { choreCardService } from '../../services/choreCardService';
import { educationalContentService } from '../../services/educationalContentService';
import { UniversalIcon } from '../ui/UniversalIcon';
import QualityRatingInput from './QualityRatingInput';
import EducationalContent from './EducationalContent';
import AdvancedChoreCard from './AdvancedChoreCard';

interface Props {
  visible: boolean;
  chore: Chore | null;
  currentUserId: string;
  userAge?: number;
  onClose: () => void;
  onComplete?: (choreId: string, qualityData?: {
    qualityRating: QualityRating;
    satisfactionRating: number;
    comments?: string;
    photos?: string[];
  }) => void;
  onClaim?: (choreId: string) => void;
  onTakeover?: (choreId: string) => void;
  onRequestHelp?: (chore: Chore) => void;
  onProposeTrade?: (chore: Chore) => void;
  isCompleting?: boolean;
}

const ChoreDetailModal: React.FC<Props> = ({
  visible,
  chore,
  currentUserId,
  userAge,
  onClose,
  onComplete,
  onClaim,
  onTakeover,
  onRequestHelp,
  onProposeTrade,
  isCompleting = false
}) => {
  const [advancedCard, setAdvancedCard] = useState<AdvancedChoreCardType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQualityRating, setShowQualityRating] = useState(false);
  const [educationalFact, setEducationalFact] = useState<EducationalFact | null>(null);
  const [inspirationalQuote, setInspirationalQuote] = useState<InspirationalQuote | null>(null);

  useEffect(() => {
    if (visible && chore?.id) {
      loadAdvancedCard();
      loadEducationalContent();
    }
  }, [visible, chore?.id]);

  const loadAdvancedCard = async () => {
    if (!chore?.id) return;
    
    setLoading(true);
    try {
      const card = await choreCardService.getAdvancedCard(chore.id);
      setAdvancedCard(card);
    } catch (error) {
      console.error('Error loading advanced card:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEducationalContent = async () => {
    if (!chore) return;
    
    try {
      // Determine age group from userAge prop
      const ageGroup: AgeGroup = userAge && userAge <= 8 ? 'child' : 
                                 userAge && userAge <= 12 ? 'teen' : 'adult';

      // Load educational content for basic chores
      const [fact, quote] = await Promise.all([
        educationalContentService.getRandomFact(ageGroup, chore.type),
        educationalContentService.getRandomQuote(ageGroup, chore.type, 'encouraging')
      ]);

      setEducationalFact(fact);
      setInspirationalQuote(quote);
    } catch (error) {
      console.error('Error loading educational content:', error);
    }
  };

  const handleCompleteChore = () => {
    if (!chore?.id) return;

    if (advancedCard) {
      // Show quality rating interface for advanced chores
      setShowQualityRating(true);
    } else {
      // Complete basic chore immediately
      onComplete?.(chore.id);
    }
  };

  const handleQualitySubmit = (qualityRating: QualityRating, satisfactionRating: number, comments?: string, photos?: string[]) => {
    if (!chore?.id) return;
    
    onComplete?.(chore.id, {
      qualityRating,
      satisfactionRating,
      comments,
      photos
    });
    setShowQualityRating(false);
    onClose();
  };

  const handleAdvancedComplete = (qualityRating: QualityRating, satisfactionRating: number, comments?: string, photos?: string[]) => {
    handleQualitySubmit(qualityRating, satisfactionRating, comments, photos);
  };

  const handlePreferenceUpdate = (rating: number, notes?: string) => {
    // Handle preference updates
    console.log('Preference updated:', rating, notes);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getChoreTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return 'person-outline';
      case 'family': return 'people-outline';
      case 'pet': return 'paw-outline';
      case 'shared': return 'git-network-outline';
      case 'room': return 'home-outline';
      default: return 'checkbox-outline';
    }
  };

  const isAssignedToCurrentUser = chore?.assignedTo === currentUserId;
  const isUnassigned = !chore?.assignedTo;
  const isAssignedToOther = chore?.assignedTo && chore.assignedTo !== currentUserId;

  if (!chore) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <UniversalIcon name="close" size={24} color="#be185d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chore Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          {/* Use Advanced Card if available */}
          {advancedCard ? (
            <AdvancedChoreCard
              chore={chore}
              currentUserId={currentUserId}
              userAge={userAge}
              onComplete={handleAdvancedComplete}
              onPreferenceUpdate={handlePreferenceUpdate}
              isCompleting={showQualityRating}
              showFullCard={true}
            />
          ) : (
            /* Basic Chore Card */
            <View style={styles.choreCard}>
              {/* Header */}
              <View style={styles.choreHeader}>
                <View style={styles.choreTypeIcon}>
                  <UniversalIcon 
                    name={getChoreTypeIcon(chore.type) as any} 
                    size={24} 
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

              {/* Details */}
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
                    {chore.difficulty.charAt(0).toUpperCase() + chore.difficulty.slice(1)} difficulty
                  </Text>
                </View>

                {chore.assignedTo && (
                  <View style={styles.choreDetailRow}>
                    <UniversalIcon name="person-outline" size={16} color="#9f1239" />
                    <Text style={styles.choreDetailText}>
                      Assigned to: {chore.assignedTo === currentUserId ? 'You' : 'Family member'}
                    </Text>
                  </View>
                )}

                {chore.recurring?.enabled && (
                  <View style={styles.choreDetailRow}>
                    <UniversalIcon name="refresh-outline" size={16} color="#9f1239" />
                    <Text style={styles.choreDetailText}>
                      Repeats every {chore.recurring.frequencyDays} days
                    </Text>
                  </View>
                )}

                {chore.cooldownHours && (
                  <View style={styles.choreDetailRow}>
                    <UniversalIcon name="time-outline" size={16} color="#9f1239" />
                    <Text style={styles.choreDetailText}>
                      Cooldown: {chore.cooldownHours} hours
                    </Text>
                  </View>
                )}
              </View>

              {/* Educational Content for Basic Chores */}
              <EducationalContent 
                fact={educationalFact}
                quote={inspirationalQuote}
                onFactEngagement={() => educationalContentService.trackContentEngagement(
                  educationalFact?.id || '', 'fact', currentUserId
                )}
                onQuoteEngagement={() => educationalContentService.trackContentEngagement(
                  inspirationalQuote?.id || '', 'quote', currentUserId
                )}
              />

              {/* Quality Rating Section for Basic Chores */}
              {showQualityRating && !advancedCard && (
                <QualityRatingInput
                  onSubmit={handleQualitySubmit}
                  onPreferenceUpdate={handlePreferenceUpdate}
                  choreTitle={chore.title}
                />
              )}
            </View>
          )}

          {/* Action Buttons */}
          {chore.status === 'open' && (
            <View style={styles.actionButtons}>
              {isAssignedToCurrentUser && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={handleCompleteChore}
                  >
                    <UniversalIcon name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.completeButtonText}>Complete Chore</Text>
                  </TouchableOpacity>
                  
                  {onRequestHelp && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.helpButton]}
                      onPress={() => onRequestHelp(chore)}
                    >
                      <UniversalIcon name="help-circle" size={20} color="#8b5cf6" />
                      <Text style={styles.helpButtonText}>Need Help</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {isUnassigned && onClaim && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.claimButton]}
                  onPress={() => onClaim(chore.id!)}
                >
                  <UniversalIcon name="hand-right" size={20} color="#be185d" />
                  <Text style={styles.claimButtonText}>Claim Chore</Text>
                </TouchableOpacity>
              )}

              {isAssignedToOther && (
                <>
                  {onTakeover && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.takeoverButton]}
                      onPress={() => onTakeover(chore.id!)}
                    >
                      <UniversalIcon name="swap-horizontal" size={20} color="#f59e0b" />
                      <Text style={styles.takeoverButtonText}>Take Over</Text>
                    </TouchableOpacity>
                  )}
                  
                  {onProposeTrade && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.tradeButton]}
                      onPress={() => onProposeTrade(chore)}
                    >
                      <UniversalIcon name="git-compare" size={20} color="#06b6d4" />
                      <Text style={styles.tradeButtonText}>Propose Trade</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {/* Completed Status */}
          {chore.status === 'completed' && (
            <View style={styles.completedSection}>
              <UniversalIcon name="checkmark-circle" size={48} color="#10b981" />
              <Text style={styles.completedTitle}>Completed!</Text>
              {chore.completedAt && (
                <Text style={styles.completedDate}>
                  Finished on {new Date(chore.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fdf2f8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f9a8d4',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  choreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  choreHeaderInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#831843',
  },
  choreDescription: {
    fontSize: 16,
    color: '#9f1239',
    lineHeight: 22,
  },
  chorePointsBadge: {
    backgroundColor: '#be185d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  chorePoints: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  chorePointsLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  choreDetails: {
    gap: 12,
    marginBottom: 20,
  },
  choreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choreDetailText: {
    fontSize: 16,
    color: '#831843',
    fontWeight: '500',
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
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
  completedSection: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
    marginTop: 16,
    marginBottom: 8,
  },
  completedDate: {
    fontSize: 16,
    color: '#15803d',
    fontWeight: '500',
  },
});

export default ChoreDetailModal;