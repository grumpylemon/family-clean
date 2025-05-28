import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFamily } from '../contexts/FamilyContext';
import { useAccessControl } from '../hooks/useAccessControl';
import {
  createRoom,
  updateRoom,
  deleteRoom,
  getFamilyRooms,
  assignMemberToRoom,
  removeMemberFromRoom,
  getUserRoomAssignments,
  generateRoomChores,
  getRoomTypeDisplayName,
  getSharingTypeDisplayName,
  getRoomTypeEmoji
} from '../services/roomService';
import { addDoc } from 'firebase/firestore';
import { safeCollection } from '../config/firebase';
import {
  Room,
  RoomType,
  RoomSharingType,
  RoomAssignment,
  FamilyMember,
  Chore
} from '../types';
import LoadingSpinner from './ui/LoadingSpinner';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import Avatar from './ui/Avatar';

const ROOM_TYPES: RoomType[] = [
  'bedroom', 'bathroom', 'kitchen', 'living_room', 'dining_room',
  'laundry_room', 'office', 'playroom', 'garage', 'outdoor', 'other'
];

const SHARING_TYPES: RoomSharingType[] = ['private', 'shared', 'common'];

interface RoomFormData {
  name: string;
  type: RoomType;
  sharingType: RoomSharingType;
  description: string;
}

const RoomManagement: React.FC = () => {
  const { family, refreshFamily } = useFamily();
  const { canManageMembers } = useAccessControl();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [assignments, setAssignments] = useState<{ [roomId: string]: RoomAssignment[] }>({});
  
  // Form states
  const [formData, setFormData] = useState<RoomFormData>({
    name: '',
    type: 'bedroom',
    sharingType: 'private',
    description: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadRooms();
  }, [family?.id]);

  const loadRooms = async () => {
    if (!family?.id) return;
    
    try {
      setLoading(true);
      const familyRooms = await getFamilyRooms(family.id);
      setRooms(familyRooms);
      
      // Load assignments for each room
      const roomAssignments: { [roomId: string]: RoomAssignment[] } = {};
      for (const room of familyRooms) {
        if (room.id) {
          // For now, we'll reconstruct assignments from room.assignedMembers
          // In a full implementation, you'd fetch from roomAssignments collection
          const members = family.members.filter(member => 
            room.assignedMembers.includes(member.uid)
          );
          roomAssignments[room.id] = members.map(member => ({
            roomId: room.id!,
            roomName: room.name,
            userId: member.uid,
            userName: member.name,
            familyId: family.id!,
            isPrimary: room.primaryAssignee === member.uid,
            assignedAt: new Date().toISOString(),
            assignedBy: family.adminId
          }));
        }
      }
      setAssignments(roomAssignments);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setToast({ message: 'Failed to load rooms', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bedroom',
      sharingType: 'private',
      description: ''
    });
    setEditingRoom(null);
  };

  const handleAddRoom = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditRoom = (room: Room) => {
    setFormData({
      name: room.name,
      type: room.type,
      sharingType: room.sharingType,
      description: room.description || ''
    });
    setEditingRoom(room);
    setShowAddModal(true);
  };

  const handleSaveRoom = async () => {
    if (!family?.id || !formData.name.trim()) {
      setToast({ message: 'Room name is required', type: 'error' });
      return;
    }

    try {
      setSaveLoading(true);

      if (editingRoom) {
        // Update existing room
        await updateRoom(editingRoom.id!, {
          name: formData.name.trim(),
          type: formData.type,
          sharingType: formData.sharingType,
          description: formData.description.trim()
        });
        setToast({ message: 'Room updated successfully', type: 'success' });
      } else {
        // Create new room
        await createRoom({
          name: formData.name.trim(),
          type: formData.type,
          sharingType: formData.sharingType,
          description: formData.description.trim(),
          familyId: family.id,
          assignedMembers: [],
          createdBy: family.adminId
        });
        setToast({ message: 'Room created successfully', type: 'success' });
      }

      setShowAddModal(false);
      resetForm();
      await loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      setToast({ message: 'Failed to save room', type: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!room.id) return;

    const confirm = await ConfirmDialog({
      title: 'Delete Room',
      message: `Are you sure you want to delete "${room.name}"? This will remove all assignments and related chores.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirm) return;

    try {
      await deleteRoom(room.id);
      setToast({ message: 'Room deleted successfully', type: 'success' });
      await loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      setToast({ message: 'Failed to delete room', type: 'error' });
    }
  };

  const handleAssignMember = async (member: FamilyMember, isPrimary: boolean = false) => {
    if (!selectedRoom?.id || !family?.id) return;

    try {
      setAssignLoading(true);
      await assignMemberToRoom(
        selectedRoom.id,
        member.uid,
        member.name,
        family.id,
        isPrimary
      );
      
      setToast({ 
        message: `${member.name} assigned to ${selectedRoom.name}`, 
        type: 'success' 
      });
      
      await loadRooms();
    } catch (error) {
      console.error('Error assigning member:', error);
      setToast({ message: 'Failed to assign member', type: 'error' });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignMember = async (member: FamilyMember) => {
    if (!selectedRoom?.id) return;

    try {
      await removeMemberFromRoom(selectedRoom.id, member.uid);
      setToast({ 
        message: `${member.name} removed from ${selectedRoom.name}`, 
        type: 'success' 
      });
      
      await loadRooms();
    } catch (error) {
      console.error('Error unassigning member:', error);
      setToast({ message: 'Failed to remove member', type: 'error' });
    }
  };

  const handleGenerateChores = async (room: Room) => {
    if (!room.id || !family?.id) return;

    try {
      const generatedChores = await generateRoomChores(family.id, room.id);
      
      if (generatedChores.length === 0) {
        setToast({ message: 'No chores to generate for this room', type: 'error' });
        return;
      }

      // Add chores to Firestore
      const choresCollection = safeCollection('chores');
      for (const chore of generatedChores) {
        await addDoc(choresCollection, chore);
      }

      setToast({ 
        message: `Generated ${generatedChores.length} chores for ${room.name}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error generating chores:', error);
      setToast({ message: 'Failed to generate chores', type: 'error' });
    }
  };

  const renderRoomCard = (room: Room) => {
    const roomAssignments = assignments[room.id!] || [];
    const primaryAssignee = roomAssignments.find(a => a.isPrimary);
    
    return (
      <View key={room.id} style={styles.roomCard}>
        <View style={styles.roomHeader}>
          <View style={styles.roomTitleRow}>
            <Text style={styles.roomEmoji}>{getRoomTypeEmoji(room.type)}</Text>
            <View style={styles.roomTitleContainer}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomType}>
                {getRoomTypeDisplayName(room.type)} • {getSharingTypeDisplayName(room.sharingType)}
              </Text>
            </View>
          </View>
          
          <View style={styles.roomActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditRoom(room)}
            >
              <Ionicons name="pencil" size={16} color="#be185d" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteRoom(room)}
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {room.description && (
          <Text style={styles.roomDescription}>{room.description}</Text>
        )}

        <View style={styles.assignmentSection}>
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentTitle}>Assigned Members</Text>
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => {
                setSelectedRoom(room);
                setShowAssignModal(true);
              }}
            >
              <Ionicons name="person-add" size={16} color="#be185d" />
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
          </View>

          {roomAssignments.length > 0 ? (
            <View style={styles.membersList}>
              {roomAssignments.map((assignment) => (
                <View key={assignment.userId} style={styles.memberItem}>
                  <Avatar 
                    user={{ 
                      uid: assignment.userId, 
                      displayName: assignment.userName,
                      photoURL: family?.members.find(m => m.uid === assignment.userId)?.photoURL 
                    } as any}
                    size={32}
                    showStatus={false}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{assignment.userName}</Text>
                    {assignment.isPrimary && (
                      <Text style={styles.primaryLabel}>Primary</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      const member = family?.members.find(m => m.uid === assignment.userId);
                      if (member) handleUnassignMember(member);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMembers}>No members assigned</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => handleGenerateChores(room)}
        >
          <Ionicons name="refresh" size={16} color="#be185d" />
          <Text style={styles.generateButtonText}>Generate Chores</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!canManageMembers) {
    return (
      <View style={styles.accessDenied}>
        <Ionicons name="lock-closed" size={48} color="#9f1239" />
        <Text style={styles.accessDeniedText}>Admin access required</Text>
        <Text style={styles.accessDeniedSubtext}>
          You need admin permissions to manage rooms and spaces.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Room & Space Management</Text>
          <Text style={styles.subtitle}>
            Manage family rooms and assign responsibilities
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddRoom}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Room</Text>
        </TouchableOpacity>

        {rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="home" size={64} color="#f9a8d4" />
            <Text style={styles.emptyTitle}>No rooms yet</Text>
            <Text style={styles.emptyText}>
              Add rooms to organize chores by space and assign responsibilities to family members.
            </Text>
          </View>
        ) : (
          <View style={styles.roomsList}>
            {rooms.map(renderRoomCard)}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Room Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={24} color="#831843" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Room Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Master Bedroom, Kids' Bathroom"
                  placeholderTextColor="#9f1239"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Room Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                  {ROOM_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && styles.typeButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type }))}
                    >
                      <Text style={styles.typeEmoji}>{getRoomTypeEmoji(type)}</Text>
                      <Text style={[
                        styles.typeText,
                        formData.type === type && styles.typeTextActive
                      ]}>
                        {getRoomTypeDisplayName(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Sharing Type</Text>
                <View style={styles.sharingOptions}>
                  {SHARING_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.sharingButton,
                        formData.sharingType === type && styles.sharingButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, sharingType: type }))}
                    >
                      <Text style={[
                        styles.sharingText,
                        formData.sharingType === type && styles.sharingTextActive
                      ]}>
                        {getSharingTypeDisplayName(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Additional details about this room..."
                  placeholderTextColor="#9f1239"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveRoom}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingRoom ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Assignment Modal */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Assign Members to {selectedRoom?.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAssignModal(false)}
              >
                <Ionicons name="close" size={24} color="#831843" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.memberAssignList}>
              {family?.members
                .filter(member => member.isActive)
                .map((member) => {
                  const isAssigned = selectedRoom?.assignedMembers.includes(member.uid);
                  const isPrimary = selectedRoom?.primaryAssignee === member.uid;
                  
                  return (
                    <View key={member.uid} style={styles.assignMemberItem}>
                      <Avatar user={member as any} size={40} />
                      <View style={styles.assignMemberInfo}>
                        <Text style={styles.assignMemberName}>{member.name}</Text>
                        <Text style={styles.assignMemberRole}>{member.familyRole}</Text>
                      </View>
                      
                      <View style={styles.assignActions}>
                        {!isAssigned ? (
                          <>
                            <TouchableOpacity
                              style={styles.assignMemberButton}
                              onPress={() => handleAssignMember(member, false)}
                              disabled={assignLoading}
                            >
                              <Text style={styles.assignMemberButtonText}>Assign</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.assignPrimaryButton}
                              onPress={() => handleAssignMember(member, true)}
                              disabled={assignLoading}
                            >
                              <Text style={styles.assignPrimaryButtonText}>Primary</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={styles.assignedIndicator}>
                            {isPrimary && <Text style={styles.primaryBadge}>Primary</Text>}
                            <TouchableOpacity
                              style={styles.unassignButton}
                              onPress={() => handleUnassignMember(member)}
                            >
                              <Text style={styles.unassignButtonText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#831843',
    fontWeight: '600',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    padding: 24,
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    textAlign: 'center',
    marginTop: 16,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9f1239',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#be185d',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    lineHeight: 24,
  },
  roomsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  roomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  roomTitleContainer: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  roomType: {
    fontSize: 14,
    color: '#9f1239',
    fontWeight: '500',
  },
  roomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f9a8d4',
  },
  roomDescription: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 16,
    lineHeight: 20,
  },
  assignmentSection: {
    marginBottom: 16,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9a8d4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  assignButtonText: {
    color: '#be185d',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fbcfe8',
    borderRadius: 12,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  primaryLabel: {
    fontSize: 12,
    color: '#be185d',
    fontWeight: '600',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  noMembers: {
    fontSize: 14,
    color: '#9f1239',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9a8d4',
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#be185d',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#831843',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeScroll: {
    marginTop: 8,
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f9a8d4',
    minWidth: 80,
  },
  typeButtonActive: {
    backgroundColor: '#be185d',
  },
  typeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#831843',
    fontWeight: '600',
    textAlign: 'center',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  sharingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sharingButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
  },
  sharingButtonActive: {
    backgroundColor: '#be185d',
  },
  sharingText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
  },
  sharingTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#831843',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#be185d',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberAssignList: {
    padding: 20,
    maxHeight: 400,
  },
  assignMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fbcfe8',
    borderRadius: 12,
    marginBottom: 12,
  },
  assignMemberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assignMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  assignMemberRole: {
    fontSize: 14,
    color: '#9f1239',
    marginTop: 2,
  },
  assignActions: {
    flexDirection: 'row',
    gap: 8,
  },
  assignMemberButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#be185d',
    borderRadius: 8,
  },
  assignMemberButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  assignPrimaryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#831843',
    borderRadius: 8,
  },
  assignPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  assignedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBadge: {
    backgroundColor: '#831843',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  unassignButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  unassignButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RoomManagement;