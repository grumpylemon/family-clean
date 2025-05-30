import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Modal,
  TextInput
} from 'react-native';
import { UniversalIcon } from './ui/UniversalIcon';
import { useFamily } from '../hooks/useZustandHooks';
import { useAccessControl } from '../hooks/useAccessControl';
import { Pet, PetType, PetSize, PetActivityLevel } from '../types';
import { 
  createPet, 
  updatePet, 
  deletePet, 
  getPetsByFamily,
  generateChoresForPet,
  getTemplatesForPetType,
  checkUrgentCareNeeded
} from '../services/petService';
import { addChore } from '../services/firestore';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Toast } from './ui/Toast';

// PetManagement component props (empty for now, but structured for future expansion)
interface PetManagementProps {
  // Future props can be added here
}

interface PetFormData {
  name: string;
  type: PetType;
  breed: string;
  age: string;
  size: PetSize;
  activityLevel: PetActivityLevel;
  notes: string;
  feedingTimes: string;
  exerciseMinutesDaily: string;
  groomingFrequencyDays: string;
}

const PetManagement: React.FC<PetManagementProps> = () => {
  const { family, refreshFamily } = useFamily();
  const { canManageChores } = useAccessControl();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    type: 'dog',
    breed: '',
    age: '',
    size: 'medium',
    activityLevel: 'medium',
    notes: '',
    feedingTimes: '2',
    exerciseMinutesDaily: '30',
    groomingFrequencyDays: '7',
  });

  // Load pets on component mount
  useEffect(() => {
    loadPets();
  }, [family?.id]);

  const loadPets = async () => {
    if (!family?.id) return;
    
    try {
      setLoading(true);
      const familyPets = await getPetsByFamily(family.id);
      setPets(familyPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      Toast.show('Error loading pets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'dog',
      breed: '',
      age: '',
      size: 'medium',
      activityLevel: 'medium',
      notes: '',
      feedingTimes: '2',
      exerciseMinutesDaily: '30',
      groomingFrequencyDays: '7',
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingPet(null);
    setShowAddModal(true);
  };

  const openEditModal = (pet: Pet) => {
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      size: pet.size || 'medium',
      activityLevel: pet.activityLevel || 'medium',
      notes: pet.notes || '',
      feedingTimes: pet.careSettings.feedingTimes.toString(),
      exerciseMinutesDaily: pet.careSettings.exerciseMinutesDaily.toString(),
      groomingFrequencyDays: pet.careSettings.groomingFrequencyDays.toString(),
    });
    setEditingPet(pet);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingPet(null);
    resetForm();
  };

  const handleSavePet = async () => {
    if (!family?.id || !formData.name.trim()) {
      Toast.show('Please enter a pet name', 'error');
      return;
    }

    try {
      setLoading(true);

      const petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        type: formData.type,
        breed: formData.breed.trim() || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        size: formData.size,
        activityLevel: formData.activityLevel,
        familyId: family.id,
        isActive: true,
        notes: formData.notes.trim() || undefined,
        careSettings: {
          feedingTimes: parseInt(formData.feedingTimes) || 2,
          feedingHours: [8, 18], // Default morning and evening
          exerciseMinutesDaily: parseInt(formData.exerciseMinutesDaily) || 30,
          groomingFrequencyDays: parseInt(formData.groomingFrequencyDays) || 7,
        },
      };

      if (editingPet) {
        await updatePet(editingPet.id!, petData);
        Toast.show('Pet updated successfully', 'success');
      } else {
        const petId = await createPet(petData);
        Toast.show('Pet added successfully', 'success');
        
        // Generate initial chores for new pet
        if (canManageChores) {
          await generateInitialChores(petId, petData);
        }
      }

      await loadPets();
      closeModal();
    } catch (error) {
      console.error('Error saving pet:', error);
      Toast.show('Error saving pet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateInitialChores = async (petId: string, petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!family?.id) return;

    try {
      const pet: Pet = { ...petData, id: petId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const choreTemplates = generateChoresForPet(pet, family.id);
      
      // Create the first set of chores
      for (const choreData of choreTemplates.slice(0, 3)) { // Start with first 3 chores
        await addChore({
          ...choreData,
          createdAt: new Date().toISOString(),
        });
      }
      
      Toast.show(`Generated ${choreTemplates.slice(0, 3).length} initial chores for ${petData.name}`, 'success');
    } catch (error) {
      console.error('Error generating initial chores:', error);
    }
  };

  const handleDeletePet = async () => {
    if (!deletingPet) return;

    try {
      setLoading(true);
      await deletePet(deletingPet.id!);
      await loadPets();
      Toast.show('Pet removed successfully', 'success');
    } catch (error) {
      console.error('Error deleting pet:', error);
      Toast.show('Error removing pet', 'error');
    } finally {
      setLoading(false);
      setDeletingPet(null);
    }
  };

  const generateChoresForPetManually = async (pet: Pet) => {
    if (!family?.id || !canManageChores) return;

    try {
      setGenerating(pet.id!);
      const choreTemplates = generateChoresForPet(pet, family.id);
      
      let createdCount = 0;
      for (const choreData of choreTemplates) {
        await addChore({
          ...choreData,
          createdAt: new Date().toISOString(),
        });
        createdCount++;
      }
      
      Toast.show(`Generated ${createdCount} chores for ${pet.name}`, 'success');
      await refreshFamily();
    } catch (error) {
      console.error('Error generating chores:', error);
      Toast.show('Error generating chores', 'error');
    } finally {
      setGenerating(null);
    }
  };

  const getPetIcon = (type: PetType): string => {
    switch (type) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'fish': return '🐠';
      case 'hamster': return '🐹';
      case 'rabbit': return '🐰';
      case 'reptile': return '🦎';
      default: return '🐾';
    }
  };

  const getPetTypeTemplateCount = (type: PetType): number => {
    return getTemplatesForPetType(type).length;
  };

  if (loading && pets.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Our Lovely Pets</Text>
        {canManageChores && (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <UniversalIcon name="add" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add New Pet</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pets Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyTitle}>No pets yet!</Text>
            <Text style={styles.emptyMessage}>
              Add your family&apos;s pets to start tracking their care and generating chores.
            </Text>
            {canManageChores && (
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Add Your First Pet</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.petsGrid}>
            {pets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                {/* Pet Avatar */}
                <View style={styles.petAvatar}>
                  {pet.photoURL ? (
                    <Image source={{ uri: pet.photoURL }} style={styles.petImage} />
                  ) : (
                    <Text style={styles.petIcon}>{getPetIcon(pet.type)}</Text>
                  )}
                </View>

                {/* Pet Info */}
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petType}>{pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}</Text>
                  {pet.breed && <Text style={styles.petBreed}>{pet.breed}</Text>}
                  {pet.age && <Text style={styles.petAge}>{pet.age} years old</Text>}
                </View>

                {/* Related Chores */}
                <View style={styles.relatedChores}>
                  <Text style={styles.relatedTitle}>Related Chores:</Text>
                  {getTemplatesForPetType(pet.type).slice(0, 2).map((template, index) => (
                    <View key={index} style={styles.choreItem}>
                      <UniversalIcon name="paw" size={16} color="#f9a8d4" />
                      <Text style={styles.choreText}>
                        {template.name.replace('for ${pet.name}', '')} ({template.points} pts)
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                {canManageChores && (
                  <View style={styles.petActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => generateChoresForPetManually(pet)}
                      disabled={generating === pet.id}
                    >
                      {generating === pet.id ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <UniversalIcon name="add-circle" size={16} color="#10b981" />
                          <Text style={styles.actionText}>Generate Chores</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(pet)}
                    >
                      <UniversalIcon name="pencil" size={16} color="#be185d" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setDeletingPet(pet)}
                    >
                      <UniversalIcon name="trash" size={16} color="#ef4444" />
                      <Text style={styles.actionText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Pet Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <UniversalIcon name="close" size={24} color="#831843" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPet ? 'Edit Pet' : 'Add New Pet'}
            </Text>
            <TouchableOpacity onPress={handleSavePet}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.fieldLabel}>Pet Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter pet name"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.fieldLabel}>Pet Type *</Text>
              <View style={styles.selectContainer}>
                {['dog', 'cat', 'bird', 'fish', 'hamster', 'rabbit', 'reptile', 'other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.selectOption,
                      formData.type === type && styles.selectOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, type: type as PetType })}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      formData.type === type && styles.selectOptionTextSelected
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Breed</Text>
              <TextInput
                style={styles.textInput}
                value={formData.breed}
                onChangeText={(text) => setFormData({ ...formData, breed: text })}
                placeholder="Enter breed (optional)"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.fieldLabel}>Age (years)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                placeholder="Enter age"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Size</Text>
              <View style={styles.selectContainer}>
                {['small', 'medium', 'large'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.selectOption,
                      formData.size === size && styles.selectOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, size: size as PetSize })}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      formData.size === size && styles.selectOptionTextSelected
                    ]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Activity Level</Text>
              <View style={styles.selectContainer}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.selectOption,
                      formData.activityLevel === level && styles.selectOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, activityLevel: level as PetActivityLevel })}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      formData.activityLevel === level && styles.selectOptionTextSelected
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Care Settings */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Care Settings</Text>
              
              <Text style={styles.fieldLabel}>Feeding Times per Day</Text>
              <TextInput
                style={styles.textInput}
                value={formData.feedingTimes}
                onChangeText={(text) => setFormData({ ...formData, feedingTimes: text })}
                placeholder="2"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Exercise Minutes Daily</Text>
              <TextInput
                style={styles.textInput}
                value={formData.exerciseMinutesDaily}
                onChangeText={(text) => setFormData({ ...formData, exerciseMinutesDaily: text })}
                placeholder="30"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Grooming Frequency (days)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.groomingFrequencyDays}
                onChangeText={(text) => setFormData({ ...formData, groomingFrequencyDays: text })}
                placeholder="7"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Special care notes, behaviors, preferences..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Template Preview */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Available Chore Templates</Text>
              <Text style={styles.templateCount}>
                {getPetTypeTemplateCount(formData.type)} chore templates available for {formData.type}s
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deletingPet}
        title="Remove Pet"
        message={`Are you sure you want to remove ${deletingPet?.name}? This will also remove all associated chores.`}
        confirmText="Remove"
        confirmStyle="destructive"
        onConfirm={handleDeletePet}
        onCancel={() => setDeletingPet(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#be185d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#be185d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  petsGrid: {
    gap: 20,
  },
  petCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  petAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  petIcon: {
    fontSize: 40,
  },
  petInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  petType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#be185d',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 2,
  },
  petAge: {
    fontSize: 14,
    color: '#9f1239',
  },
  relatedChores: {
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  choreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  choreText: {
    fontSize: 14,
    color: '#9f1239',
  },
  petActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fdf2f8',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#831843',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#be185d',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#831843',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectOption: {
    backgroundColor: '#fce7f3',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectOptionSelected: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
  },
  selectOptionTextSelected: {
    color: '#ffffff',
  },
  templateCount: {
    fontSize: 14,
    color: '#9f1239',
    fontStyle: 'italic',
  },
});

export default PetManagement;