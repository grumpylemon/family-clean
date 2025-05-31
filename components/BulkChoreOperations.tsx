import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Chore } from '../types';
import { BulkChoreOperation, BulkOperation } from '../types/templates';
import { executeBulkOperation } from '../services/templateService';
import { useFamily, useAuth } from '../hooks/useZustandHooks';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { UniversalIcon } from './ui/UniversalIcon';
import { Toast } from './ui/Toast';
import { AIAssistant } from './AIAssistant';
import { TemplateLibrary } from './TemplateLibrary';
import { TemplateQuickPicker } from './TemplateQuickPicker';

interface BulkChoreOperationsProps {
  visible: boolean;
  onClose: () => void;
  selectedChores: Chore[];
  onOperationComplete: (operation: BulkOperation, affectedCount: number) => void;
}

interface OperationOption {
  id: BulkOperation;
  title: string;
  description: string;
  icon: string;
  color: string;
  requiresChores: boolean;
  minChores?: number;
}

export function BulkChoreOperations({ 
  visible, 
  onClose, 
  selectedChores, 
  onOperationComplete 
}: BulkChoreOperationsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { family } = useFamily();
  const { user } = useAuth();
  
  const [executing, setExecuting] = useState<BulkOperation | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showTemplateQuickPicker, setShowTemplateQuickPicker] = useState(false);

  const operationOptions: OperationOption[] = [
    {
      id: 'ai_assistant',
      title: 'AI Assistant',
      description: 'Tell me what you want to do in natural language',
      icon: 'chatbubble-ellipses',
      color: colors.success,
      requiresChores: false,
      minChores: 0
    },
    {
      id: 'modify_multiple',
      title: 'Modify Multiple Chores',
      description: 'Change points, difficulty, or assignment for selected chores',
      icon: 'create',
      color: colors.primary,
      requiresChores: true,
      minChores: 1
    },
    {
      id: 'assign_multiple',
      title: 'Reassign Multiple Chores',
      description: 'Assign all selected chores to a different family member',
      icon: 'person-add',
      color: colors.secondary,
      requiresChores: true,
      minChores: 1
    },
    {
      id: 'reschedule_multiple',
      title: 'Reschedule Multiple Chores',
      description: 'Change due dates for selected chores',
      icon: 'calendar',
      color: colors.warning,
      requiresChores: true,
      minChores: 1
    },
    {
      id: 'delete_multiple',
      title: 'Delete Multiple Chores',
      description: 'Remove selected chores permanently',
      icon: 'trash',
      color: colors.error,
      requiresChores: true,
      minChores: 1
    },
    {
      id: 'template_quick_apply',
      title: 'Apply Quick Template',
      description: 'Use recommended templates to create multiple chores instantly',
      icon: 'flash',
      color: colors.primary,
      requiresChores: false
    },
    {
      id: 'template_browse_apply',
      title: 'Browse & Apply Templates',
      description: 'Choose from full template library with filtering and preview',
      icon: 'library',
      color: colors.secondary,
      requiresChores: false
    },
    {
      id: 'create_multiple',
      title: 'Create Multiple Chores',
      description: 'Create several chores at once with custom settings',
      icon: 'add-circle',
      color: colors.success,
      requiresChores: false
    }
  ];

  const getAvailableOperations = useCallback(() => {
    return operationOptions.filter(option => {
      if (option.requiresChores) {
        return selectedChores.length >= (option.minChores || 1);
      }
      return true;
    });
  }, [selectedChores.length]);

  const handleOperationSelect = (operation: BulkOperation | string) => {
    if (operation === 'ai_assistant') {
      setShowAIAssistant(true);
      return;
    }
    
    if (operation === 'template_quick_apply') {
      setShowTemplateQuickPicker(true);
      return;
    }
    
    if (operation === 'template_browse_apply') {
      setShowTemplateLibrary(true);
      return;
    }
    
    // For other operations, show confirmation dialog and execute
    showOperationConfirmation(operation as BulkOperation);
  };

  const showOperationConfirmation = (operation: BulkOperation) => {
    const option = operationOptions.find(opt => opt.id === operation);
    if (!option) return;

    let message = `${option.description}\n\n`;
    
    if (option.requiresChores) {
      message += `This will affect ${selectedChores.length} selected chore${selectedChores.length === 1 ? '' : 's'}.`;
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${option.title}\n\n${message}\n\nContinue?`);
      if (confirmed) {
        executeOperation(operation);
      }
    } else {
      Alert.alert(
        option.title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => executeOperation(operation),
            style: operation === 'delete_multiple' ? 'destructive' : 'default'
          }
        ]
      );
    }
  };

  const executeOperation = async (operation: BulkOperation) => {
    if (!family?.id || !user?.uid) {
      Toast.show('Missing family or user information', 'error');
      return;
    }

    setExecuting(operation);
    
    try {
      const bulkOperation: BulkChoreOperation = {
        operation,
        familyId: family.id,
        requestedBy: user.uid,
        choreIds: selectedChores.map(chore => chore.id!),
        applyImmediately: true,
        notifyMembers: true,
        reason: `Bulk ${operation.replace('_', ' ')} operation`
      };

      // Execute the actual bulk operation
      await executeActualOperation(bulkOperation);
      
      Toast.show(
        `Successfully completed ${operation.replace('_', ' ')} for ${selectedChores.length} chore${selectedChores.length === 1 ? '' : 's'}`,
        'success'
      );
      
      onOperationComplete(operation, selectedChores.length);
      onClose();
      
    } catch (error) {
      console.error('Error executing bulk operation:', error);
      Toast.show('Failed to execute operation', 'error');
    } finally {
      setExecuting(null);
    }
  };

  // Execute the actual bulk operation
  const executeActualOperation = async (operation: BulkChoreOperation): Promise<void> => {
    const result = await executeBulkOperation(operation);
    
    if (!result.success) {
      throw new Error(result.errors?.join(', ') || 'Operation failed');
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Operation completed with warnings:', result.warnings);
    }
  };

  const handleTemplateApplied = (templateId: string, choreCount: number) => {
    Toast.show(
      `Successfully created ${choreCount} chores from template!`,
      'success'
    );
    
    // Notify parent component about the operation
    onOperationComplete('create_multiple', choreCount);
    
    // Close template modals
    setShowTemplateQuickPicker(false);
    setShowTemplateLibrary(false);
    
    // Close the bulk operations modal
    onClose();
  };

  const renderOperationCard = (option: OperationOption) => {
    const isAvailable = !option.requiresChores || selectedChores.length >= (option.minChores || 1);
    const isExecuting = executing === option.id;

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.operationCard,
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: isAvailable ? 1 : 0.5
          }
        ]}
        onPress={() => isAvailable && !isExecuting && handleOperationSelect(option.id)}
        disabled={!isAvailable || isExecuting}
      >
        <View style={styles.operationHeader}>
          <View style={[styles.operationIcon, { backgroundColor: option.color + '20' }]}>
            {isExecuting ? (
              <ActivityIndicator size="small" color={option.color} />
            ) : (
              <UniversalIcon name={option.icon} size={24} color={option.color} />
            )}
          </View>
          <View style={styles.operationInfo}>
            <Text style={[styles.operationTitle, { color: colors.text }]}>
              {option.title}
            </Text>
            <Text style={[styles.operationDescription, { color: colors.textSecondary }]}>
              {option.description}
            </Text>
          </View>
          <UniversalIcon 
            name="chevron-forward" 
            size={20} 
            color={isAvailable ? colors.textSecondary : colors.border} 
          />
        </View>

        {option.requiresChores && (
          <View style={styles.operationRequirements}>
            <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
              {selectedChores.length} chore{selectedChores.length === 1 ? '' : 's'} selected
              {option.minChores && option.minChores > 1 && (
                ` (minimum ${option.minChores} required)`
              )}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <UniversalIcon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Bulk Operations</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
              <UniversalIcon name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Bulk operations help you manage multiple chores efficiently. 
                Select an operation below to get started.
              </Text>
            </View>
          </View>

          <View style={styles.operationsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Operations
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Choose an operation to perform on your chores
            </Text>

            <View style={styles.operationsList}>
              {getAvailableOperations().map(renderOperationCard)}
            </View>
          </View>

          {selectedChores.length > 0 && (
            <View style={styles.selectionSummary}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Selected Chores ({selectedChores.length})
              </Text>
              <View style={styles.choresList}>
                {selectedChores.slice(0, 5).map((chore, index) => (
                  <View key={chore.id || index} style={[styles.choreItem, { borderColor: colors.border }]}>
                    <Text style={[styles.choreTitle, { color: colors.text }]}>
                      {chore.title}
                    </Text>
                    <Text style={[styles.chorePoints, { color: colors.primary }]}>
                      {chore.points} pts
                    </Text>
                  </View>
                ))}
                {selectedChores.length > 5 && (
                  <Text style={[styles.moreChoresText, { color: colors.textSecondary }]}>
                    + {selectedChores.length - 5} more chore{selectedChores.length - 5 === 1 ? '' : 's'}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.helpSection}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Bulk operations can save time when managing many chores. Each operation will 
              show a preview before making changes, so you can review what will happen.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {showAIAssistant && (
        <AIAssistant
          visible={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          selectedChores={selectedChores}
          onOperationComplete={(operation, affectedCount) => {
            setShowAIAssistant(false);
            onOperationComplete(operation as any, affectedCount);
            onClose();
          }}
        />
      )}
      
      {/* Template Integration Modals */}
      <TemplateQuickPicker
        visible={showTemplateQuickPicker}
        onClose={() => setShowTemplateQuickPicker(false)}
        onTemplateApplied={handleTemplateApplied}
        mode="quick"
        compact={false}
      />

      <TemplateLibrary
        visible={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onTemplateApplied={handleTemplateApplied}
      />
    </Modal>
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
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  operationsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  operationsList: {
    gap: 12,
  },
  operationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  operationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationInfo: {
    flex: 1,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  operationDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  operationRequirements: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  requirementText: {
    fontSize: 12,
  },
  selectionSummary: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  choresList: {
    gap: 8,
  },
  choreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  choreTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  chorePoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  moreChoresText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  helpSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
});