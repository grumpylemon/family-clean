import { useFamily } from '../hooks/useZustandHooks';
import { useAccessControl } from '../hooks/useAccessControl';
import { createChore, deleteChore, getChores, updateChore, createRoomChore } from '../services/firestore';
import { getFamilyRooms, getRoomTypeDisplayName, getRoomTypeEmoji } from '../services/roomService';
import { choreCardService } from '../services/choreCardService';
import { Chore, ChoreDifficulty, ChoreType, Room, RoomType } from '../types';
import { WebIcon } from './ui/WebIcon';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Text,
    SafeAreaView
} from 'react-native';
import { ThemedText } from './ThemedText';
import { TestDataGenerator } from './TestDataGenerator';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Toast } from './ui/Toast';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ValidatedInput } from './ui/ValidatedInput';
import { TemplateQuickPicker } from './TemplateQuickPicker';
import { TemplateLibrary } from './TemplateLibrary';
import { useFormValidation, validationRules, crossFieldValidations, createCustomValidationRules } from '../hooks/useFormValidation';
import { useValidationConfig } from '../hooks/useValidationConfig';

interface ChoreManagementProps {
  visible: boolean;
  onClose: () => void;
}

export function ChoreManagement({ visible, onClose }: ChoreManagementProps) {
  const { family } = useFamily();
  const { canManageChores, getPermissionErrorMessage } = useAccessControl();
  const { config: validationConfig } = useValidationConfig();
  const [loading, setLoading] = useState(false);
  const [savingChore, setSavingChore] = useState(false);
  const [deletingChoreId, setDeletingChoreId] = useState<string | null>(null);
  const [upgradingChoreId, setUpgradingChoreId] = useState<string | null>(null);
  const [showAdvancedUpgradeModal, setShowAdvancedUpgradeModal] = useState(false);
  const [choreToUpgrade, setChorToUpgrade] = useState<Chore | null>(null);
  
  // Advanced card features toggles
  const [enableAdvancedCard, setEnableAdvancedCard] = useState(false);
  const [enableInstructions, setEnableInstructions] = useState(false);
  const [enableEducationalContent, setEnableEducationalContent] = useState(false);
  const [enableGamification, setEnableGamification] = useState(false);
  const [enableCertification, setEnableCertification] = useState(false);
  const [enableQualityRating, setEnableQualityRating] = useState(false);
  const [chores, setChores] = useState<Chore[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [choreToDelete, setChoreToDelete] = useState<Chore | null>(null);
  
  // Template integration state
  const [showTemplateQuickPicker, setShowTemplateQuickPicker] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  
  // Create family-configured validation rules
  const customRules = createCustomValidationRules(validationConfig);
  
  // Form validation with family-specific rules
  const { 
    errors, 
    warnings,
    isValidating,
    handleFieldChange, 
    handleFieldBlur, 
    validateAll, 
    resetValidation, 
    isFieldValid,
    hasErrors,
    getFieldError 
  } = useFormValidation({
    title: [customRules.choreTitle()],
    description: [validationConfig?.choreRules.description.enabled ? 
      validationRules.maxLength(validationConfig.choreRules.description.maxLength || 200, 
        validationConfig.customMessages.choreDescription || 'Description too long') : 
      validationRules.maxLength(200, 'Description must be under 200 characters')],
    points: [customRules.chorePoints()],
    frequencyDays: [validationRules.positiveInteger('Frequency must be a positive number'), 
      validationRules.max(validationConfig?.choreRules.frequency.max || 365, 'Maximum frequency exceeded')],
    cooldownHours: [validationRules.numeric('Must be a number'), 
      validationRules.min(validationConfig?.choreRules.cooldown.min || 0, 'Cannot be negative'), 
      validationRules.max(validationConfig?.choreRules.cooldown.max || 168, 'Maximum cooldown exceeded')],
  }, {
    crossFieldValidations: validationConfig?.choreRules.crossField.cooldownVsFrequency.enabled ? [
      crossFieldValidations.cooldownVsFrequency('cooldownHours', 'frequencyDays')
    ] : [],
    debounceMs: validationConfig?.globalSettings.debounceMs || 300
  });
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [choreType, setChoreType] = useState<ChoreType>('individual');
  const [difficulty, setDifficulty] = useState<ChoreDifficulty>('medium');
  const [points, setPoints] = useState('10');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequencyDays, setFrequencyDays] = useState('7');
  const [cooldownHours, setCooldownHours] = useState('24');
  
  // Room-related state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');

  useEffect(() => {
    if (visible && family) {
      loadChores();
      loadRooms();
    }
  }, [visible, family]);

  const loadChores = async () => {
    if (!family || !family.id) {
      console.warn('Cannot load chores - family data not ready');
      return;
    }
    
    setLoading(true);
    try {
      const familyChores = await getChores(family.id);
      setChores(familyChores);
    } catch (error) {
      console.error('Error loading chores:', error);
      Toast.error('Failed to load chores');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!family || !family.id) {
      console.warn('Cannot load rooms - family data not ready');
      return;
    }
    
    try {
      const familyRooms = await getFamilyRooms(family.id);
      setRooms(familyRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Don't show error toast for rooms as it's not critical
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setChoreType('individual');
    setDifficulty('medium');
    setPoints('10');
    setAssignedTo('');
    setDueDate(new Date());
    setIsRecurring(false);
    setFrequencyDays('7');
    setCooldownHours('24');
    setSelectedRoomId('');
    setEditingChore(null);
    setShowForm(false);
    resetValidation();
    
    // Reset advanced card toggles
    setEnableAdvancedCard(false);
    setEnableInstructions(false);
    setEnableEducationalContent(false);
    setEnableGamification(false);
    setEnableCertification(false);
    setEnableQualityRating(false);
  };

  const handleSaveChore = async () => {
    if (!family || !family.id) {
      Toast.error('Family data not loaded. Please try again.');
      console.error('Family data missing:', { family, hasId: family?.id });
      return;
    }
    
    const values = {
      title,
      description,
      points,
      frequencyDays,
      cooldownHours,
    };
    
    if (!validateAll(values)) {
      Toast.error('Please fix the form errors');
      return;
    }

    setSavingChore(true);
    try {
      const choreData: Omit<Chore, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        type: choreType,
        difficulty,
        points: parseInt(points) || 10,
        assignedTo: assignedTo || '',
        dueDate: dueDate.toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: family.adminId,
        familyId: family.id,
        status: 'open',
        cooldownHours: parseInt(cooldownHours) || 24,
        recurring: isRecurring ? {
          enabled: true,
          frequencyDays: parseInt(frequencyDays) || 7
        } : undefined
      };

      // Add room information if room type is selected and a room is chosen
      if (choreType === 'room' && selectedRoomId) {
        const selectedRoom = rooms.find(room => room.id === selectedRoomId);
        if (selectedRoom) {
          choreData.roomId = selectedRoom.id;
          choreData.roomName = selectedRoom.name;
          choreData.roomType = selectedRoom.type;
        }
      }

      let newChoreId: string | undefined;

      if (editingChore) {
        await updateChore(editingChore.id!, choreData);
        Toast.success('Chore updated successfully');
      } else {
        // Use room-specific creation if it's a room chore
        if (choreType === 'room' && selectedRoomId) {
          const selectedRoom = rooms.find(room => room.id === selectedRoomId);
          if (selectedRoom) {
            newChoreId = await createRoomChore(choreData, selectedRoom.id!, selectedRoom.name, selectedRoom.type);
          } else {
            newChoreId = await createChore(choreData);
          }
        } else {
          newChoreId = await createChore(choreData);
        }
        Toast.success('Chore created successfully');
        
        // Create advanced card if enabled and we have a new chore ID
        if (enableAdvancedCard && newChoreId) {
          try {
            await createAdvancedChoreCard(newChoreId, choreData);
          } catch (advancedError) {
            console.error('Error creating advanced chore card:', advancedError);
            Toast.error('Chore created but failed to add advanced features');
          }
        }
      }

      resetForm();
      await loadChores();
    } catch (error) {
      Toast.error('Failed to save chore');
      console.error('Error saving chore:', error);
    } finally {
      setSavingChore(false);
    }
  };

  const createAdvancedChoreCard = async (choreId: string, choreData: any) => {
    if (!family?.id) return;

    const advancedCard = {
      choreId,
      familyId: family.id,
      isActive: true,
      
      // Only include features that are enabled
      ...(enableInstructions && {
        instructions: {
          child: {
            title: `${choreData.title} - For Kids`,
            description: `Simple steps to complete ${choreData.title}`,
            steps: [
              {
                id: 'step1',
                stepNumber: 1,
                title: 'Get Ready',
                description: 'Gather everything you need first',
                estimatedMinutes: 2,
                safetyNote: 'Ask an adult if you need help'
              },
              {
                id: 'step2',
                stepNumber: 2,
                title: 'Do the Task',
                description: 'Follow the steps carefully',
                estimatedMinutes: Math.max(5, 10),
              },
              {
                id: 'step3',
                stepNumber: 3,
                title: 'Clean Up',
                description: 'Put everything back where it belongs',
                estimatedMinutes: 3,
              }
            ],
            safetyWarnings: [
              { level: 'caution', message: 'Ask for help with anything you\'re unsure about' }
            ]
          },
          teen: {
            title: `${choreData.title} - For Teens`,
            description: `Complete guide for ${choreData.title}`,
            steps: [
              {
                id: 'step1',
                stepNumber: 1,
                title: 'Preparation',
                description: 'Set up your workspace and gather materials',
                estimatedMinutes: 3,
              },
              {
                id: 'step2',
                stepNumber: 2,
                title: 'Execute Task',
                description: 'Complete the main task efficiently',
                estimatedMinutes: 15,
              },
              {
                id: 'step3',
                stepNumber: 3,
                title: 'Quality Check',
                description: 'Review your work and make improvements',
                estimatedMinutes: 5,
              }
            ],
            safetyWarnings: choreData.difficulty === 'hard' ? [
              { level: 'warning', message: 'Check safety requirements first' }
            ] : []
          },
          adult: {
            title: `${choreData.title} - Expert Level`,
            description: `Professional approach to ${choreData.title}`,
            steps: [
              {
                id: 'step1',
                stepNumber: 1,
                title: 'Strategic Planning',
                description: 'Plan the most efficient approach',
                estimatedMinutes: 2,
              },
              {
                id: 'step2',
                stepNumber: 2,
                title: 'Implementation',
                description: 'Execute with focus on quality and efficiency',
                estimatedMinutes: 20,
              },
              {
                id: 'step3',
                stepNumber: 3,
                title: 'Optimization',
                description: 'Identify improvements for next time',
                estimatedMinutes: 3,
              }
            ],
            safetyWarnings: []
          }
        }
      }),
      
      ...(enableEducationalContent && {
        educationalContent: {
          facts: [
            {
              id: 'fact1',
              content: `Did you know? ${choreData.title} helps maintain a healthy home environment!`,
              category: 'health',
              seasonal: false
            }
          ],
          quotes: [
            {
              id: 'quote1',
              text: 'A job well done gives you satisfaction and pride!',
              author: 'Family Wisdom',
              mood: 'encouraging',
              themes: ['motivation', 'pride']
            }
          ]
        }
      }),
      
      ...(enableGamification && {
        gamification: {
          specialAchievements: [`${choreData.title.toLowerCase().replace(/\s+/g, '_')}_expert`],
          qualityMultipliers: {
            incomplete: 0,
            partial: 0.5,
            complete: 1.0,
            excellent: choreData.difficulty === 'hard' ? 1.5 : 1.2
          },
          learningRewards: {
            instructionCompleted: 5,
            factEngagement: 2,
            certificationProgress: 10
          }
        }
      }),
      
      ...(enableCertification && {
        certification: {
          required: true,
          level: choreData.difficulty === 'hard' ? 'advanced' : choreData.difficulty === 'medium' ? 'intermediate' : 'basic',
          skills: [`${choreData.title} technique`, 'Quality standards', 'Safety awareness']
        }
      }),
      
      ...(enableQualityRating && {
        qualityRating: {
          enabled: true,
          criteria: [
            'Task completion',
            'Attention to detail',
            'Cleanup and organization'
          ]
        }
      })
    };

    await choreCardService.createAdvancedCard(advancedCard);
    Toast.success(`Advanced chore card created with ${Object.keys(advancedCard).length - 3} features!`);
  };

  const handleTemplateApplied = async (templateId: string, choreCount: number) => {
    console.log(`Template ${templateId} applied, created ${choreCount} chores`);
    Toast.success(`Successfully created ${choreCount} chores from template!`);
    
    // Reload chores to show the new ones
    await loadChores();
    
    // Close any open template modals
    setShowTemplateQuickPicker(false);
    setShowTemplateLibrary(false);
  };

  const handleDeleteChore = (chore: Chore) => {
    console.log('Delete button clicked for chore:', chore.title, 'ID:', chore.id);
    setChoreToDelete(chore);
  };

  const performDelete = async () => {
    if (!choreToDelete) return;
    const chore = choreToDelete;
    console.log('Delete confirmed for chore:', chore.id);
    setDeletingChoreId(chore.id!);
    try {
      const success = await deleteChore(chore.id!);
      console.log('Delete result:', success);
      if (success) {
        Toast.success('Chore deleted successfully');
        await loadChores();
      } else {
        Toast.error('Failed to delete chore');
      }
    } catch (error) {
      Toast.error('Failed to delete chore');
      console.error('Error deleting chore:', error);
    } finally {
      setDeletingChoreId(null);
      setChoreToDelete(null);
    }
  };

  const handleUpgradeToAdvanced = async (chore: Chore) => {
    if (!family?.id || !canManageChores) {
      Toast.error(getPermissionErrorMessage('manage chores'));
      return;
    }

    // Check if this chore already has advanced features
    if (!chore.id) {
      Toast.error('Cannot upgrade chore without ID');
      return;
    }

    setUpgradingChoreId(chore.id);
    
    try {
      // Check if advanced card already exists
      const existingCard = await choreCardService.getAdvancedCard(chore.id);
      if (existingCard) {
        Toast.info('This chore already has advanced features');
        setUpgradingChoreId(null);
        return;
      }
      
      // Set the chore to upgrade and show modal
      setChorToUpgrade(chore);
      setShowAdvancedUpgradeModal(true);
    } catch (error) {
      console.error('Error checking for existing advanced card:', error);
      Toast.error('Failed to check chore upgrade status');
    } finally {
      setUpgradingChoreId(null);
    }
  };

  const confirmUpgradeToAdvanced = async () => {
    if (!choreToUpgrade || !family?.id) return;
    
    setUpgradingChoreId(choreToUpgrade.id!);
    
    try {
      const advancedCard = {
        choreId: choreToUpgrade.id!,
        familyId: family.id,
        
        // Multi-level instructions
        instructions: {
          child: {
            title: `${choreToUpgrade.title} - For Kids`,
            description: `Simple steps to complete ${choreToUpgrade.title}`,
            steps: [
              {
                id: 'step1',
                title: 'Get Ready',
                description: 'Gather everything you need first',
                estimatedTime: 2,
                safetyWarnings: ['Ask an adult if you need help'],
                media: []
              },
              {
                id: 'step2', 
                title: 'Do the Task',
                description: 'Follow the steps carefully',
                estimatedTime: Math.max(5, choreToUpgrade.estimatedDuration ? choreToUpgrade.estimatedDuration - 5 : 10),
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step3',
                title: 'Clean Up',
                description: 'Put everything back where it belongs',
                estimatedTime: 3,
                safetyWarnings: [],
                media: []
              }
            ]
          },
          teen: {
            title: `${choreToUpgrade.title} - For Teens`,
            description: `Complete guide for ${choreToUpgrade.title}`,
            steps: [
              {
                id: 'step1',
                title: 'Preparation',
                description: 'Set up your workspace and gather materials',
                estimatedTime: 3,
                safetyWarnings: choreToUpgrade.difficulty === 'hard' ? ['Check safety requirements first'] : [],
                media: []
              },
              {
                id: 'step2',
                title: 'Execute Task',
                description: 'Complete the main task efficiently',
                estimatedTime: choreToUpgrade.estimatedDuration || 15,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step3',
                title: 'Quality Check',
                description: 'Review your work and make improvements',
                estimatedTime: 5,
                safetyWarnings: [],
                media: []
              }
            ]
          },
          adult: {
            title: `${choreToUpgrade.title} - Expert Level`,
            description: `Professional approach to ${choreToUpgrade.title}`,
            steps: [
              {
                id: 'step1',
                title: 'Strategic Planning',
                description: 'Plan the most efficient approach',
                estimatedTime: 2,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step2',
                title: 'Implementation',
                description: 'Execute with focus on quality and efficiency',
                estimatedTime: choreToUpgrade.estimatedDuration || 20,
                safetyWarnings: [],
                media: []
              },
              {
                id: 'step3',
                title: 'Optimization',
                description: 'Identify improvements for next time',
                estimatedTime: 3,
                safetyWarnings: [],
                media: []
              }
            ]
          }
        },
        
        // Educational content
        educationalContent: {
          facts: [`Did you know? ${choreToUpgrade.title} helps maintain a healthy home environment!`],
          quotes: ['A job well done gives you satisfaction and pride!'],
          learningObjectives: [`Master the ${choreToUpgrade.title} technique`, 'Understand the importance of consistency', 'Develop quality standards']
        },
        
        // Gamification
        gamification: {
          specialAchievements: [`${choreToUpgrade.title}_expert`],
          qualityMultipliers: {
            incomplete: 0,
            partial: 0.5,
            complete: 1.0,
            excellent: choreToUpgrade.difficulty === 'hard' ? 1.5 : 1.2
          },
          learningRewards: {
            instructionCompleted: 5,
            factEngagement: 2,
            certificationProgress: 10
          },
          certificationBonuses: {
            basic: 10,
            intermediate: 20,
            advanced: 30
          }
        },
        
        // Metadata
        isActive: true
      };
      
      await choreCardService.createAdvancedCard(advancedCard);
      Toast.success(`"${choreToUpgrade.title}" upgraded to Advanced Chore!`);
      
      // Close modal and reload chores
      setShowAdvancedUpgradeModal(false);
      setChorToUpgrade(null);
      await loadChores();
    } catch (error) {
      console.error('Error upgrading chore:', error);
      Toast.error('Failed to upgrade chore to advanced');
    } finally {
      setUpgradingChoreId(null);
    }
  };

  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setTitle(chore.title);
    setDescription(chore.description || '');
    setChoreType(chore.type);
    setDifficulty(chore.difficulty);
    setPoints(chore.points.toString());
    setAssignedTo(chore.assignedTo);
    setDueDate(new Date(chore.dueDate));
    setIsRecurring(chore.recurring?.enabled || false);
    setFrequencyDays(chore.recurring?.frequencyDays?.toString() || '7');
    setCooldownHours(chore.cooldownHours?.toString() || '24');
    setSelectedRoomId(chore.roomId || '');
    setShowForm(true);
  };

  const getTypeColor = (type: ChoreType) => {
    switch (type) {
      case 'individual': return '#be185d';
      case 'family': return '#10b981';
      case 'pet': return '#f59e0b';
      case 'shared': return '#ef4444';
      case 'room': return '#8b5cf6';
      default: return '#666';
    }
  };

  const getDifficultyColor = (difficulty: ChoreDifficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#666';
    }
  };

  const isChoreLocked = (chore: Chore) => {
    if (!chore.lockedUntil) return false;
    const lockedUntil = new Date(chore.lockedUntil);
    return lockedUntil > new Date();
  };

  // Dropdown component
  const DropdownSelector = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    placeholder = "Select option...",
    error,
    hint 
  }: {
    label: string;
    value: string;
    options: { label: string; value: string; color?: string }[];
    onSelect: (value: string) => void;
    placeholder?: string;
    error?: string;
    hint?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            error && styles.dropdownButtonError,
            isOpen && styles.dropdownButtonOpen
          ]}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={[
            styles.dropdownButtonText,
            selectedOption && { color: selectedOption.color || '#831843' },
            !selectedOption && styles.dropdownPlaceholder
          ]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <WebIcon 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#be185d" 
          />
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.dropdownMenu}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  value === option.value && styles.dropdownOptionSelected
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  { color: option.color || '#831843' },
                  value === option.value && styles.dropdownOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
      </View>
    );
  };

  // Toggle switch component
  const ToggleSwitch = ({ 
    label, 
    value, 
    onToggle, 
    description,
    disabled = false 
  }: {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    description?: string;
    disabled?: boolean;
  }) => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleRow, disabled && styles.toggleDisabled]}
        onPress={() => !disabled && onToggle(!value)}
        disabled={disabled}
      >
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleLabel, disabled && styles.toggleLabelDisabled]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.toggleDescription, disabled && styles.toggleDescriptionDisabled]}>
              {description}
            </Text>
          )}
        </View>
        <View style={[
          styles.toggleSwitch,
          value && styles.toggleSwitchOn,
          disabled && styles.toggleSwitchDisabled
        ]}>
          <View style={[
            styles.toggleThumb,
            value && styles.toggleThumbOn,
            disabled && styles.toggleThumbDisabled
          ]} />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (!canManageChores) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <WebIcon name="chevron-back" size={24} color="#be185d" />
              <Text style={styles.backText}>Admin</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Manage Chores</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.errorContainer}>
            <WebIcon name="lock-closed-outline" size={64} color="#f9a8d4" />
            <Text style={styles.errorText}>
              {getPermissionErrorMessage('admin')}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Add check for family data
  if (!family || !family.id) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <WebIcon name="chevron-back" size={24} color="#be185d" />
              <Text style={styles.backText}>Admin</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Manage Chores</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.errorContainer}>
            <LoadingSpinner size="large" />
            <Text style={styles.errorText}>
              Loading family data...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <WebIcon name="chevron-back" size={24} color="#be185d" />
            <Text style={styles.backText}>Admin</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manage Chores</Text>
          <View style={styles.headerSpacer} />
        </View>

        {showForm ? (
          <ScrollView style={styles.scrollView}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>
                {editingChore ? 'Edit Chore' : 'Create New Chore'}
              </Text>

              <ValidatedInput
                label="Title"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  handleFieldChange('title', text);
                }}
                onBlur={() => handleFieldBlur('title', title)}
                placeholder="Enter chore title"
                error={getFieldError('title')}
                isValid={isFieldValid('title')}
                isValidating={isValidating}
                required={true}
                characterLimit={50}
                hint="Give your chore a clear, descriptive name"
              />

              <ValidatedInput
                label="Description"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  handleFieldChange('description', text);
                }}
                onBlur={() => handleFieldBlur('description', description)}
                placeholder="Enter description (optional)"
                multiline
                numberOfLines={3}
                style={styles.textArea}
                error={getFieldError('description')}
                isValid={isFieldValid('description')}
                isValidating={isValidating}
                characterLimit={200}
                hint="Add details about what this chore involves"
              />

              <DropdownSelector
                label="Chore Type"
                value={choreType}
                options={[
                  { label: 'Individual', value: 'individual', color: getTypeColor('individual') },
                  { label: 'Family', value: 'family', color: getTypeColor('family') },
                  { label: 'Pet Care', value: 'pet', color: getTypeColor('pet') },
                  { label: 'Shared', value: 'shared', color: getTypeColor('shared') },
                  { label: 'Room-based', value: 'room', color: getTypeColor('room') }
                ]}
                onSelect={(value) => setChoreType(value as ChoreType)}
                placeholder="Select chore type..."
                hint="Choose how this chore should be categorized"
              />

              <DropdownSelector
                label="Difficulty Level"
                value={difficulty}
                options={[
                  { label: 'Easy (Quick & Simple)', value: 'easy', color: getDifficultyColor('easy') },
                  { label: 'Medium (Regular Task)', value: 'medium', color: getDifficultyColor('medium') },
                  { label: 'Hard (Complex/Time-consuming)', value: 'hard', color: getDifficultyColor('hard') }
                ]}
                onSelect={(value) => setDifficulty(value as ChoreDifficulty)}
                placeholder="Select difficulty level..."
                hint="How challenging is this chore to complete?"
              />

              {/* Room Selection - only show for room chores */}
              {choreType === 'room' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Room</Text>
                  {rooms.length > 0 ? (
                    <View style={styles.roomSelect}>
                      <TouchableOpacity
                        style={[styles.roomOption, !selectedRoomId && styles.roomOptionSelected]}
                        onPress={() => setSelectedRoomId('')}
                      >
                        <Text style={styles.roomOptionText}>No Room</Text>
                      </TouchableOpacity>
                      {rooms.map((room) => (
                        <TouchableOpacity
                          key={room.id}
                          style={[
                            styles.roomOption,
                            selectedRoomId === room.id && styles.roomOptionSelected
                          ]}
                          onPress={() => setSelectedRoomId(room.id!)}
                        >
                          <Text style={styles.roomEmoji}>
                            {getRoomTypeEmoji(room.type)}
                          </Text>
                          <View style={styles.roomOptionContent}>
                            <Text style={styles.roomOptionText}>{room.name}</Text>
                            <Text style={styles.roomOptionSubtext}>
                              {getRoomTypeDisplayName(room.type)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noRoomsMessage}>
                      <Text style={styles.noRoomsText}>
                        No rooms available. Create rooms first to assign room-based chores.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <ValidatedInput
                label="Points"
                value={points}
                onChangeText={(text) => {
                  setPoints(text);
                  handleFieldChange('points', text);
                }}
                onBlur={() => handleFieldBlur('points', points)}
                placeholder="10"
                keyboardType="numeric"
                error={getFieldError('points')}
                isValid={isFieldValid('points')}
                isValidating={isValidating}
                required={true}
                hint="Points awarded for completing this chore (1-100)"
              />

              <DropdownSelector
                label="Assign To"
                value={assignedTo}
                options={[
                  { label: 'Unassigned (Anyone can take)', value: '' },
                  ...(family?.members.map(member => ({
                    label: member.name,
                    value: member.uid
                  })) || [])
                ]}
                onSelect={setAssignedTo}
                placeholder="Select family member..."
                hint="Who should be responsible for this chore?"
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{dueDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'android');
                      if (selectedDate) {
                        setDueDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <TouchableOpacity
                  style={styles.recurringToggle}
                  onPress={() => setIsRecurring(!isRecurring)}
                >
                  <Text style={styles.label}>Recurring Chore</Text>
                  <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]} />
                </TouchableOpacity>
                {isRecurring && (
                  <ValidatedInput
                    label="Frequency (days)"
                    value={frequencyDays}
                    onChangeText={(text) => {
                      setFrequencyDays(text);
                      const allValues = { frequencyDays: text, cooldownHours };
                      handleFieldChange('frequencyDays', text, allValues);
                    }}
                    onBlur={() => {
                      const allValues = { frequencyDays, cooldownHours };
                      handleFieldBlur('frequencyDays', frequencyDays, allValues);
                    }}
                    placeholder="7"
                    keyboardType="numeric"
                    error={getFieldError('frequencyDays')}
                    isValid={isFieldValid('frequencyDays')}
                    isValidating={isValidating}
                    hint="How often should this chore repeat?"
                  />
                )}
              </View>

              <ValidatedInput
                label="Cooldown Hours"
                value={cooldownHours}
                onChangeText={(text) => {
                  setCooldownHours(text);
                  const allValues = { frequencyDays, cooldownHours: text };
                  handleFieldChange('cooldownHours', text, allValues);
                }}
                onBlur={() => {
                  const allValues = { frequencyDays, cooldownHours };
                  handleFieldBlur('cooldownHours', cooldownHours, allValues);
                }}
                placeholder="24"
                keyboardType="numeric"
                error={getFieldError('cooldownHours')}
                isValid={isFieldValid('cooldownHours')}
                isValidating={isValidating}
                hint="Hours before chore can be completed again"
              />

              {/* Advanced Chore Card Features - Only show if family has it enabled */}
              {family?.settings?.enableAdvancedChoreCards && (
                <View style={styles.advancedFeaturesSection}>
                  <Text style={styles.sectionTitle}>
                    🚀 Advanced Chore Features
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Transform this into a smart, interactive chore card with enhanced features
                  </Text>
                  
                  <ToggleSwitch
                    label="Enable Advanced Chore Card"
                    value={enableAdvancedCard}
                    onToggle={setEnableAdvancedCard}
                    description="Add interactive features to make this chore more engaging and educational"
                  />

                  {enableAdvancedCard && (
                    <View style={styles.advancedOptionsContainer}>
                      <ToggleSwitch
                        label="Step-by-Step Instructions"
                        value={enableInstructions}
                        onToggle={setEnableInstructions}
                        description="Age-appropriate instructions for kids, teens, and adults"
                      />

                      <ToggleSwitch
                        label="Educational Content"
                        value={enableEducationalContent}
                        onToggle={setEnableEducationalContent}
                        description="Fun facts, tips, and learning opportunities"
                      />

                      <ToggleSwitch
                        label="Quality Rating System"
                        value={enableQualityRating}
                        onToggle={setEnableQualityRating}
                        description="Rate completion quality (incomplete, partial, complete, excellent)"
                      />

                      <ToggleSwitch
                        label="Enhanced Gamification"
                        value={enableGamification}
                        onToggle={setEnableGamification}
                        description="Special achievements, streak bonuses, and quality multipliers"
                      />

                      <ToggleSwitch
                        label="Certification System"
                        value={enableCertification}
                        onToggle={setEnableCertification}
                        description="Progressive skill certification from basic to advanced levels"
                        disabled={!enableInstructions}
                      />

                      {(enableInstructions || enableEducationalContent || enableQualityRating || enableGamification || enableCertification) && (
                        <View style={styles.advancedPreview}>
                          <Text style={styles.advancedPreviewTitle}>
                            ✨ Your chore will include:
                          </Text>
                          {enableInstructions && (
                            <Text style={styles.advancedPreviewItem}>
                              📋 Interactive step-by-step guides
                            </Text>
                          )}
                          {enableEducationalContent && (
                            <Text style={styles.advancedPreviewItem}>
                              🧠 Educational facts and tips
                            </Text>
                          )}
                          {enableQualityRating && (
                            <Text style={styles.advancedPreviewItem}>
                              ⭐ Quality rating and feedback system
                            </Text>
                          )}
                          {enableGamification && (
                            <Text style={styles.advancedPreviewItem}>
                              🎮 Enhanced rewards and achievements
                            </Text>
                          )}
                          {enableCertification && (
                            <Text style={styles.advancedPreviewItem}>
                              🏆 Progressive skill certification
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}


              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    styles.saveButton,
                    (hasErrors || savingChore) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveChore}
                  disabled={hasErrors || savingChore}
                >
                  {savingChore ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingChore ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.createButtonText}>+ Create New Chore</Text>
            </TouchableOpacity>
            
            {/* Template Integration Section */}
            <View style={styles.templateSection}>
              <Text style={styles.templateSectionTitle}>📋 Or Start with a Template</Text>
              <Text style={styles.templateSectionSubtitle}>
                Create multiple chores quickly using pre-made templates
              </Text>
              <View style={styles.templateButtons}>
                <TouchableOpacity
                  style={styles.templateButton}
                  onPress={() => setShowTemplateQuickPicker(true)}
                >
                  <WebIcon name="flash" size={20} color="#be185d" />
                  <Text style={styles.templateButtonText}>Quick Templates</Text>
                  <Text style={styles.templateButtonSubtext}>Instant chore creation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.templateButton}
                  onPress={() => setShowTemplateLibrary(true)}
                >
                  <WebIcon name="library" size={20} color="#be185d" />
                  <Text style={styles.templateButtonText}>Browse Library</Text>
                  <Text style={styles.templateButtonSubtext}>All templates & filters</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Test Data Generator */}
            <View style={styles.testDataSection}>
              <TestDataGenerator />
            </View>

            <ScrollView style={styles.scrollView}>
              {loading ? (
                <LoadingSpinner message="Loading chores..." />
              ) : chores.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <WebIcon name="list-outline" size={64} color="#f9a8d4" />
                  <Text style={styles.emptyStateTitle}>No chores yet</Text>
                  <Text style={styles.emptyStateMessage}>
                    Create your first chore to get started!
                  </Text>
                </View>
              ) : (
                chores.map((chore) => {
                  const locked = isChoreLocked(chore);
                  return (
                    <View key={chore.id} style={styles.choreCard}>
                      <View style={styles.choreHeader}>
                        <Text style={styles.choreTitle}>{chore.title}</Text>
                        <View style={styles.choreActions}>
                          <TouchableOpacity
                            style={[styles.choreActionButton, styles.editButton]}
                            onPress={() => handleEditChore(chore)}
                          >
                            <WebIcon name="pencil" size={14} color="#be185d" style={{ marginRight: 4 }} />
                            <Text style={styles.editText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.choreActionButton, styles.deleteButton]}
                            onPress={() => {
                              console.log('TouchableOpacity onPress triggered');
                              handleDeleteChore(chore);
                            }}
                            disabled={deletingChoreId === chore.id}
                          >
                            {deletingChoreId === chore.id ? (
                              <LoadingSpinner size="small" />
                            ) : (
                              <>
                                <WebIcon name="trash" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                                <Text style={styles.deleteText}>Delete</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {chore.description && (
                        <Text style={styles.choreDescription}>{chore.description}</Text>
                      )}

                      <View style={styles.choreDetails}>
                        <View style={styles.choreTag}>
                          <Text style={[styles.choreTagText, { color: getTypeColor(chore.type) }]}>
                            {chore.type}
                          </Text>
                        </View>
                        <View style={styles.choreTag}>
                          <Text style={[styles.choreTagText, { color: getDifficultyColor(chore.difficulty) }]}>
                            {chore.difficulty}
                          </Text>
                        </View>
                        <Text style={styles.chorePoints}>{chore.points} pts</Text>
                      </View>

                      <View style={styles.choreFooter}>
                        <Text style={styles.choreFooterText}>
                          Due: {new Date(chore.dueDate).toLocaleDateString()}
                        </Text>
                        {chore.assignedTo && (
                          <Text style={styles.choreFooterText}>
                            Assigned: {family?.members.find(m => m.uid === chore.assignedTo)?.name || 'Unknown'}
                          </Text>
                        )}
                        {chore.recurring?.enabled && (
                          <Text style={styles.choreFooterText}>
                            Repeats every {chore.recurring.frequencyDays} days
                          </Text>
                        )}
                      </View>

                      {locked && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <WebIcon name="lock-closed" size={16} color="#ef4444" />
                          <Text style={styles.lockedText}>
                            Locked until {new Date(chore.lockedUntil!).toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </>
        )}

        <ConfirmDialog
          visible={!!choreToDelete}
          title="Delete Chore"
          message={`Are you sure you want to delete "${choreToDelete?.title}"?`}
          confirmText="Delete"
          confirmButtonStyle="danger"
          onConfirm={performDelete}
          onCancel={() => setChoreToDelete(null)}
          icon="trash-outline"
        />

        <ConfirmDialog
          visible={showAdvancedUpgradeModal}
          title="Upgrade to Advanced Chore"
          message={`Transform "${choreToUpgrade?.title}" into an Advanced Chore with:\n\n• Multi-level instructions (Kids, Teens, Adults)\n• Educational content and tips\n• Quality rating system\n• Performance tracking\n• Enhanced gamification\n\nThis will make the chore more engaging and educational for all family members.`}
          confirmText="Upgrade"
          confirmButtonStyle="primary"
          onConfirm={confirmUpgradeToAdvanced}
          onCancel={() => {
            setShowAdvancedUpgradeModal(false);
            setChorToUpgrade(null);
          }}
          icon="star"
        />

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

      </SafeAreaView>
    </Modal>
  );
}

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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#be185d',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#be185d',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  createButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#be185d',
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#831843',
    marginTop: 20,
    fontWeight: '600',
  },
  choreCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#831843',
  },
  choreActions: {
    flexDirection: 'row',
    gap: 8,
  },
  choreActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 60,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  editButton: {
    borderColor: '#be185d',
    backgroundColor: '#fef7ff',
  },
  editText: {
    color: '#be185d',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  choreDescription: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 12,
  },
  choreDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  choreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  choreTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chorePoints: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  choreFooter: {
    gap: 4,
  },
  choreFooterText: {
    fontSize: 12,
    color: '#9f1239',
  },
  lockedText: {
    color: '#ef4444',
    marginLeft: 4,
    fontSize: 12,
  },
  form: {
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#831843',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#831843',
  },
  input: {
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fdf2f8',
    color: '#831843',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    backgroundColor: '#ffffff',
  },
  typeButtonSelected: {
    backgroundColor: '#f9a8d4',
    borderColor: '#be185d',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  diffButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    backgroundColor: '#ffffff',
  },
  diffButtonSelected: {
    backgroundColor: '#f9a8d4',
    borderColor: '#be185d',
  },
  diffButtonText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  memberSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  memberOptionSelected: {
    backgroundColor: '#be185d',
    borderColor: '#831843',
  },
  memberOptionText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  dateButton: {
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fdf2f8',
  },
  dateButtonText: {
    color: '#831843',
    fontSize: 16,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#be185d',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#be185d',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#f9a8d4',
  },
  cancelButtonText: {
    color: '#831843',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#be185d',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#f9a8d4',
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  roomSelect: {
    gap: 8,
    maxHeight: 200,
  },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9a8d4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomOptionSelected: {
    backgroundColor: '#be185d',
    borderColor: '#831843',
  },
  roomEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  roomOptionContent: {
    flex: 1,
  },
  roomOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  roomOptionSubtext: {
    fontSize: 14,
    color: '#9f1239',
    marginTop: 2,
  },
  noRoomsMessage: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  noRoomsText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  testDataSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  
  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    minHeight: 48,
  },
  dropdownButtonError: {
    borderColor: '#ef4444',
  },
  dropdownButtonOpen: {
    borderColor: '#be185d',
    backgroundColor: '#fdf2f8',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#9f1239',
    opacity: 0.7,
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fdf2f8',
  },
  dropdownOptionSelected: {
    backgroundColor: '#fdf2f8',
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
    opacity: 0.8,
  },
  
  // Toggle Switch Styles
  toggleContainer: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 2,
  },
  toggleLabelDisabled: {
    color: '#9f1239',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#9f1239',
    lineHeight: 18,
  },
  toggleDescriptionDisabled: {
    color: '#d1d5db',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: '#be185d',
  },
  toggleSwitchDisabled: {
    backgroundColor: '#f3f4f6',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  toggleThumbDisabled: {
    backgroundColor: '#e5e7eb',
  },
  
  // Advanced Features Styles
  advancedFeaturesSection: {
    marginTop: 32,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fefbff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e879f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 20,
    lineHeight: 20,
  },
  advancedOptionsContainer: {
    marginTop: 16,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#f9a8d4',
  },
  advancedPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  advancedPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
  },
  advancedPreviewItem: {
    fontSize: 14,
    color: '#15803d',
    marginBottom: 4,
    paddingLeft: 8,
  },
  
  // Template Integration Styles
  templateSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#fef7ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  templateSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  templateSectionSubtitle: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 16,
    lineHeight: 20,
  },
  templateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  templateButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    alignItems: 'center',
    gap: 8,
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#831843',
    textAlign: 'center',
  },
  templateButtonSubtext: {
    fontSize: 12,
    color: '#9f1239',
    textAlign: 'center',
  },
});

export default ChoreManagement;