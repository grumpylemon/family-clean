import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { FamilyMember, FamilyRole, Room, RoomAssignment } from '@/types';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { Avatar } from './ui/Avatar';
import { Toast } from './ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { 
  getUserRoomAssignments, 
  getFamilyRooms, 
  assignMemberToRoom, 
  removeMemberFromRoom,
  getRoomTypeEmoji,
  getRoomTypeDisplayName 
} from '@/services/roomService';

interface ManageMembersProps {
  visible: boolean;
  onClose: () => void;
}

interface EditMemberModalProps {
  member: FamilyMember | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  canManageMembers: boolean;
  canPromoteDemoteMembers: boolean;
  isOriginalAdmin: boolean;
  currentUserId?: string;
  familyId?: string;
  familyMembers: FamilyMember[];
}

export function ManageMembers({ visible, onClose }: ManageMembersProps) {
  const { user } = useAuth();
  const { family, refreshFamily } = useFamily();
  const { canManageMembers, canPromoteDemoteMembers, getPermissionErrorMessage } = useAccessControl();
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'excluded'>('all');
  
  // Room management states
  const [memberRoomAssignments, setMemberRoomAssignments] = useState<{ [userId: string]: RoomAssignment[] }>({});
  const [familyRooms, setFamilyRooms] = useState<Room[]>([]);
  const [showRoomAssignModal, setShowRoomAssignModal] = useState(false);
  const [selectedMemberForRooms, setSelectedMemberForRooms] = useState<FamilyMember | null>(null);
  const [roomAssignLoading, setRoomAssignLoading] = useState(false);

  // Load room assignments for all members when modal opens
  useEffect(() => {
    if (visible && family?.id) {
      loadRoomData();
    }
  }, [visible, family?.id]);

  if (!family) return null;

  const loadRoomData = async () => {
    if (!family?.id) return;
    
    try {
      // Load all family rooms
      const rooms = await getFamilyRooms(family.id);
      setFamilyRooms(rooms);
      
      // Load room assignments for each member
      const assignments: { [userId: string]: RoomAssignment[] } = {};
      for (const member of family.members) {
        const memberAssignments = await getUserRoomAssignments(member.uid, family.id);
        assignments[member.uid] = memberAssignments;
      }
      setMemberRoomAssignments(assignments);
    } catch (error) {
      console.error('Error loading room data:', error);
    }
  };

  const showSuccessMessage = (message: string) => {
    Toast.success(message);
  };

  const showErrorMessage = (message: string) => {
    Toast.error(message);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleMemberUpdate = async () => {
    // Refresh both family data and room data after member updates
    await Promise.all([
      refreshFamily(),
      loadRoomData()
    ]);
  };


  const getRoleColor = (role: FamilyRole) => {
    switch (role) {
      case 'parent':
        return '#be185d';
      case 'child':
        return '#10b981';
      case 'other':
        return '#f59e0b';
      default:
        return '#831843';
    }
  };

  const handleOpenRoomAssignment = (member: FamilyMember) => {
    setSelectedMemberForRooms(member);
    setShowRoomAssignModal(true);
  };

  const handleAssignRoom = async (room: Room, isPrimary: boolean = false) => {
    if (!selectedMemberForRooms || !family?.id) return;

    try {
      setRoomAssignLoading(true);
      await assignMemberToRoom(
        room.id!,
        selectedMemberForRooms.uid,
        selectedMemberForRooms.name,
        family.id,
        isPrimary
      );
      
      showSuccessMessage(`${selectedMemberForRooms.name} assigned to ${room.name}`);
      await loadRoomData(); // Reload room assignments
    } catch (error) {
      showErrorMessage('Failed to assign room');
      console.error('Error assigning room:', error);
    } finally {
      setRoomAssignLoading(false);
    }
  };

  const handleUnassignRoom = async (roomId: string, memberId: string) => {
    try {
      await removeMemberFromRoom(roomId, memberId);
      showSuccessMessage('Room assignment removed');
      await loadRoomData(); // Reload room assignments
    } catch (error) {
      showErrorMessage('Failed to remove room assignment');
      console.error('Error removing room assignment:', error);
    }
  };

  // Filter members based on search query and status
  const filteredMembers = family.members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && member.isActive) ||
                         (filterStatus === 'excluded' && !member.isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Manage Family Members</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Access Control Notice */}
        {!canManageMembers && (
          <View style={styles.accessNotice}>
            <ThemedText style={styles.accessNoticeText}>
              👀 View Only - Member management requires Admin access
            </ThemedText>
          </View>
        )}

        {/* Search and Filter Controls */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#f9a8d4"
            />
          </View>
          <View style={styles.filterContainer}>
            {(['all', 'active', 'excluded'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)} 
                  {status === 'all' && ` (${family.members.length})`}
                  {status === 'active' && ` (${family.members.filter(m => m.isActive).length})`}
                  {status === 'excluded' && ` (${family.members.filter(m => !m.isActive).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {filteredMembers.map((member) => {
            const isAdmin = member.uid === family.adminId;
            const isExcluded = !member.isActive;

            return (
              <View key={member.uid} style={[styles.memberCard, isExcluded && styles.excludedCard]}>
                <View style={styles.avatarRow}>
                  <Avatar
                    photoURL={member.photoURL}
                    name={member.name}
                    size={40}
                    showStatus={true}
                    isActive={member.isActive}
                  />
                </View>
                <View style={styles.memberInfo}>
                  <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                  {member.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <ThemedText style={styles.adminBadgeText}>Admin</ThemedText>
                    </View>
                  )}
                  {isExcluded && (
                    <View style={styles.excludedBadge}>
                      <ThemedText style={styles.excludedBadgeText}>Excluded</ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.memberDetails}>
                  <ThemedText lightColor="#6b7280" style={styles.detailLabel}>Email:</ThemedText>
                  <ThemedText lightColor="#374151" style={styles.detailValue}>{member.email || 'Not provided'}</ThemedText>
                </View>

                <View style={styles.memberDetails}>
                  <ThemedText lightColor="#6b7280" style={styles.detailLabel}>Role:</ThemedText>
                  <ThemedText lightColor={getRoleColor(member.familyRole)} style={styles.detailValue}>
                    {member.familyRole}
                  </ThemedText>
                </View>

                <View style={styles.memberDetails}>
                  <ThemedText lightColor="#6b7280" style={styles.detailLabel}>Access:</ThemedText>
                  <ThemedText 
                    lightColor={member.role === 'admin' ? '#be185d' : '#374151'} 
                    style={[styles.detailValue, member.role === 'admin' && styles.accessAdminText]}
                  >
                    {member.role === 'admin' ? 'Admin' : 'User'}
                  </ThemedText>
                </View>

                <View style={styles.memberDetails}>
                  <ThemedText lightColor="#6b7280" style={styles.detailLabel}>Points:</ThemedText>
                  <ThemedText lightColor="#374151" style={styles.detailValue}>
                    {member.points.current} (Lifetime: {member.points.lifetime})
                  </ThemedText>
                </View>

                <View style={styles.memberDetails}>
                  <ThemedText lightColor="#6b7280" style={styles.detailLabel}>Status:</ThemedText>
                  <ThemedText lightColor={isExcluded ? "#ef4444" : "#374151"} style={styles.detailValue}> 
                    {isExcluded ? 'Excluded' : 'Active'}
                  </ThemedText>
                </View>

                {/* Room Assignments Section */}
                <View style={styles.roomSection}>
                  <View style={styles.roomHeader}>
                    <ThemedText lightColor="#6b7280" style={styles.detailLabel}>Room Assignments:</ThemedText>
                    {canManageMembers && (
                      <TouchableOpacity
                        style={styles.addRoomButton}
                        onPress={() => handleOpenRoomAssignment(member)}
                      >
                        <Ionicons name="add-circle" size={20} color="#be185d" />
                        <Text style={styles.addRoomText}>Assign</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.roomList}>
                    {memberRoomAssignments[member.uid]?.length > 0 ? (
                      memberRoomAssignments[member.uid].map((assignment) => (
                        <View key={assignment.id} style={styles.roomBadge}>
                          <Text style={styles.roomEmoji}>
                            {getRoomTypeEmoji(familyRooms.find(r => r.id === assignment.roomId)?.type || 'other')}
                          </Text>
                          <Text style={styles.roomName}>{assignment.roomName}</Text>
                          {assignment.isPrimary && (
                            <Text style={styles.primaryIndicator}>★</Text>
                          )}
                          {canManageMembers && (
                            <TouchableOpacity
                              onPress={() => handleUnassignRoom(assignment.roomId, member.uid)}
                              style={styles.removeRoomButton}
                            >
                              <Ionicons name="close-circle" size={16} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noRoomsText}>No rooms assigned</Text>
                    )}
                  </View>
                </View>

                {/* Show member management actions */}
                {canManageMembers && !isAdmin ? (
                  // Show Edit User button for non-original-admins
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editUserButton}
                      onPress={() => handleEditMember(member)}
                    >
                      <Ionicons name="create-outline" size={20} color="#ffffff" />
                      <ThemedText style={styles.editUserButtonText}>Edit User</ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : isAdmin ? (
                  // For the original admin, just show their status
                  <ThemedText style={{ marginTop: 12, fontStyle: 'italic', color: '#6b7280' }}>
                    Original family creator - cannot be modified
                  </ThemedText>
                ) : null}

              </View>
            );
          })}
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#be185d" />
          </View>
        )}
      </View>

      {/* Room Assignment Modal */}
      <Modal
        visible={showRoomAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoomAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Assign Rooms to {selectedMemberForRooms?.name}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRoomAssignModal(false)}
              >
                <Ionicons name="close" size={24} color="#831843" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {familyRooms.length > 0 ? (
                familyRooms.map((room) => {
                  const isAssigned = memberRoomAssignments[selectedMemberForRooms?.uid || '']?.some(
                    a => a.roomId === room.id
                  );
                  const assignment = memberRoomAssignments[selectedMemberForRooms?.uid || '']?.find(
                    a => a.roomId === room.id
                  );
                  const isPrimary = assignment?.isPrimary || false;

                  return (
                    <View key={room.id} style={styles.roomAssignCard}>
                      <View style={styles.roomInfo}>
                        <Text style={styles.roomTypeEmoji}>{getRoomTypeEmoji(room.type)}</Text>
                        <View style={styles.roomDetails}>
                          <Text style={styles.roomAssignName}>{room.name}</Text>
                          <Text style={styles.roomAssignType}>
                            {getRoomTypeDisplayName(room.type)} • {room.sharingType}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.roomAssignActions}>
                        {!isAssigned ? (
                          <>
                            <TouchableOpacity
                              style={styles.assignRoomButton}
                              onPress={() => handleAssignRoom(room, false)}
                              disabled={roomAssignLoading}
                            >
                              <Text style={styles.assignRoomButtonText}>Assign</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.assignPrimaryRoomButton}
                              onPress={() => handleAssignRoom(room, true)}
                              disabled={roomAssignLoading}
                            >
                              <Text style={styles.assignPrimaryButtonText}>Primary</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={styles.assignedRoomIndicator}>
                            {isPrimary && (
                              <View style={styles.primaryRoomBadge}>
                                <Text style={styles.primaryBadgeText}>Primary</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={styles.unassignRoomButton}
                              onPress={() => handleUnassignRoom(room.id!, selectedMemberForRooms?.uid || '')}
                            >
                              <Text style={styles.unassignButtonText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.noRoomsAvailable}>
                  <Ionicons name="home-outline" size={48} color="#f9a8d4" />
                  <Text style={styles.noRoomsTitle}>No rooms available</Text>
                  <Text style={styles.noRoomsSubtext}>
                    Create rooms in the Room Management section first
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Member Modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          visible={showEditModal}
          onClose={handleCloseEditModal}
          onUpdate={handleMemberUpdate}
          canManageMembers={canManageMembers}
          canPromoteDemoteMembers={canPromoteDemoteMembers}
          isOriginalAdmin={editingMember.uid === family.adminId}
          currentUserId={user?.uid}
          familyId={family.id}
          familyMembers={family.members}
        />
      )}
    </Modal>
  );
}

// Edit Member Modal Component
function EditMemberModal({
  member,
  visible,
  onClose,
  onUpdate,
  canManageMembers,
  canPromoteDemoteMembers,
  isOriginalAdmin,
  currentUserId,
  familyId,
  familyMembers,
}: EditMemberModalProps) {
  const { updateMemberRole, removeMember, updateMemberName, updateFamilyMember } = useFamily();
  const [loading, setLoading] = useState(false);
  const [editedName, setEditedName] = useState(member?.name || '');
  const [editedRole, setEditedRole] = useState<FamilyRole>(member?.familyRole || 'child');

  // Get the most current member data from the family members list
  const currentMemberData = familyMembers.find(m => m.uid === member?.uid) || member;

  useEffect(() => {
    if (currentMemberData) {
      setEditedName(currentMemberData.name);
      setEditedRole(currentMemberData.familyRole);
    }
  }, [currentMemberData]);

  if (!currentMemberData) return null;

  // Computed styles to force re-render when data changes
  const isCurrentlyAdmin = currentMemberData.role === 'admin';
  const toggleButtonStyle = [
    styles.toggleButton,
    isCurrentlyAdmin ? styles.toggleButtonActive : styles.toggleButtonInactive
  ];
  const toggleSliderStyle = [
    styles.toggleSlider,
    isCurrentlyAdmin && styles.toggleSliderActive
  ];
  const toggleStatusStyle = [
    styles.toggleStatus,
    isCurrentlyAdmin && styles.toggleStatusActive
  ];

  const showSuccessMessage = (message: string) => {
    Toast.success(message);
  };

  const showErrorMessage = (message: string) => {
    Toast.error(message);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      showErrorMessage('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const success = await updateMemberName(currentMemberData.uid, editedName.trim());
      if (success) {
        showSuccessMessage('Name updated successfully');
        onUpdate();
      } else {
        showErrorMessage('Failed to update name');
      }
    } catch (error) {
      showErrorMessage('An error occurred');
      console.error('Error updating name:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    setLoading(true);
    try {
      const success = await updateMemberRole(currentMemberData.uid, 'member', editedRole);
      if (success) {
        showSuccessMessage('Role updated successfully');
        onUpdate();
      } else {
        showErrorMessage('Failed to update role');
      }
    } catch (error) {
      showErrorMessage('An error occurred');
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${currentMemberData.name} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await removeMember(currentMemberData.uid);
              if (success) {
                showSuccessMessage('Member removed from family');
                onClose();
              } else {
                showErrorMessage('Failed to remove member');
              }
            } catch (error) {
              showErrorMessage('An error occurred');
              console.error('Error removing member:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleExclude = async () => {
    const newStatus = !currentMemberData.isActive;
    const action = newStatus ? 'Re-include' : 'Exclude';
    const message = newStatus 
      ? `Re-include ${currentMemberData.name} in rotation and active chores?`
      : `Are you sure you want to exclude ${currentMemberData.name} from rotation and active chores?`;

    Alert.alert(
      `${action} Member`,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await updateFamilyMember(familyId!, currentMemberData.uid, { isActive: newStatus });
              if (success) {
                showSuccessMessage(`Member ${newStatus ? 're-included' : 'excluded'}`);
                onUpdate();
              } else {
                showErrorMessage(`Failed to ${action.toLowerCase()} member`);
              }
            } catch (error) {
              showErrorMessage('An error occurred');
              console.error(`Error ${action}ing member:`, error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAdmin = async () => {
    // Use the computed value for consistency
    const action = isCurrentlyAdmin ? 'Demote' : 'Promote';
    const message = isCurrentlyAdmin
      ? `Are you sure you want to remove admin rights from ${currentMemberData.name}?`
      : `Grant admin rights to ${currentMemberData.name}? They will be able to manage family settings and members.`;

    // Enhanced console logging for debugging
    console.log('=== Admin Toggle Debug Info ===');
    console.log('Member:', {
      uid: currentMemberData.uid,
      name: currentMemberData.name,
      currentRole: currentMemberData.role,
      familyRole: currentMemberData.familyRole
    });
    console.log('Current admin count:', familyMembers.filter(m => m.role === 'admin').length);
    console.log('Action:', action);
    console.log('Is currently admin:', isCurrentlyAdmin);

    // Don't allow demotion if there's only one admin
    if (isCurrentlyAdmin && familyMembers.filter(m => m.role === 'admin').length <= 1) {
      console.log('❌ Cannot remove the last admin');
      showErrorMessage('Cannot remove the last admin');
      return;
    }

    console.log('📱 About to show confirmation for admin toggle');
    
    // Use web-compatible confirmation
    const userConfirmed = confirm(`${action} Admin\n\n${message}`);
    console.log('User confirmation result:', userConfirmed);
    
    if (userConfirmed) {
      console.log('✅ User confirmed admin toggle');
      setLoading(true);
      try {
        const newRole = isCurrentlyAdmin ? 'member' : 'admin';
        console.log('Calling updateMemberRole with:', {
          userId: currentMemberData.uid,
          newRole,
          familyRole: currentMemberData.familyRole
        });
        
        const success = await updateMemberRole(currentMemberData.uid, newRole, currentMemberData.familyRole);
        console.log('updateMemberRole result:', success);
        
        if (success) {
          console.log('✅ Admin role updated successfully');
          showSuccessMessage(isCurrentlyAdmin ? 'Admin rights removed' : `${currentMemberData.name} is now an admin`);
          onUpdate();
        } else {
          console.log('❌ updateMemberRole returned false');
          showErrorMessage(`Failed to ${action.toLowerCase()} admin`);
        }
      } catch (error) {
        console.error(`❌ Error ${action}ing admin:`, error);
        showErrorMessage('An error occurred');
      } finally {
        setLoading(false);
      }
    } else {
      console.log('❌ User cancelled admin toggle');
    }
  };

  const getRoleColor = (role: FamilyRole) => {
    switch (role) {
      case 'parent':
        return '#be185d';
      case 'child':
        return '#10b981';
      case 'other':
        return '#f59e0b';
      default:
        return '#831843';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.editModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Name Section */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Name</Text>
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter name"
                  placeholderTextColor="#f9a8d4"
                />
                <TouchableOpacity
                  style={[styles.smallSaveButton, { opacity: editedName !== currentMemberData.name ? 1 : 0.5 }]}
                  onPress={handleSaveName}
                  disabled={loading || editedName === currentMemberData.name}
                >
                  <Text style={styles.smallSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Section */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Family Role</Text>
              <View style={styles.roleOptions}>
                {(['parent', 'child', 'other'] as FamilyRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      editedRole === role && styles.roleOptionSelected,
                      { borderColor: getRoleColor(role) },
                    ]}
                    onPress={() => setEditedRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        editedRole === role && { color: getRoleColor(role) },
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editedRole !== currentMemberData.familyRole && (
                <TouchableOpacity
                  style={styles.updateRoleButton}
                  onPress={handleSaveRole}
                  disabled={loading}
                >
                  <Text style={styles.updateRoleButtonText}>Update Role</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Member Actions */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Member Actions</Text>
              <View style={styles.actionButtons}>
                {/* Admin Role Toggle - More compact design */}
                {canPromoteDemoteMembers && currentMemberData.uid !== currentUserId && (
                  <View style={styles.toggleSection}>
                    <Text style={styles.toggleLabel}>Admin Access</Text>
                    <TouchableOpacity
                      style={toggleButtonStyle}
                      onPress={() => {
                        console.log('🔘 Toggle button pressed');
                        console.log('Toggle pressed - current role:', currentMemberData.role);
                        console.log('Is admin?', isCurrentlyAdmin);
                        console.log('Toggle style should be:', isCurrentlyAdmin ? 'active (pink)' : 'inactive (gray)');
                        console.log('About to call handleToggleAdmin...');
                        handleToggleAdmin();
                        console.log('handleToggleAdmin called');
                      }}
                      disabled={loading}
                    >
                      <View style={toggleSliderStyle} />
                    </TouchableOpacity>
                    <Text style={toggleStatusStyle}>
                      {isCurrentlyAdmin ? 'Admin' : 'User'}
                    </Text>
                  </View>
                )}

                {/* Exclude/Include Toggle */}
                <TouchableOpacity
                  style={[styles.compactActionButton, currentMemberData.isActive ? styles.excludeButton : styles.includeButton]}
                  onPress={handleToggleExclude}
                  disabled={loading}
                >
                  <Ionicons 
                    name={currentMemberData.isActive ? "person-remove" : "person-add"} 
                    size={16} 
                    color="#ffffff" 
                  />
                  <Text style={styles.compactActionButtonText}>
                    {currentMemberData.isActive ? 'Exclude from Rotation' : 'Re-include in Rotation'}
                  </Text>
                </TouchableOpacity>

                {/* Remove Member */}
                <TouchableOpacity
                  style={[styles.compactActionButton, styles.removeButton]}
                  onPress={handleRemoveMember}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  <Text style={styles.compactActionButtonText}>Remove from Family</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#be185d" />
            </View>
          )}
        </View>
      </View>
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
  memberCard: {
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
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#be185d',
    paddingVertical: 4,
    minWidth: 200,
    color: '#831843',
  },
  adminBadge: {
    backgroundColor: '#be185d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberDetails: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
    color: '#374151',
  },
  roleEditContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  roleOptionSelected: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
  },
  roleOptionText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  editUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#be185d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editUserButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#be185d',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: '#8b5cf6',
  },
  adminButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(253, 242, 248, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  excludedCard: {
    opacity: 0.5,
    backgroundColor: '#fef2f2',
  },
  excludedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  excludedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 6,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarInitials: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    right: -2,
    bottom: -2,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#831843',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#fce7f3',
    borderColor: '#be185d',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#be185d',
  },
  accessAdminText: {
    fontWeight: '600',
  },
  accessNotice: {
    backgroundColor: '#fef3cd',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginBottom: 0,
  },
  accessNoticeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Room assignment styles
  roomSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f9a8d4',
    borderRadius: 12,
  },
  addRoomText: {
    color: '#be185d',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  roomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbcfe8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  roomEmoji: {
    fontSize: 14,
  },
  roomName: {
    fontSize: 12,
    color: '#831843',
    fontWeight: '600',
  },
  primaryIndicator: {
    color: '#be185d',
    fontSize: 12,
    fontWeight: '700',
  },
  removeRoomButton: {
    marginLeft: 4,
  },
  noRoomsText: {
    fontSize: 12,
    color: '#9f1239',
    fontStyle: 'italic',
  },
  // Room assignment modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  roomAssignCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomTypeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  roomDetails: {
    flex: 1,
  },
  roomAssignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  roomAssignType: {
    fontSize: 14,
    color: '#9f1239',
    marginTop: 2,
  },
  roomAssignActions: {
    flexDirection: 'row',
    gap: 8,
  },
  assignRoomButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#be185d',
    borderRadius: 8,
  },
  assignRoomButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  assignPrimaryRoomButton: {
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
  assignedRoomIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryRoomBadge: {
    backgroundColor: '#831843',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  unassignRoomButton: {
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
  noRoomsAvailable: {
    alignItems: 'center',
    padding: 40,
  },
  noRoomsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
  },
  noRoomsSubtext: {
    fontSize: 14,
    color: '#9f1239',
    textAlign: 'center',
    marginTop: 8,
  },
  // Edit Modal Styles
  editModalContent: {
    maxHeight: '90%',
  },
  editSection: {
    marginBottom: 24,
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#831843',
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  compactActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  compactActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    minWidth: 80,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  toggleButtonActive: {
    backgroundColor: '#be185d',
  },
  toggleSlider: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleSliderActive: {
    transform: [{ translateX: 22 }],
  },
  toggleStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
  },
  toggleStatusActive: {
    color: '#be185d',
  },
  excludeButton: {
    backgroundColor: '#f59e0b',
  },
  includeButton: {
    backgroundColor: '#10b981',
  },
  promoteButton: {
    backgroundColor: '#8b5cf6',
  },
  demoteButton: {
    backgroundColor: '#9f1239',
  },
  smallSaveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallSaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  updateRoleButton: {
    backgroundColor: '#be185d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  updateRoleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageMembers;