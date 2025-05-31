import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdvancedChoreCard, InstructionSet, AgeGroup } from '../../types';

interface Props {
  advancedCard: AdvancedChoreCard;
  userAge?: number;
  visible: boolean;
  onClose: () => void;
  onStepComplete: (stepId: string) => void;
}

const InstructionViewer: React.FC<Props> = ({
  advancedCard,
  userAge,
  visible,
  onClose,
  onStepComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState<InstructionSet | null>(null);

  useEffect(() => {
    if (visible && advancedCard.instructions) {
      // Determine age group
      const ageGroup: AgeGroup = userAge && userAge <= 8 ? 'child' : 
                                 userAge && userAge <= 12 ? 'teen' : 'adult';
      
      // Get appropriate instructions
      const instructionSet = advancedCard.instructions[ageGroup] ||
                            advancedCard.instructions.adult ||
                            advancedCard.instructions.teen ||
                            advancedCard.instructions.child;
      
      setInstructions(instructionSet);
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
    }
  }, [visible, advancedCard, userAge]);

  const handleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    onStepComplete(stepId);

    // Auto-advance to next step
    if (instructions && currentStepIndex < instructions.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleStepUncomplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.delete(stepId);
    setCompletedSteps(newCompleted);
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'caution': return { icon: 'warning-outline', color: '#f59e0b' };
      case 'warning': return { icon: 'alert-circle-outline', color: '#ef4444' };
      case 'danger': return { icon: 'skull-outline', color: '#dc2626' };
      default: return { icon: 'information-circle-outline', color: '#6b7280' };
    }
  };

  if (!instructions) {
    return null;
  }

  const currentStep = instructions.steps[currentStepIndex];
  const progress = (completedSteps.size / instructions.steps.length) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Step-by-Step Instructions</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedSteps.size} of {instructions.steps.length} steps completed
          </Text>
        </View>

        {/* Safety Warnings */}
        {instructions.safetyWarnings.length > 0 && (
          <View style={styles.safetySection}>
            <Text style={styles.safetyTitle}>⚠️ Safety Information</Text>
            {instructions.safetyWarnings.map((warning, index) => {
              const { icon, color } = getSafetyIcon(warning.level);
              return (
                <View key={index} style={[styles.safetyWarning, { borderLeftColor: color }]}>
                  <Ionicons name={icon as any} size={16} color={color} />
                  <Text style={[styles.safetyText, { color }]}>{warning.message}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Step Content */}
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
          {currentStep && (
            <View style={styles.stepContainer}>
              {/* Step Header */}
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{currentStep.stepNumber}</Text>
                </View>
                <View style={styles.stepTitleContainer}>
                  <Text style={styles.stepTitle}>{currentStep.title}</Text>
                  {currentStep.estimatedMinutes && (
                    <Text style={styles.stepTime}>~{currentStep.estimatedMinutes} min</Text>
                  )}
                </View>
              </View>

              {/* Step Description */}
              <Text style={styles.stepDescription}>{currentStep.description}</Text>

              {/* Required Tools */}
              {currentStep.requiredTools && currentStep.requiredTools.length > 0 && (
                <View style={styles.toolsSection}>
                  <Text style={styles.toolsTitle}>🛠️ Tools Needed:</Text>
                  {currentStep.requiredTools.map((tool, index) => (
                    <Text key={index} style={styles.toolItem}>• {tool}</Text>
                  ))}
                </View>
              )}

              {/* Safety Note */}
              {currentStep.safetyNote && (
                <View style={styles.stepSafetyNote}>
                  <Ionicons name="shield-checkmark" size={16} color="#f59e0b" />
                  <Text style={styles.stepSafetyText}>{currentStep.safetyNote}</Text>
                </View>
              )}

              {/* Media Assets */}
              {currentStep.mediaAssets && currentStep.mediaAssets.length > 0 && (
                <View style={styles.mediaSection}>
                  {currentStep.mediaAssets.map((asset, index) => (
                    <View key={index} style={styles.mediaContainer}>
                      {asset.type === 'image' && (
                        <Image source={{ uri: asset.url }} style={styles.instructionImage} />
                      )}
                      {asset.caption && (
                        <Text style={styles.mediaCaption}>{asset.caption}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Step Completion */}
              <View style={styles.stepCompletion}>
                {completedSteps.has(currentStep.id) ? (
                  <TouchableOpacity 
                    style={styles.uncompleteButton}
                    onPress={() => handleStepUncomplete(currentStep.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.uncompleteText}>Step Completed</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={() => handleStepComplete(currentStep.id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                    <Text style={styles.completeText}>Mark as Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity 
            style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
            onPress={() => goToStep(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? "#d1d5db" : "#be185d"} />
            <Text style={[styles.navText, currentStepIndex === 0 && styles.navTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <View style={styles.stepIndicators}>
            {instructions.steps.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.stepIndicator,
                  index === currentStepIndex && styles.stepIndicatorActive,
                  completedSteps.has(instructions.steps[index].id) && styles.stepIndicatorCompleted
                ]}
                onPress={() => goToStep(index)}
              >
                {completedSteps.has(instructions.steps[index].id) ? (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                ) : (
                  <Text style={[
                    styles.stepIndicatorText,
                    index === currentStepIndex && styles.stepIndicatorTextActive
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[
              styles.navButton, 
              currentStepIndex === instructions.steps.length - 1 && styles.navButtonDisabled
            ]}
            onPress={() => goToStep(Math.min(instructions.steps.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === instructions.steps.length - 1}
          >
            <Text style={[
              styles.navText, 
              currentStepIndex === instructions.steps.length - 1 && styles.navTextDisabled
            ]}>Next</Text>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={currentStepIndex === instructions.steps.length - 1 ? "#d1d5db" : "#be185d"} 
            />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#f9a8d4',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#be185d',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    textAlign: 'center',
  },
  safetySection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 12,
  },
  safetyWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginVertical: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#be185d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  stepTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9f1239',
  },
  stepDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  toolsSection: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  toolItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
  stepSafetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  stepSafetyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  mediaSection: {
    marginBottom: 16,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  instructionImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  mediaCaption: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  stepCompletion: {
    alignItems: 'center',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#be185d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  uncompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  uncompleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#be185d',
    marginHorizontal: 4,
  },
  navTextDisabled: {
    color: '#d1d5db',
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  stepIndicatorActive: {
    backgroundColor: '#be185d',
  },
  stepIndicatorCompleted: {
    backgroundColor: '#10b981',
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  stepIndicatorTextActive: {
    color: '#ffffff',
  },
});

export default InstructionViewer;