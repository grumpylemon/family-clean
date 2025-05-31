import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { QuestionnaireQuestion, QuestionnaireResponse, UserQuestionnaire } from '../../types';
import { questionnaireService } from '../../services/questionnaireService';
import { useColorScheme } from '../../hooks/useColorScheme';

interface QuestionnaireModalProps {
  isVisible: boolean;
  ageCategory: 'child' | 'teen' | 'adult';
  existingQuestionnaire?: UserQuestionnaire;
  onComplete: (questionnaire: UserQuestionnaire, xpReward: number) => void;
  onCancel: () => void;
}

export function QuestionnaireModal({
  isVisible,
  ageCategory,
  existingQuestionnaire,
  onComplete,
  onCancel
}: QuestionnaireModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{questionId: string; answer: string | number | string[]}>>([]);
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<string | number | string[] | null>(null);

  const styles = createStyles(isDark);

  useEffect(() => {
    if (isVisible) {
      initializeQuestionnaire();
    }
  }, [isVisible, ageCategory]);

  const initializeQuestionnaire = () => {
    const ageQuestions = questionnaireService.getQuestionsForAge(ageCategory);
    setQuestions(ageQuestions);
    setCurrentQuestionIndex(0);
    
    // If continuing existing questionnaire, load previous responses
    if (existingQuestionnaire?.responses) {
      const existingResponses = existingQuestionnaire.responses.map(r => ({
        questionId: r.questionId,
        answer: r.answer
      }));
      setResponses(existingResponses);
      
      // Find where to resume
      const progress = questionnaireService.getQuestionnaireProgress(existingQuestionnaire.responses, ageCategory);
      setCurrentQuestionIndex(progress.completed);
    } else {
      setResponses([]);
    }
    
    setCurrentAnswer(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string | number | string[]) => {
    setCurrentAnswer(answer);
  };

  const handleNext = () => {
    if (currentAnswer === null) {
      Alert.alert('Answer Required', 'Please select an answer before continuing.');
      return;
    }

    // Validate the answer
    const validation = questionnaireService.validateResponse(currentQuestion, currentAnswer);
    if (!validation.valid) {
      Alert.alert('Invalid Answer', validation.error);
      return;
    }

    // Update responses
    const newResponses = [...responses];
    const existingIndex = newResponses.findIndex(r => r.questionId === currentQuestion.id);
    
    if (existingIndex >= 0) {
      newResponses[existingIndex] = { questionId: currentQuestion.id, answer: currentAnswer };
    } else {
      newResponses.push({ questionId: currentQuestion.id, answer: currentAnswer });
    }
    
    setResponses(newResponses);

    if (isLastQuestion) {
      handleComplete(newResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Load previous answer
      const prevResponse = responses.find(r => r.questionId === questions[currentQuestionIndex - 1].id);
      setCurrentAnswer(prevResponse?.answer || null);
    }
  };

  const handleComplete = async (finalResponses: Array<{questionId: string; answer: string | number | string[]}>) => {
    setLoading(true);
    try {
      const result = await questionnaireService.processQuestionnaire(
        finalResponses.map(r => ({
          questionId: r.questionId,
          questionText: questions.find(q => q.id === r.questionId)?.questionText || '',
          answer: r.answer,
          category: questions.find(q => q.id === r.questionId)?.category || 'values'
        }))
      );
      
      const xpReward = 150 + (finalResponses.length * 5); // Base 150 + 5 per question
      onComplete(result, xpReward);
    } catch (error) {
      Alert.alert('Error', 'Failed to process questionnaire. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.answerType) {
      case 'multipleChoice':
        return renderMultipleChoice();
      case 'multiSelect':
        return renderMultiSelect();
      case 'scale':
        return renderScale();
      case 'openText':
        return renderOpenText();
      default:
        return null;
    }
  };

  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      {currentQuestion.options?.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            currentAnswer === option && styles.optionButtonSelected
          ]}
          onPress={() => handleAnswerSelect(option)}
        >
          <Text style={[
            styles.optionText,
            currentAnswer === option && styles.optionTextSelected
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMultiSelect = () => {
    const selectedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
    
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.multiSelectLabel}>Select all that apply:</Text>
        {currentQuestion.options?.map((option, index) => {
          const isSelected = selectedAnswers.includes(option);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected
              ]}
              onPress={() => {
                const newAnswers = isSelected
                  ? selectedAnswers.filter(a => a !== option)
                  : [...selectedAnswers, option];
                handleAnswerSelect(newAnswers);
              }}
            >
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderScale = () => {
    if (!currentQuestion.scaleRange) return null;
    
    const { min, max, labels } = currentQuestion.scaleRange;
    const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>{labels[0]}</Text>
          <Text style={styles.scaleLabel}>{labels[1]}</Text>
        </View>
        
        <View style={styles.scaleButtons}>
          {scaleValues.map(value => (
            <TouchableOpacity
              key={value}
              style={[
                styles.scaleButton,
                currentAnswer === value && styles.scaleButtonSelected
              ]}
              onPress={() => handleAnswerSelect(value)}
            >
              <Text style={[
                styles.scaleButtonText,
                currentAnswer === value && styles.scaleButtonTextSelected
              ]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderOpenText = () => (
    <View style={styles.textInputContainer}>
      <Text style={styles.textInputLabel}>Share your thoughts:</Text>
      {/* Note: For simplicity, treating open text as optional for now */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => handleAnswerSelect('No response')}
      >
        <Text style={styles.skipButtonText}>Skip this question</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {currentQuestionIndex + 1} of {questions.length}
      </Text>
    </View>
  );

  const renderNavigation = () => (
    <View style={styles.navigationContainer}>
      <TouchableOpacity
        style={[styles.navButton, styles.secondaryButton]}
        onPress={handlePrevious}
        disabled={currentQuestionIndex === 0}
      >
        <Text style={[
          styles.navButtonText,
          styles.secondaryButtonText,
          currentQuestionIndex === 0 && styles.disabledButtonText
        ]}>
          ← Previous
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, styles.primaryButton]}
        onPress={handleNext}
        disabled={currentAnswer === null || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isLastQuestion ? 'Complete' : 'Next →'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Get to Know You</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderProgress()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentQuestion && (
            <View style={styles.questionContainer}>
              <View style={styles.questionHeader}>
                <Text style={styles.categoryBadge}>
                  {questionnaireService.getQuestionCategories().find(c => c.id === currentQuestion.category)?.icon} {' '}
                  {questionnaireService.getQuestionCategories().find(c => c.id === currentQuestion.category)?.name}
                </Text>
              </View>
              
              <Text style={styles.questionText}>
                {currentQuestion.questionText}
              </Text>
              
              {renderQuestionContent()}
            </View>
          )}
        </ScrollView>

        {renderNavigation()}
      </View>
    </Modal>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#be185d',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  headerSpacer: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: isDark ? '#f9a8d4' : '#be185d',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    paddingVertical: 20,
  },
  questionHeader: {
    marginBottom: 16,
  },
  categoryBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#be185d',
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    lineHeight: 32,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  optionButtonSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  multiSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: isDark ? '#f9a8d4' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  scaleContainer: {
    alignItems: 'center',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  scaleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    flex: 1,
  },
  scaleButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  scaleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  scaleButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  scaleButtonTextSelected: {
    color: '#ffffff',
  },
  textInputContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  textInputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 20,
  },
  skipButton: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  navButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
  },
  secondaryButton: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#be185d',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: isDark ? '#f9a8d4' : '#be185d',
  },
  disabledButtonText: {
    color: isDark ? '#9f7086' : '#9f1239',
    opacity: 0.5,
  },
});