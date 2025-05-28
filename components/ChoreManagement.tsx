import { useFamily } from '@/contexts/FamilyContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { createChore, deleteChore, getChores, updateChore, createRoomChore } from '@/services/firestore';
import { getFamilyRooms, getRoomTypeDisplayName, getRoomTypeEmoji } from '@/services/roomService';
import { Chore, ChoreDifficulty, ChoreType, Room, RoomType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { TestDataGenerator } from './TestDataGenerator';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Toast } from './ui/Toast';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ValidatedInput } from './ui/ValidatedInput';
import { useFormValidation, validationRules } from '@/hooks/useFormValidation';

interface ChoreManagementProps {
  visible: boolean;
  onClose: () => void;
}

export function ChoreManagement({ visible, onClose }: ChoreManagementProps) {
  const { family } = useFamily();
  const { canManageChores, getPermissionErrorMessage } = useAccessControl();
  const [loading, setLoading] = useState(false);
  const [savingChore, setSavingChore] = useState(false);
  const [deletingChoreId, setDeletingChoreId] = useState<string | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [choreToDelete, setChoreToDelete] = useState<Chore | null>(null);
  
  // Form validation
  const { errors, handleFieldChange, handleFieldBlur, validateAll, resetValidation, isFieldValid } = useFormValidation({
    title: [validationRules.required('Chore title is required'), validationRules.maxLength(50)],
    description: [validationRules.maxLength(200, 'Description is too long')],
    points: [validationRules.required('Points are required'), validationRules.numeric(), validationRules.min(1), validationRules.max(100)],
    frequencyDays: [validationRules.numeric(), validationRules.min(1), validationRules.max(365)],
    cooldownHours: [validationRules.numeric(), validationRules.min(0), validationRules.max(168, 'Maximum 1 week')],
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
    if (!family) return;
    
    setLoading(true);
    try {
      const familyChores = await getChores(family.id!);
      setChores(familyChores);
    } catch (error) {
      console.error('Error loading chores:', error);
      Toast.error('Failed to load chores');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!family) return;
    
    try {
      const familyRooms = await getFamilyRooms(family.id!);
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
  };

  const handleSaveChore = async () => {
    if (!family) return;
    
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
        familyId: family.id!,
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

      if (editingChore) {
        await updateChore(editingChore.id!, choreData);
        Toast.success('Chore updated successfully');
      } else {
        // Use room-specific creation if it's a room chore
        if (choreType === 'room' && selectedRoomId) {
          const selectedRoom = rooms.find(room => room.id === selectedRoomId);
          if (selectedRoom) {
            await createRoomChore(choreData, selectedRoom.id!, selectedRoom.name, selectedRoom.type);
          } else {
            await createChore(choreData);
          }
        } else {
          await createChore(choreData);
        }
        Toast.success('Chore created successfully');
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

  if (!canManageChores) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <ThemedText style={styles.errorText}>
            {getPermissionErrorMessage('admin')}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Manage Chores</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </View>

        {showForm ? (
          <ScrollView style={styles.scrollView}>
            <View style={styles.form}>
              <ThemedText style={styles.formTitle}>
                {editingChore ? 'Edit Chore' : 'Create New Chore'}
              </ThemedText>

              <ValidatedInput
                label="Title *"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  handleFieldChange('title', text);
                }}
                onBlur={() => handleFieldBlur('title', title)}
                placeholder="Enter chore title"
                error={errors.title}
                isValid={isFieldValid('title')}
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
                error={errors.description}
                isValid={isFieldValid('description')}
              />

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Type</ThemedText>
                <View style={styles.buttonGroup}>
                  {(['individual', 'family', 'pet', 'shared'] as ChoreType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        choreType === type && styles.typeButtonSelected,
                        { borderColor: getTypeColor(type) }
                      ]}
                      onPress={() => setChoreType(type)}
                    >
                      <ThemedText
                        style={[
                          styles.typeButtonText,
                          choreType === type && { color: getTypeColor(type) }
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Difficulty</ThemedText>
                <View style={styles.buttonGroup}>
                  {(['easy', 'medium', 'hard'] as ChoreDifficulty[]).map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.diffButton,
                        difficulty === diff && styles.diffButtonSelected,
                        { borderColor: getDifficultyColor(diff) }
                      ]}
                      onPress={() => setDifficulty(diff)}
                    >
                      <ThemedText
                        style={[
                          styles.diffButtonText,
                          difficulty === diff && { color: getDifficultyColor(diff) }
                        ]}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Room Selection - only show for room chores */}
              {choreType === 'room' && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Select Room</ThemedText>
                  {rooms.length > 0 ? (
                    <View style={styles.roomSelect}>
                      <TouchableOpacity
                        style={[styles.roomOption, !selectedRoomId && styles.roomOptionSelected]}
                        onPress={() => setSelectedRoomId('')}
                      >
                        <ThemedText style={styles.roomOptionText}>No Room</ThemedText>
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
                          <ThemedText style={styles.roomEmoji}>
                            {getRoomTypeEmoji(room.type)}
                          </ThemedText>
                          <View style={styles.roomOptionContent}>
                            <ThemedText style={styles.roomOptionText}>{room.name}</ThemedText>
                            <ThemedText style={styles.roomOptionSubtext}>
                              {getRoomTypeDisplayName(room.type)}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noRoomsMessage}>
                      <ThemedText style={styles.noRoomsText}>
                        No rooms available. Create rooms first to assign room-based chores.
                      </ThemedText>
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
                error={errors.points}
                isValid={isFieldValid('points')}
              />

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Assign To</ThemedText>
                <View style={styles.memberSelect}>
                  <TouchableOpacity
                    style={[styles.memberOption, !assignedTo && styles.memberOptionSelected]}
                    onPress={() => setAssignedTo('')}
                  >
                    <ThemedText style={styles.memberOptionText}>Unassigned</ThemedText>
                  </TouchableOpacity>
                  {family?.members.map((member) => (
                    <TouchableOpacity
                      key={member.uid}
                      style={[
                        styles.memberOption,
                        assignedTo === member.uid && styles.memberOptionSelected
                      ]}
                      onPress={() => setAssignedTo(member.uid)}
                    >
                      <ThemedText style={styles.memberOptionText}>{member.name}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Due Date</ThemedText>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText>{dueDate.toLocaleDateString()}</ThemedText>
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
                  <ThemedText style={styles.label}>Recurring Chore</ThemedText>
                  <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]} />
                </TouchableOpacity>
                {isRecurring && (
                  <TextInput
                    style={styles.input}
                    value={frequencyDays}
                    onChangeText={setFrequencyDays}
                    placeholder="7"
                    keyboardType="numeric"
                  />
                )}
              </View>

              <ValidatedInput
                label="Cooldown Hours"
                value={cooldownHours}
                onChangeText={(text) => {
                  setCooldownHours(text);
                  handleFieldChange('cooldownHours', text);
                }}
                onBlur={() => handleFieldBlur('cooldownHours', cooldownHours)}
                placeholder="24"
                keyboardType="numeric"
                error={errors.cooldownHours}
                isValid={isFieldValid('cooldownHours')}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={resetForm}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveChore}
                  disabled={savingChore}
                >
                  {savingChore ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>
                      {editingChore ? 'Update' : 'Create'}
                    </ThemedText>
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
              <ThemedText style={styles.createButtonText}>+ Create New Chore</ThemedText>
            </TouchableOpacity>

            {/* Test Data Generator */}
            <View style={styles.testDataSection}>
              <TestDataGenerator />
            </View>

            <ScrollView style={styles.scrollView}>
              {loading ? (
                <LoadingSpinner message="Loading chores..." />
              ) : chores.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="list-outline" size={64} color="#f9a8d4" />
                  <ThemedText style={styles.emptyStateTitle}>No chores yet</ThemedText>
                  <ThemedText style={styles.emptyStateMessage}>
                    Create your first chore to get started!
                  </ThemedText>
                </View>
              ) : (
                chores.map((chore) => {
                  const locked = isChoreLocked(chore);
                  return (
                    <View key={chore.id} style={styles.choreCard}>
                      <View style={styles.choreHeader}>
                        <ThemedText style={styles.choreTitle}>{chore.title}</ThemedText>
                        <View style={styles.choreActions}>
                          <TouchableOpacity
                            style={styles.choreActionButton}
                            onPress={() => handleEditChore(chore)}
                          >
                            <ThemedText style={styles.editText}>Edit</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.choreActionButton}
                            onPress={() => {
                              console.log('TouchableOpacity onPress triggered');
                              handleDeleteChore(chore);
                            }}
                            disabled={deletingChoreId === chore.id}
                          >
                            {deletingChoreId === chore.id ? (
                              <LoadingSpinner size="small" />
                            ) : (
                              <ThemedText style={styles.deleteText}>Delete</ThemedText>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {chore.description && (
                        <ThemedText style={styles.choreDescription}>{chore.description}</ThemedText>
                      )}

                      <View style={styles.choreDetails}>
                        <View style={styles.choreTag}>
                          <ThemedText style={[styles.choreTagText, { color: getTypeColor(chore.type) }]}>
                            {chore.type}
                          </ThemedText>
                        </View>
                        <View style={styles.choreTag}>
                          <ThemedText style={[styles.choreTagText, { color: getDifficultyColor(chore.difficulty) }]}>
                            {chore.difficulty}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.chorePoints}>{chore.points} pts</ThemedText>
                      </View>

                      <View style={styles.choreFooter}>
                        <ThemedText style={styles.choreFooterText}>
                          Due: {new Date(chore.dueDate).toLocaleDateString()}
                        </ThemedText>
                        {chore.assignedTo && (
                          <ThemedText style={styles.choreFooterText}>
                            Assigned: {family?.members.find(m => m.uid === chore.assignedTo)?.name || 'Unknown'}
                          </ThemedText>
                        )}
                        {chore.recurring?.enabled && (
                          <ThemedText style={styles.choreFooterText}>
                            Repeats every {chore.recurring.frequencyDays} days
                          </ThemedText>
                        )}
                      </View>

                      {locked && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <Ionicons name="lock-closed" size={16} color="#ef4444" />
                          <ThemedText style={{ color: '#ef4444', marginLeft: 4 }}>
                            Locked until {new Date(chore.lockedUntil!).toLocaleString()}
                          </ThemedText>
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

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#be185d',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    color: '#ef4444',
    marginTop: 50,
  },
  choreCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#1f2937',
  },
  choreActions: {
    flexDirection: 'row',
    gap: 8,
  },
  choreActionButton: {
    padding: 8,
    minWidth: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  editText: {
    color: '#be185d',
    fontSize: 14,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
  },
  choreDescription: {
    fontSize: 14,
    opacity: 0.7,
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
    opacity: 0.7,
  },
  form: {
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
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
    borderRadius: 4,
    borderWidth: 1,
  },
  typeButtonSelected: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
  },
  typeButtonText: {
    fontSize: 14,
  },
  diffButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  diffButtonSelected: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
  },
  diffButtonText: {
    fontSize: 14,
  },
  memberSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  memberOptionSelected: {
    backgroundColor: '#be185d',
  },
  memberOptionText: {
    fontSize: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
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
    paddingVertical: 10,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#be185d',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
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
});