/**
 * AI Assistant Component for Enhanced Bulk Operations
 * Provides a conversational interface for natural language bulk operation requests
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { UniversalIcon } from './ui/UniversalIcon';
import { Toast } from './ui/Toast';
import { naturalLanguageProcessor } from '../services/naturalLanguageProcessor';
import { conflictDetectionService } from '../services/conflictDetectionService';
import { familyImpactAnalyzer } from '../services/familyImpactAnalyzer';
import { executeBulkOperation } from '../services/templateService';
import { geminiAIService } from '../services/geminiAIService';
import { useFamily, useAuth } from '../hooks/useZustandHooks';
import { 
  NLPParseResult, 
  EnhancedBulkOperation, 
  AIRequestContext,
  ConflictAnalysis,
  FamilyImpactAssessment 
} from '../types/ai';
import { Chore } from '../types';

interface AIAssistantProps {
  visible: boolean;
  onClose: () => void;
  selectedChores: Chore[];
  onOperationComplete: (operation: string, affectedCount: number) => void;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    parseResult?: NLPParseResult;
    conflictAnalysis?: ConflictAnalysis;
    impactAssessment?: FamilyImpactAssessment;
    operation?: EnhancedBulkOperation;
  };
}

export function AIAssistant({ 
  visible, 
  onClose, 
  selectedChores, 
  onOperationComplete 
}: AIAssistantProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { family } = useFamily();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<EnhancedBulkOperation | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      checkAIAvailability();
    }
  }, [visible, family?.id]);

  useEffect(() => {
    if (visible && aiAvailable !== null) {
      initializeConversation();
    }
  }, [visible, selectedChores.length, aiAvailable]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const checkAIAvailability = async () => {
    if (!family?.id) {
      setAiAvailable(false);
      setIsCheckingAI(false);
      return;
    }

    try {
      const available = await geminiAIService.isAvailable(family.id);
      setAiAvailable(available);
    } catch (error) {
      console.error('Error checking AI availability:', error);
      setAiAvailable(false);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const initializeConversation = () => {
    let welcomeMessage: ConversationMessage;

    if (aiAvailable === false) {
      welcomeMessage = {
        id: generateMessageId(),
        type: 'system',
        content: `🤖 AI Assistant Not Available\n\nThe AI assistant requires your family to configure Google Gemini API access in Settings → Admin Panel → AI Integration.\n\nFor now, I can help with basic bulk operations using our built-in automation.`,
        timestamp: new Date()
      };
    } else {
      welcomeMessage = {
        id: generateMessageId(),
        type: 'assistant',
        content: selectedChores.length > 0 
          ? `🤖 Hello! I can help you manage your ${selectedChores.length} selected chore${selectedChores.length === 1 ? '' : 's'} using AI-powered natural language processing.\n\nTry saying things like:\n• "Assign all kitchen chores to Sarah"\n• "Move these to tomorrow morning"\n• "Increase points by 25%"\n• "Reschedule to weekend"\n\n✨ Powered by your family's Google Gemini AI`
          : `🤖 Hello! I'm your AI assistant for bulk chore operations. What would you like to do today?\n\nYou can ask me to:\n• Create multiple chores\n• Modify existing chores\n• Reassign responsibilities\n• Optimize your family's schedule\n\n✨ Powered by your family's Google Gemini AI`,
        timestamp: new Date()
      };
    }
    
    setMessages([welcomeMessage]);
    setCurrentOperation(null);
    setAwaitingConfirmation(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    const userMessage: ConversationMessage = {
      id: generateMessageId(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    
    try {
      if (awaitingConfirmation) {
        await handleConfirmationResponse(inputText.trim().toLowerCase());
      } else {
        await processNaturalLanguageRequest(inputText.trim());
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addAssistantMessage('I encountered an error processing your request. Please try rephrasing or contact support if the problem persists.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processNaturalLanguageRequest = async (request: string) => {
    if (!family?.id || !user?.uid) {
      addAssistantMessage('I need access to your family information to help with chore operations.');
      return;
    }

    // Build AI context
    const context: AIRequestContext = {
      familySize: family.members.length,
      memberAges: family.members.map(m => 16), // Simplified
      activeChores: selectedChores.map(chore => ({
        id: chore.id!,
        title: chore.title,
        type: chore.type,
        difficulty: chore.difficulty,
        points: chore.points,
        assignedTo: chore.assignedTo,
        dueDate: chore.dueDate,
        room: chore.roomId,
        category: chore.category
      })),
      familyPreferences: {
        enabledFeatures: ['natural_language_operations', 'conflict_detection'],
        suggestionFrequency: 'normal',
        autoApprovalThreshold: 0.8,
        languageStyle: 'family_friendly',
        conflictSensitivity: 'medium',
        privacyLevel: 'standard'
      },
      historicalPatterns: {
        completionPatterns: [],
        preferredAssignments: [],
        timePreferences: [],
        seasonalAdjustments: [],
        successfulOperations: []
      },
      currentSchedule: {
        currentWeek: {
          weekStart: new Date().toISOString(),
          dailySchedules: []
        },
        upcomingEvents: [],
        memberAvailability: [],
        recurringCommitments: []
      }
    };

    let parseResult: NLPParseResult;
    
    // Use AI-powered parsing if available, otherwise fallback to basic parsing
    if (aiAvailable) {
      try {
        addAssistantMessage('🤖 Processing your request with AI...');
        
        const aiResponse = await geminiAIService.processNaturalLanguageRequest(
          request,
          family.id,
          context
        );
        
        if (aiResponse.success && aiResponse.bulkOperation) {
          parseResult = {
            operation: aiResponse.bulkOperation.operation as any,
            suggestedOperation: aiResponse.bulkOperation,
            confidence: aiResponse.confidence,
            clarificationNeeded: false,
            reasoning: aiResponse.reasoning || '',
            supportingArguments: [],
            potentialIssues: [],
            metadata: {}
          };
        } else {
          throw new Error(aiResponse.reasoning || 'AI parsing failed');
        }
      } catch (error) {
        console.error('AI parsing failed, falling back to basic parsing:', error);
        addAssistantMessage('🔄 AI processing failed, using basic automation...');
        parseResult = await naturalLanguageProcessor.parseRequest(request, family.id, context);
      }
    } else {
      // Use basic natural language processing
      parseResult = await naturalLanguageProcessor.parseRequest(request, family.id, context);
    }
    
    if (parseResult.clarificationNeeded) {
      const clarificationQuestions = naturalLanguageProcessor.generateClarificationQuestions(parseResult);
      addAssistantMessage(
        `I need some clarification:\n\n${clarificationQuestions.join('\n')}\n\nCould you provide more details?`,
        { parseResult }
      );
      return;
    }

    // Generate the enhanced bulk operation
    const operation: EnhancedBulkOperation = {
      ...parseResult.suggestedOperation,
      operation: parseResult.suggestedOperation.operation || 'modify_multiple',
      familyId: family.id,
      requestedBy: user.uid,
      choreIds: selectedChores.map(chore => chore.id!),
      applyImmediately: false,
      notifyMembers: true,
      aiAssisted: true,
      naturalLanguageRequest: request,
      operationSteps: [],
      estimatedDuration: 30,
      confidenceScore: parseResult.confidence,
      requiresApproval: false,
      approvalStatus: 'pending'
    } as EnhancedBulkOperation;

    // Analyze conflicts
    const conflictAnalysis = await conflictDetectionService.analyzeOperation(operation, context);
    
    // Analyze family impact
    const impactAssessment = await familyImpactAnalyzer.analyzeImpact(operation, context);

    // Present the analysis to the user
    await presentOperationAnalysis(operation, parseResult, conflictAnalysis, impactAssessment);
  };

  const presentOperationAnalysis = async (
    operation: EnhancedBulkOperation,
    parseResult: NLPParseResult,
    conflictAnalysis: ConflictAnalysis,
    impactAssessment: FamilyImpactAssessment
  ) => {
    let responseMessage = `I understand you want to ${operation.operation?.replace('_', ' ')}.\n\n`;
    
    // Add operation summary
    responseMessage += `**Operation Summary:**\n`;
    responseMessage += `• Type: ${operation.operation?.replace('_', ' ')}\n`;
    responseMessage += `• Affected chores: ${operation.choreIds?.length || 0}\n`;
    responseMessage += `• Confidence: ${Math.round(parseResult.confidence * 100)}%\n\n`;

    // Add conflict analysis
    if (conflictAnalysis.conflicts.length > 0) {
      responseMessage += `**Potential Issues:**\n`;
      conflictAnalysis.conflicts.forEach(conflict => {
        responseMessage += `• ${conflict.description}\n`;
      });
      responseMessage += '\n';
    }

    // Add family impact
    responseMessage += `**Family Impact Score:** ${impactAssessment.overallScore}/100\n`;
    
    const negativeImpacts = impactAssessment.memberImpacts.filter(impact => impact.impact === 'negative');
    if (negativeImpacts.length > 0) {
      responseMessage += `**Members Affected:**\n`;
      negativeImpacts.forEach(impact => {
        responseMessage += `• ${impact.memberName}: ${impact.workloadChange > 0 ? 'increased' : 'decreased'} workload\n`;
      });
      responseMessage += '\n';
    }

    // Add recommendations
    if (impactAssessment.recommendations.length > 0) {
      responseMessage += `**Recommendations:**\n`;
      impactAssessment.recommendations.slice(0, 3).forEach(rec => {
        responseMessage += `• ${rec}\n`;
      });
      responseMessage += '\n';
    }

    // Check if operation should proceed
    const shouldProceed = conflictAnalysis.severity !== 'blocking' && impactAssessment.overallScore > 30;
    
    if (shouldProceed) {
      responseMessage += `Would you like me to proceed with this operation? (Yes/No)`;
      setCurrentOperation(operation);
      setAwaitingConfirmation(true);
    } else {
      responseMessage += `I recommend reviewing and adjusting this operation before proceeding. Would you like to try a different approach?`;
    }

    addAssistantMessage(responseMessage, {
      parseResult,
      conflictAnalysis,
      impactAssessment,
      operation
    });
  };

  const handleConfirmationResponse = async (response: string) => {
    setAwaitingConfirmation(false);
    
    if (['yes', 'y', 'proceed', 'go ahead', 'confirm'].includes(response)) {
      if (currentOperation) {
        await executeOperation(currentOperation);
      }
    } else if (['no', 'n', 'cancel', 'stop', 'abort'].includes(response)) {
      addAssistantMessage('Operation cancelled. Is there anything else I can help you with?');
      setCurrentOperation(null);
    } else {
      addAssistantMessage('I didn\'t understand. Please respond with "yes" to proceed or "no" to cancel.');
      setAwaitingConfirmation(true);
    }
  };

  const executeOperation = async (operation: EnhancedBulkOperation) => {
    addAssistantMessage('Executing operation...');
    
    try {
      const result = await executeBulkOperation(operation);
      
      if (result.success) {
        addAssistantMessage(
          `✅ Operation completed successfully!\n\n` +
          `• ${result.choreIds.length} chore${result.choreIds.length === 1 ? '' : 's'} affected\n` +
          `• ${result.summary.totalPoints} point${Math.abs(result.summary.totalPoints) === 1 ? '' : 's'} ${result.summary.totalPoints >= 0 ? 'added' : 'removed'}\n\n` +
          `Is there anything else you'd like me to help with?`
        );
        
        onOperationComplete(operation.operation || 'unknown', result.choreIds.length);
        
        // Clear conversation state
        setCurrentOperation(null);
      } else {
        const errorMessage = result.errors?.join('\n') || 'Unknown error occurred';
        addAssistantMessage(`❌ Operation failed:\n\n${errorMessage}\n\nWould you like to try a different approach?`);
      }
    } catch (error) {
      console.error('Operation execution error:', error);
      addAssistantMessage('❌ An unexpected error occurred. Please try again or contact support.');
    }
  };

  const addAssistantMessage = (content: string, metadata?: any) => {
    const message: ConversationMessage = {
      id: generateMessageId(),
      type: 'assistant',
      content,
      timestamp: new Date(),
      metadata
    };
    
    setMessages(prev => [...prev, message]);
  };

  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser && styles.userMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser 
            ? { backgroundColor: colors.primary } 
            : { backgroundColor: colors.surface, borderColor: colors.border }
        ]}>
          <Text style={[
            styles.messageText,
            isUser 
              ? { color: '#FFFFFF' }
              : { color: colors.text }
          ]}>
            {message.content}
          </Text>
          
          {!isUser && (
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const handleKeyPress = ({ nativeEvent }: any) => {
    if (Platform.OS === 'web' && nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
      handleSendMessage();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <UniversalIcon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          AI Assistant {aiAvailable && '✨'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isCheckingAI ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking AI availability...
          </Text>
        </View>
      ) : (

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        
        {isProcessing && (
          <View style={styles.typingIndicator}>
            <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                AI is thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me to help with your chores..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onKeyPress={handleKeyPress}
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isProcessing ? colors.primary : colors.border }
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
          >
            <UniversalIcon 
              name="send" 
              size={20} 
              color={inputText.trim() && !isProcessing ? '#FFFFFF' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  typingIndicator: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 20,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});