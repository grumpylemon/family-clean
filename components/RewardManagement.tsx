import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reward, RewardCategory } from '../types';
import { 
  getRewards, 
  createReward, 
  updateReward, 
  deleteReward,
  getFamilyRedemptions
} from '../services/firestore';
import { useFamily } from '../contexts/FamilyContext';

interface RewardManagementProps {
  visible: boolean;
  onClose: () => void;
}

const REWARD_CATEGORIES: { value: RewardCategory; label: string; icon: string }[] = [
  { value: 'privilege', label: 'Privilege', icon: 'star-outline' },
  { value: 'item', label: 'Item', icon: 'gift-outline' },
  { value: 'experience', label: 'Experience', icon: 'happy-outline' },
  { value: 'money', label: 'Money', icon: 'cash-outline' },
  { value: 'digital', label: 'Digital', icon: 'phone-portrait-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' }
];

export default function RewardManagement({ visible, onClose }: RewardManagementProps) {
  const { family } = useFamily();
  const familyId = family?.id || '';
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: '',
    category: 'privilege' as RewardCategory,
    minLevel: '',
    cooldownDays: '',
    hasStock: false,
    stockCount: '',
    isUnlimited: true,
    isRepeatable: true,
    featured: false
  });

  useEffect(() => {
    if (familyId && visible) {
      loadRewards();
    }
  }, [familyId, visible]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const fetchedRewards = await getRewards(familyId);
      setRewards(fetchedRewards);
    } catch (error) {
      console.error('Error loading rewards:', error);
      showAlert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pointsCost: '',
      category: 'privilege',
      minLevel: '',
      cooldownDays: '',
      hasStock: false,
      stockCount: '',
      isUnlimited: true,
      isRepeatable: true,
      featured: false
    });
    setEditingReward(null);
  };

  const handleSaveReward = async () => {
    if (!formData.name.trim()) {
      showAlert('Error', 'Please enter a reward name');
      return;
    }

    if (!formData.pointsCost || isNaN(Number(formData.pointsCost))) {
      showAlert('Error', 'Please enter a valid point cost');
      return;
    }

    try {
      const rewardData: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        pointsCost: Number(formData.pointsCost),
        category: formData.category,
        familyId,
        createdBy: 'current-user', // This will be replaced in the service
        isActive: true,
        minLevel: formData.minLevel ? Number(formData.minLevel) : undefined,
        cooldownDays: formData.cooldownDays ? Number(formData.cooldownDays) : undefined,
        hasStock: formData.hasStock,
        stockCount: formData.hasStock && !formData.isUnlimited ? Number(formData.stockCount) : undefined,
        isUnlimited: formData.isUnlimited,
        isRepeatable: formData.isRepeatable,
        featured: formData.featured,
        sortOrder: rewards.length + 1
      };

      if (editingReward) {
        await updateReward(editingReward.id!, rewardData);
        showAlert('Success', 'Reward updated successfully');
      } else {
        await createReward(rewardData);
        showAlert('Success', 'Reward created successfully');
      }

      setShowCreateModal(false);
      resetForm();
      await loadRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      showAlert('Error', 'Failed to save reward');
    }
  };

  const handleEditReward = (reward: Reward) => {
    setFormData({
      name: reward.name,
      description: reward.description || '',
      pointsCost: reward.pointsCost.toString(),
      category: reward.category,
      minLevel: reward.minLevel?.toString() || '',
      cooldownDays: reward.cooldownDays?.toString() || '',
      hasStock: reward.hasStock || false,
      stockCount: reward.stockCount?.toString() || '',
      isUnlimited: reward.isUnlimited !== false,
      isRepeatable: reward.isRepeatable !== false,
      featured: reward.featured || false
    });
    setEditingReward(reward);
    setShowCreateModal(true);
  };

  const handleDeleteReward = async (reward: Reward) => {
    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to delete "${reward.name}"?`)) {
        await performDelete(reward);
      }
    } else {
      Alert.alert(
        'Delete Reward',
        `Are you sure you want to delete "${reward.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => performDelete(reward) }
        ]
      );
    }
  };

  const performDelete = async (reward: Reward) => {
    try {
      await deleteReward(reward.id!);
      showAlert('Success', 'Reward deleted successfully');
      await loadRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      showAlert('Error', 'Failed to delete reward');
    }
  };

  const getCategoryIcon = (category: RewardCategory) => {
    const categoryData = REWARD_CATEGORIES.find(c => c.value === category);
    return categoryData?.icon || 'gift-outline';
  };

  const getCategoryLabel = (category: RewardCategory) => {
    const categoryData = REWARD_CATEGORIES.find(c => c.value === category);
    return categoryData?.label || category;
  };

  if (!familyId) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={{
          flex: 1,
          backgroundColor: '#fdf2f8',
          paddingTop: Platform.OS === 'ios' ? 44 : 20,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <TouchableOpacity onPress={onClose} style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 60 : 40,
            right: 20,
            padding: 8
          }}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#831843',
            marginTop: 20
          }}>
            Loading family data...
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{
        flex: 1,
        backgroundColor: '#fdf2f8',
        paddingTop: Platform.OS === 'ios' ? 44 : 20
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f9a8d4',
          backgroundColor: '#ffffff'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="gift" size={24} color="#be185d" />
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#831843',
              marginLeft: 8
            }}>
              Manage Rewards
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {/* Add Reward Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#be185d',
              borderRadius: 24,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#be185d',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 8
            }}>
              Add New Reward
            </Text>
          </TouchableOpacity>

          {/* Rewards List */}
          {loading ? (
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 40,
              alignItems: 'center',
              shadowColor: '#be185d',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2
            }}>
              <Text style={{ color: '#831843', fontSize: 16 }}>Loading rewards...</Text>
            </View>
          ) : rewards.length === 0 ? (
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 40,
              alignItems: 'center',
              shadowColor: '#be185d',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2
            }}>
              <Ionicons name="gift-outline" size={48} color="#f9a8d4" />
              <Text style={{
                color: '#831843',
                fontSize: 18,
                fontWeight: '600',
                marginTop: 16,
                textAlign: 'center'
              }}>
                No rewards yet
              </Text>
              <Text style={{
                color: '#9f1239',
                fontSize: 14,
                marginTop: 8,
                textAlign: 'center'
              }}>
                Create your first reward to motivate your family!
              </Text>
            </View>
          ) : (
            rewards.map((reward) => (
              <View
                key={reward.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 24,
                  padding: 20,
                  marginBottom: 16,
                  shadowColor: '#be185d',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons
                        name={getCategoryIcon(reward.category) as any}
                        size={20}
                        color="#be185d"
                      />
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: '#831843',
                        marginLeft: 8,
                        flex: 1
                      }}>
                        {reward.name}
                      </Text>
                      {reward.featured && (
                        <View style={{
                          backgroundColor: '#f59e0b',
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          marginLeft: 8
                        }}>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: '#ffffff'
                          }}>
                            FEATURED
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={{
                      fontSize: 14,
                      color: '#9f1239',
                      marginBottom: 8
                    }}>
                      {getCategoryLabel(reward.category)} • {reward.pointsCost} points
                    </Text>
                    
                    {reward.description && (
                      <Text style={{
                        fontSize: 14,
                        color: '#831843',
                        marginBottom: 8
                      }}>
                        {reward.description}
                      </Text>
                    )}
                    
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {reward.minLevel && (
                        <View style={{
                          backgroundColor: '#fbcfe8',
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2
                        }}>
                          <Text style={{
                            fontSize: 12,
                            color: '#831843',
                            fontWeight: '600'
                          }}>
                            Level {reward.minLevel}+
                          </Text>
                        </View>
                      )}
                      {reward.cooldownDays && (
                        <View style={{
                          backgroundColor: '#fbcfe8',
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2
                        }}>
                          <Text style={{
                            fontSize: 12,
                            color: '#831843',
                            fontWeight: '600'
                          }}>
                            {reward.cooldownDays}d cooldown
                          </Text>
                        </View>
                      )}
                      {reward.hasStock && !reward.isUnlimited && (
                        <View style={{
                          backgroundColor: '#fbcfe8',
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2
                        }}>
                          <Text style={{
                            fontSize: 12,
                            color: '#831843',
                            fontWeight: '600'
                          }}>
                            Stock: {reward.stockCount || 0}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', marginLeft: 12 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#f9a8d4',
                        borderRadius: 16,
                        padding: 8,
                        marginRight: 8
                      }}
                      onPress={() => handleEditReward(reward)}
                    >
                      <Ionicons name="pencil" size={16} color="#be185d" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#fecaca',
                        borderRadius: 16,
                        padding: 8
                      }}
                      onPress={() => handleDeleteReward(reward)}
                    >
                      <Ionicons name="trash" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Create/Edit Reward Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={{
            flex: 1,
            backgroundColor: '#fdf2f8',
            paddingTop: Platform.OS === 'ios' ? 44 : 20
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f9a8d4',
              backgroundColor: '#ffffff'
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#831843'
              }}>
                {editingReward ? 'Edit Reward' : 'Create New Reward'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#831843" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={{ flex: 1, padding: 20 }}>
              {/* Name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#831843',
                  marginBottom: 8
                }}>
                  Reward Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 12,
                    fontSize: 16,
                    borderWidth: 2,
                    borderColor: '#f9a8d4',
                    color: '#831843'
                  }}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Extra screen time"
                  placeholderTextColor="#9f1239"
                />
              </View>

              {/* Description */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#831843',
                  marginBottom: 8
                }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 12,
                    fontSize: 16,
                    borderWidth: 2,
                    borderColor: '#f9a8d4',
                    color: '#831843',
                    minHeight: 80
                  }}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Describe what this reward includes..."
                  placeholderTextColor="#9f1239"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Points Cost */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#831843',
                  marginBottom: 8
                }}>
                  Point Cost *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 12,
                    fontSize: 16,
                    borderWidth: 2,
                    borderColor: '#f9a8d4',
                    color: '#831843'
                  }}
                  value={formData.pointsCost}
                  onChangeText={(text) => setFormData({ ...formData, pointsCost: text })}
                  placeholder="e.g., 50"
                  placeholderTextColor="#9f1239"
                  keyboardType="numeric"
                />
              </View>

              {/* Category */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#831843',
                  marginBottom: 8
                }}>
                  Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {REWARD_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        style={{
                          backgroundColor: formData.category === category.value ? '#be185d' : '#ffffff',
                          borderRadius: 16,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderWidth: 2,
                          borderColor: '#f9a8d4'
                        }}
                        onPress={() => setFormData({ ...formData, category: category.value })}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={16}
                          color={formData.category === category.value ? '#ffffff' : '#be185d'}
                        />
                        <Text style={{
                          color: formData.category === category.value ? '#ffffff' : '#831843',
                          fontWeight: '600',
                          marginLeft: 6
                        }}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Advanced Options */}
              <View style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#f9a8d4'
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#831843',
                  marginBottom: 16
                }}>
                  Advanced Options
                </Text>

                {/* Min Level */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#831843',
                    marginBottom: 8
                  }}>
                    Minimum Level Required
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#fdf2f8',
                      borderRadius: 12,
                      padding: 10,
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: '#f9a8d4',
                      color: '#831843'
                    }}
                    value={formData.minLevel}
                    onChangeText={(text) => setFormData({ ...formData, minLevel: text })}
                    placeholder="e.g., 2"
                    placeholderTextColor="#9f1239"
                    keyboardType="numeric"
                  />
                </View>

                {/* Cooldown */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#831843',
                    marginBottom: 8
                  }}>
                    Cooldown (days)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#fdf2f8',
                      borderRadius: 12,
                      padding: 10,
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: '#f9a8d4',
                      color: '#831843'
                    }}
                    value={formData.cooldownDays}
                    onChangeText={(text) => setFormData({ ...formData, cooldownDays: text })}
                    placeholder="e.g., 7"
                    placeholderTextColor="#9f1239"
                    keyboardType="numeric"
                  />
                </View>

                {/* Toggle Options */}
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setFormData({ ...formData, featured: !formData.featured })}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#831843'
                    }}>
                      Featured Reward
                    </Text>
                    <View style={{
                      width: 50,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: formData.featured ? '#be185d' : '#f9a8d4',
                      justifyContent: 'center',
                      alignItems: formData.featured ? 'flex-end' : 'flex-start',
                      paddingHorizontal: 2
                    }}>
                      <View style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: '#ffffff'
                      }} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#be185d',
                  borderRadius: 24,
                  padding: 16,
                  alignItems: 'center',
                  marginBottom: 40,
                  shadowColor: '#be185d',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
                onPress={handleSaveReward}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {editingReward ? 'Update Reward' : 'Create Reward'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}