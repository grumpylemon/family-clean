import { useFamily } from '@/hooks/useZustandHooks';
import { useAccessControl } from '@/hooks/useAccessControl';
import { createChore, deleteChore, getChores, updateChore, createRoomChore } from '@/services/firestore';
import { getFamilyRooms, getRoomTypeDisplayName, getRoomTypeEmoji } from '@/services/roomService';
import { Chore, ChoreDifficulty, ChoreType, Room, RoomType } from '@/types';
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
                <Text style={styles.label}>Type</Text>
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
                      <Text
                        style={[
                          styles.typeButtonText,
                          choreType === type && { color: getTypeColor(type) }
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Difficulty</Text>
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
                      <Text
                        style={[
                          styles.diffButtonText,
                          difficulty === diff && { color: getDifficultyColor(diff) }
                        ]}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
                error={errors.points}
                isValid={isFieldValid('points')}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign To</Text>
                <View style={styles.memberSelect}>
                  <TouchableOpacity
                    style={[styles.memberOption, !assignedTo && styles.memberOptionSelected]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text style={styles.memberOptionText}>Unassigned</Text>
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
                      <Text style={styles.memberOptionText}>{member.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveChore}
                  disabled={savingChore}
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
                            style={styles.choreActionButton}
                            onPress={() => handleEditChore(chore)}
                          >
                            <Text style={styles.editText}>Edit</Text>
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
                              <Text style={styles.deleteText}>Delete</Text>
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

export default ChoreManagement;