import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chore, AdvancedChoreCard as AdvancedChoreCardType, EducationalFact, InspirationalQuote, AgeGroup } from '../../types';
import { choreCardService } from '../../services/choreCardService';
import { educationalContentService } from '../../services/educationalContentService';
import InstructionViewer from './InstructionViewer';
import PerformanceHistory from './PerformanceHistory';
import CertificationBadge from './CertificationBadge';
import QualityRatingInput from './QualityRatingInput';
import EducationalContent from './EducationalContent';

interface Props {
  chore: Chore;
  currentUserId: string;
  userAge?: number;
  onComplete: (qualityRating: any, satisfactionRating: number, comments?: string, photos?: string[]) => void;
  onPreferenceUpdate: (rating: number, notes?: string) => void;
  isCompleting?: boolean;
  showFullCard?: boolean;
}

const AdvancedChoreCard: React.FC<Props> = ({
  chore,
  currentUserId,
  userAge,
  onComplete,
  onPreferenceUpdate,
  isCompleting = false,
  showFullCard = false
}) => {
  const [advancedCard, setAdvancedCard] = useState<AdvancedChoreCardType | null>(null);
  const [educationalFact, setEducationalFact] = useState<EducationalFact | null>(null);
  const [inspirationalQuote, setInspirationalQuote] = useState<InspirationalQuote | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(showFullCard);

  useEffect(() => {
    loadAdvancedCardData();
  }, [chore.id]);

  const loadAdvancedCardData = async () => {
    try {
      setLoading(true);
      
      // Load advanced card data
      const cardData = await choreCardService.getAdvancedCard(chore.id!);
      setAdvancedCard(cardData);

      // Determine age group
      const ageGroup: AgeGroup = userAge && userAge <= 8 ? 'child' : 
                                 userAge && userAge <= 12 ? 'teen' : 'adult';

      // Load educational content
      const [fact, quote] = await Promise.all([
        educationalContentService.getRandomFact(ageGroup, chore.type),
        educationalContentService.getRandomQuote(ageGroup, chore.type, 'encouraging')
      ]);

      setEducationalFact(fact);
      setInspirationalQuote(quote);
    } catch (error) {
      console.error('Error loading advanced card data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstructionView = () => {
    setShowInstructions(true);
    if (advancedCard) {
      choreCardService.trackInstructionUsage(chore.id!, currentUserId);
    }
  };

  const handleCompletionSubmit = (qualityRating: any, satisfactionRating: number, comments?: string, photos?: string[]) => {
    // Record detailed completion data
    const completionData = {
      choreId: chore.id!,
      userId: currentUserId,
      qualityRating,
      satisfactionRating,
      timeToComplete: chore.estimatedDuration || 30, // Would track actual time in full implementation
      comments: comments || '',
      photos: photos || [],
      pointsEarned: chore.points,
      xpEarned: chore.xpReward || chore.points
    };

    choreCardService.recordCompletion(completionData);
    onComplete(qualityRating, satisfactionRating, comments, photos);
  };

  const handlePreferenceUpdate = (rating: number, notes?: string) => {
    choreCardService.updateChorePreference(currentUserId, chore.id!, rating, notes);
    onPreferenceUpdate(rating, notes);
  };

  const getDifficultyColor = () => {
    switch (chore.difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPointsColor = () => {
    if (chore.points >= 50) return '#be185d';
    if (chore.points >= 25) return '#f59e0b';
    return '#10b981';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading advanced card...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Card Header */}
      <TouchableOpacity 
        style={styles.cardHeader}
        onPress={() => setExpandedCard(!expandedCard)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.choreTitle}>{chore.title}</Text>
            {advancedCard && (
              <View style={styles.advancedBadge}>
                <Ionicons name="star" size={12} color="#be185d" />
                <Text style={styles.advancedText}>Advanced</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metadataRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
              <Text style={styles.difficultyText}>{chore.difficulty}</Text>
            </View>
            <View style={[styles.pointsBadge, { backgroundColor: getPointsColor() }]}>
              <Text style={styles.pointsText}>{chore.points} pts</Text>
            </View>
            {chore.estimatedDuration && (
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={12} color="#6b7280" />
                <Text style={styles.timeText}>{chore.estimatedDuration}m</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          <Ionicons 
            name={expandedCard ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#be185d" 
          />
        </View>
      </TouchableOpacity>

      {/* Certification Status */}
      {advancedCard?.certification?.required && (
        <CertificationBadge 
          choreId={chore.id!}
          userId={currentUserId}
          certification={advancedCard.certification}
        />
      )}

      {/* Expanded Content */}
      {expandedCard && (
        <View style={styles.expandedContent}>
          {/* Description */}
          {chore.description && (
            <Text style={styles.description}>{chore.description}</Text>
          )}

          {/* Educational Content */}
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {advancedCard && (
              <TouchableOpacity 
                style={styles.instructionButton}
                onPress={handleInstructionView}
              >
                <Ionicons name="list-outline" size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Instructions</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.performanceButton}
              onPress={() => setShowPerformance(true)}
            >
              <Ionicons name="analytics-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Quality Rating Input (when completing) */}
          {isCompleting && (
            <QualityRatingInput 
              onSubmit={handleCompletionSubmit}
              onPreferenceUpdate={handlePreferenceUpdate}
              choreTitle={chore.title}
            />
          )}
        </View>
      )}

      {/* Instruction Modal */}
      {showInstructions && advancedCard && (
        <InstructionViewer 
          advancedCard={advancedCard}
          userAge={userAge}
          visible={showInstructions}
          onClose={() => setShowInstructions(false)}
          onStepComplete={(stepId) => {
            choreCardService.trackInstructionUsage(chore.id!, currentUserId, stepId);
          }}
        />
      )}

      {/* Performance History Modal */}
      {showPerformance && (
        <PerformanceHistory 
          choreId={chore.id!}
          userId={currentUserId}
          choreTitle={chore.title}
          visible={showPerformance}
          onClose={() => setShowPerformance(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#9f1239',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    flex: 1,
  },
  advancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbcfe8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  advancedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#be185d',
    marginLeft: 3,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 3,
  },
  headerRight: {
    marginLeft: 16,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  instructionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#be185d',
    paddingVertical: 12,
    borderRadius: 16,
  },
  performanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9f1239',
    paddingVertical: 12,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
});

export default AdvancedChoreCard;