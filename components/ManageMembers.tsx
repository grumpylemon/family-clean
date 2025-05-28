import { useFamily } from '@/contexts/FamilyContext';
import { FamilyMember, FamilyRole } from '@/types';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ManageMembersProps {
  visible: boolean;
  onClose: () => void;
}

export function ManageMembers({ visible, onClose }: ManageMembersProps) {
  const { family, updateMemberRole, removeMember, updateMemberName, updateFamilyMember } = useFamily();
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<FamilyRole>('child');
  const [editedName, setEditedName] = useState<string>('');

  if (!family) return null;

  const handleRoleChange = async (memberId: string, newRole: FamilyRole) => {
    setLoading(true);
    try {
      // For family management, we keep the user role as 'member' and only change familyRole
      const success = await updateMemberRole(memberId, 'member', newRole);
      if (success) {
        Alert.alert('Success', 'Member role updated successfully');
        setEditingMember(null);
      } else {
        Alert.alert('Error', 'Failed to update member role');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the role');
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = async (memberId: string, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const success = await updateMemberName(memberId, newName.trim());
      if (success) {
        Alert.alert('Success', 'Member name updated successfully');
        setEditingName(null);
      } else {
        Alert.alert('Error', 'Failed to update member name');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the name');
      console.error('Error updating name:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await removeMember(member.uid);
              if (success) {
                Alert.alert('Success', 'Member removed from family');
              } else {
                Alert.alert('Error', 'Failed to remove member');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while removing the member');
              console.error('Error removing member:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExcludeMember = async (member: FamilyMember) => {
    Alert.alert(
      'Exclude Member',
      `Are you sure you want to exclude ${member.name} from rotation and active chores?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exclude',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await updateFamilyMember(family!.id!, member.uid, { isActive: false });
              if (success) Alert.alert('Success', 'Member excluded');
            } catch (error) {
              Alert.alert('Error', 'Failed to exclude member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReincludeMember = async (member: FamilyMember) => {
    Alert.alert(
      'Re-include Member',
      `Re-include ${member.name} in rotation and active chores?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-include',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await updateFamilyMember(family!.id!, member.uid, { isActive: true });
              if (success) Alert.alert('Success', 'Member re-included');
            } catch (error) {
              Alert.alert('Error', 'Failed to re-include member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: FamilyRole) => {
    switch (role) {
      case 'parent':
        return '#4285F4';
      case 'child':
        return '#34A853';
      case 'other':
        return '#FBBC04';
      default:
        return '#666';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Manage Family Members</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.scrollView}>
          {family.members.map((member) => {
            const isAdmin = member.uid === family.adminId;
            const isEditing = editingMember === member.uid;
            const isExcluded = !member.isActive;

            return (
              <ThemedView key={member.uid} style={[styles.memberCard, isExcluded && styles.excludedCard]}>
                <View style={styles.avatarRow}>
                  {member.photoURL ? (
                    <Image source={{ uri: member.photoURL }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitials}>
                        {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.statusDot, { backgroundColor: isExcluded ? '#F87171' : '#34D399' }]} />
                </View>
                <ThemedView style={styles.memberInfo}>
                  {editingName === member.uid ? (
                    <TextInput
                      style={styles.nameInput}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Enter name"
                      autoFocus
                    />
                  ) : (
                    <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                  )}
                  {member.role === 'admin' && (
                    <ThemedView style={styles.adminBadge}>
                      <ThemedText style={styles.adminBadgeText}>Admin</ThemedText>
                    </ThemedView>
                  )}
                  {isExcluded && (
                    <ThemedView style={styles.excludedBadge}>
                      <ThemedText style={styles.excludedBadgeText}>Excluded</ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>

                <ThemedView style={styles.memberDetails}>
                  <ThemedText style={styles.detailLabel}>Email:</ThemedText>
                  <ThemedText style={styles.detailValue}>{member.email || 'Not provided'}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.memberDetails}>
                  <ThemedText style={styles.detailLabel}>Role:</ThemedText>
                  {isEditing ? (
                    <ThemedView style={styles.roleEditContainer}>
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
                          <ThemedText
                            style={[
                              styles.roleOptionText,
                              editedRole === role && { color: getRoleColor(role) },
                            ]}
                          >
                            {role}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ThemedView>
                  ) : (
                    <ThemedText style={[styles.detailValue, { color: getRoleColor(member.familyRole) }]}>
                      {member.familyRole}
                    </ThemedText>
                  )}
                </ThemedView>

                <ThemedView style={styles.memberDetails}>
                  <ThemedText style={styles.detailLabel}>Points:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {member.points.current} (Lifetime: {member.points.lifetime})
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.memberDetails}>
                  <ThemedText style={styles.detailLabel}>Status:</ThemedText>
                  <ThemedText style={[styles.detailValue, isExcluded && { color: '#ef4444' }]}> 
                    {isExcluded ? 'Excluded' : 'Active'}
                  </ThemedText>
                </ThemedView>

                {!isAdmin && (
                  <ThemedView style={styles.actions}>
                    {editingName === member.uid ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.saveButton]}
                          onPress={() => handleNameChange(member.uid, editedName)}
                          disabled={loading}
                        >
                          <ThemedText style={styles.saveButtonText}>
                            {loading ? 'Saving...' : 'Save Name'}
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={() => {
                            setEditingName(null);
                            setEditedName('');
                          }}
                          disabled={loading}
                        >
                          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                        </TouchableOpacity>
                      </>
                    ) : isEditing ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.saveButton]}
                          onPress={() => handleRoleChange(member.uid, editedRole)}
                          disabled={loading}
                        >
                          <ThemedText style={styles.saveButtonText}>
                            {loading ? 'Saving...' : 'Save Role'}
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={() => {
                            setEditingMember(null);
                            setEditedRole('child');
                          }}
                          disabled={loading}
                        >
                          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => {
                            setEditingName(member.uid);
                            setEditedName(member.name);
                          }}
                        >
                          <ThemedText style={styles.editButtonText}>Edit Name</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => {
                            setEditingMember(member.uid);
                            setEditedRole(member.familyRole);
                          }}
                        >
                          <ThemedText style={styles.editButtonText}>Edit Role</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.removeButton]}
                          onPress={() => handleRemoveMember(member)}
                        >
                          <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                        </TouchableOpacity>
                        {!isExcluded ? (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.removeButton]}
                            onPress={() => handleExcludeMember(member)}
                            disabled={loading}
                          >
                            <ThemedText style={styles.removeButtonText}>Exclude</ThemedText>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.saveButton]}
                            onPress={() => handleReincludeMember(member)}
                            disabled={loading}
                          >
                            <ThemedText style={styles.saveButtonText}>Re-include</ThemedText>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </ThemedView>
                )}
                {isAdmin && family && family.members.filter(m => m.role === 'admin').length > 1 && member.uid !== family.adminId && (
                  <ThemedView style={styles.actions}>
                    {member.role === 'admin' ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={async () => {
                          setLoading(true);
                          const success = await updateMemberRole(member.uid, 'member', member.familyRole);
                          setLoading(false);
                          if (success) Alert.alert('Success', 'Admin rights removed');
                        }}
                        disabled={loading}
                      >
                        <ThemedText style={styles.removeButtonText}>Demote from Admin</ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={async () => {
                          setLoading(true);
                          const success = await updateMemberRole(member.uid, 'admin', member.familyRole);
                          setLoading(false);
                          if (success) Alert.alert('Success', 'Promoted to Admin');
                        }}
                        disabled={loading}
                      >
                        <ThemedText style={styles.saveButtonText}>Promote to Admin</ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>
                )}
              </ThemedView>
            );
          })}
        </ScrollView>

        {loading && (
          <ThemedView style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
          </ThemedView>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
  memberCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#4285F4',
    paddingVertical: 4,
    minWidth: 200,
    color: '#000',
  },
  adminBadge: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    opacity: 0.7,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
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
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
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
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#4285F4',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#EA4335',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34A853',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
});