import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { FamilyMember, FamilyRole } from '@/types';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
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

interface ManageMembersProps {
  visible: boolean;
  onClose: () => void;
}

export function ManageMembers({ visible, onClose }: ManageMembersProps) {
  const { user } = useAuth();
  const { family, updateMemberRole, removeMember, updateMemberName, updateFamilyMember, isAdmin: isCurrentUserAdmin } = useFamily();
  const [loading, setLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<FamilyRole>('child');
  const [editedName, setEditedName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'excluded'>('all');

  if (!family) return null;

  const showSuccessMessage = (message: string) => {
    Toast.success(message);
  };

  const showErrorMessage = (message: string) => {
    Toast.error(message);
  };

  const handleRoleChange = async (memberId: string, newRole: FamilyRole) => {
    setLoading(true);
    try {
      // For family management, we keep the user role as 'member' and only change familyRole
      const success = await updateMemberRole(memberId, 'member', newRole);
      if (success) {
        showSuccessMessage('Member role updated successfully');
        setEditingMember(null);
      } else {
        showErrorMessage('Failed to update member role');
      }
    } catch (error) {
      showErrorMessage('An error occurred while updating the role');
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = async (memberId: string, newName: string) => {
    if (!newName.trim()) {
      showErrorMessage('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const success = await updateMemberName(memberId, newName.trim());
      if (success) {
        showSuccessMessage('Member name updated successfully');
        setEditingName(null);
      } else {
        showErrorMessage('Failed to update member name');
      }
    } catch (error) {
      showErrorMessage('An error occurred while updating the name');
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
                showSuccessMessage('Member removed from family');
              } else {
                showErrorMessage('Failed to remove member');
              }
            } catch (error) {
              showErrorMessage('An error occurred while removing the member');
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
              if (success) showSuccessMessage('Member excluded');
            } catch (error) {
              showErrorMessage('Failed to exclude member');
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
              if (success) showSuccessMessage('Member re-included');
            } catch (error) {
              showErrorMessage('Failed to re-include member');
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
        return '#be185d';
      case 'child':
        return '#10b981';
      case 'other':
        return '#f59e0b';
      default:
        return '#831843';
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
            const isEditing = editingMember === member.uid;
            const isExcluded = !member.isActive;
            
            // Debug logging
            if (process.env.NODE_ENV === 'development') {
              console.log(`Member: ${member.name}`, {
                isAdmin,
                memberRole: member.role,
                isCurrentUserAdmin,
                familyAdminId: family.adminId,
                memberUid: member.uid
              });
            }

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
                  {isEditing ? (
                    <View style={styles.roleEditContainer}>
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
                    </View>
                  ) : (
                    <ThemedText lightColor={getRoleColor(member.familyRole)} style={styles.detailValue}>
                      {member.familyRole}
                    </ThemedText>
                  )}
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

                {/* Show member management actions */}
                {!isAdmin ? (
                  // Regular member actions for non-original-admins
                  <View style={styles.actions}>
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
                  </View>
                ) : (
                  // For the original admin, just show their status
                  <ThemedText style={{ marginTop: 12, fontStyle: 'italic', color: '#6b7280' }}>
                    Original family creator - cannot be modified
                  </ThemedText>
                )}

                {/* Admin Promotion/Demotion - Show for current admin to manage ALL members */}
                {isCurrentUserAdmin && member.uid !== user?.uid && (
                <View style={styles.actions}>
                  {/* Debug info - console.log happens as side effect */}
                  {(() => {
                    console.log(`Admin section for ${member.name}:`, {
                      showingAdminSection: true,
                      memberRole: member.role,
                      isOriginalAdmin: isAdmin,
                      shouldShowMakeAdmin: member.role !== 'admin',
                      currentUserId: user?.uid,
                      memberId: member.uid
                    });
                    return null;
                  })()}
                  {member.role === 'admin' ? (
                    // Only allow demotion if there's more than one admin
                    family.members.filter(m => m.role === 'admin').length > 1 && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={async () => {
                          Alert.alert(
                            'Demote Admin',
                            `Are you sure you want to remove admin rights from ${member.name}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Demote',
                                style: 'destructive',
                                onPress: async () => {
                                  setLoading(true);
                                  try {
                                    const success = await updateMemberRole(member.uid, 'member', member.familyRole);
                                    if (success) {
                                      showSuccessMessage('Admin rights removed');
                                    } else {
                                      showErrorMessage('Failed to remove admin rights');
                                    }
                                  } catch (error) {
                                    showErrorMessage('An error occurred');
                                    console.error('Error demoting admin:', error);
                                  } finally {
                                    setLoading(false);
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        disabled={loading}
                      >
                        <ThemedText style={styles.removeButtonText}>Remove Admin</ThemedText>
                      </TouchableOpacity>
                    )
                  ) : (
                    // Allow promotion to admin for regular members
                    <TouchableOpacity
                      style={[styles.actionButton, styles.adminButton]}
                      onPress={() => {
                        console.log('Make Admin button clicked for:', member.name, member.uid);
                        console.log('Current user is admin:', isCurrentUserAdmin);
                        console.log('Member current role:', member.role);
                        
                        Alert.alert(
                          'Promote to Admin',
                          `Grant admin rights to ${member.name}? They will be able to manage family settings and members.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Promote',
                              onPress: async () => {
                                console.log('Promote confirmed for:', member.name);
                                setLoading(true);
                                try {
                                  // Update the member's role to admin
                                  const success = await updateMemberRole(member.uid, 'admin', member.familyRole);
                                  console.log('updateMemberRole returned:', success);
                                  if (success) {
                                    showSuccessMessage(`${member.name} is now an admin`);
                                  } else {
                                    showErrorMessage('Failed to grant admin rights');
                                  }
                                } catch (error) {
                                  showErrorMessage('An error occurred');
                                  console.error('Error promoting to admin:', error);
                                } finally {
                                  setLoading(false);
                                }
                              },
                            },
                          ]
                        );
                      }}
                      disabled={loading}
                    >
                      <ThemedText style={styles.adminButtonText}>Make Admin</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                )}
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
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
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
});