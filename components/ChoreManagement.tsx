import { useFamily } from '@/contexts/FamilyContext';
import { createChore, deleteChore, getChores, updateChore } from '@/services/firestore';
import { Chore, ChoreDifficulty, ChoreType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';

interface ChoreManagementProps {
  visible: boolean;
  onClose: () => void;
}

export function ChoreManagement({ visible, onClose }: ChoreManagementProps) {
  const { family, isAdmin } = useFamily();
  const [loading, setLoading] = useState(false);
  const [chores, setChores] = useState<Chore[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  
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

  useEffect(() => {
    if (visible && family) {
      loadChores();
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
      Alert.alert('Error', 'Failed to load chores');
    } finally {
      setLoading(false);
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
    setEditingChore(null);
    setShowForm(false);
  };

  const handleSaveChore = async () => {
    if (!family || !title.trim()) {
      Alert.alert('Error', 'Please enter a chore title');
      return;
    }

    setLoading(true);
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

      if (editingChore) {
        await updateChore(editingChore.id!, choreData);
        if (Platform.OS === 'web') {
          window.alert('Chore updated successfully');
        } else {
          Alert.alert('Success', 'Chore updated successfully');
        }
      } else {
        await createChore(choreData);
        if (Platform.OS === 'web') {
          window.alert('Chore created successfully');
        } else {
          Alert.alert('Success', 'Chore created successfully');
        }
      }

      resetForm();
      await loadChores();
    } catch (error) {
      Alert.alert('Error', 'Failed to save chore');
      console.error('Error saving chore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChore = (chore: Chore) => {
    console.log('Delete button clicked for chore:', chore.title, 'ID:', chore.id);
    
    // For web compatibility, use a simple confirm dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${chore.title}"?`);
      if (confirmed) {
        performDelete(chore);
      }
    } else {
      Alert.alert(
        'Delete Chore',
        `Are you sure you want to delete "${chore.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDelete(chore),
          },
        ]
      );
    }
  };

  const performDelete = async (chore: Chore) => {
    console.log('Delete confirmed for chore:', chore.id);
    setLoading(true);
    try {
      const success = await deleteChore(chore.id!);
      console.log('Delete result:', success);
      if (success) {
        if (Platform.OS === 'web') {
          window.alert('Chore deleted successfully');
        } else {
          Alert.alert('Success', 'Chore deleted successfully');
        }
        await loadChores();
      } else {
        if (Platform.OS === 'web') {
          window.alert('Failed to delete chore');
        } else {
          Alert.alert('Error', 'Failed to delete chore');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to delete chore');
      } else {
        Alert.alert('Error', 'Failed to delete chore');
      }
      console.error('Error deleting chore:', error);
    } finally {
      setLoading(false);
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
    setShowForm(true);
  };

  const getTypeColor = (type: ChoreType) => {
    switch (type) {
      case 'individual': return '#4285F4';
      case 'family': return '#34A853';
      case 'pet': return '#FBBC04';
      case 'shared': return '#EA4335';
      default: return '#666';
    }
  };

  const getDifficultyColor = (difficulty: ChoreDifficulty) => {
    switch (difficulty) {
      case 'easy': return '#34A853';
      case 'medium': return '#FBBC04';
      case 'hard': return '#EA4335';
      default: return '#666';
    }
  };

  const isChoreLocked = (chore: Chore) => {
    if (!chore.lockedUntil) return false;
    const lockedUntil = new Date(chore.lockedUntil);
    return lockedUntil > new Date();
  };

  if (!isAdmin) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <ThemedText style={styles.errorText}>
            Only family admins can manage chores
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

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Title *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter chore title"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description (optional)"
                  multiline
                  numberOfLines={3}
                />
              </View>

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

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Points</ThemedText>
                <TextInput
                  style={styles.input}
                  value={points}
                  onChangeText={setPoints}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>

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

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Cooldown Hours</ThemedText>
                <TextInput
                  style={styles.input}
                  value={cooldownHours}
                  onChangeText={setCooldownHours}
                  placeholder="24"
                  keyboardType="numeric"
                />
              </View>

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
                  disabled={loading}
                >
                  <ThemedText style={styles.saveButtonText}>
                    {loading ? 'Saving...' : editingChore ? 'Update' : 'Create'}
                  </ThemedText>
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

            <ScrollView style={styles.scrollView}>
              {loading ? (
                <ActivityIndicator size="large" color="#4285F4" />
              ) : chores.length === 0 ? (
                <ThemedText style={styles.emptyText}>No chores created yet</ThemedText>
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
                          >
                            <ThemedText style={styles.deleteText}>Delete</ThemedText>
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

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
          </View>
        )}
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
    color: '#4285F4',
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
    backgroundColor: '#4285F4',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.5,
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#EA4335',
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
    color: '#4285F4',
    fontSize: 14,
  },
  deleteText: {
    color: '#EA4335',
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
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
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
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
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
    backgroundColor: '#4285F4',
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
    borderColor: '#4285F4',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#4285F4',
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
    backgroundColor: '#4285F4',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});