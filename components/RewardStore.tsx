import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reward, RewardCategory, RewardRedemption } from '@/types';
import { 
  getRewards, 
  canRedeemReward,
  redeemReward,
  getUserRedemptions
} from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface RewardStoreProps {
  familyId: string;
  userPoints: number;
  onClose: () => void;
  onRedemption?: () => void; // Callback to refresh points in parent
}

const CATEGORY_ICONS: Record<RewardCategory, string> = {
  privilege: 'crown-outline',
  item: 'gift-outline',
  experience: 'happy-outline',
  money: 'cash-outline',
  digital: 'phone-portrait-outline',
  other: 'ellipsis-horizontal-outline'
};

export default function RewardStore({ familyId, userPoints, onClose, onRedemption }: RewardStoreProps) {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | 'all'>('all');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redemptionNotes, setRedemptionNotes] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    loadData();
  }, [familyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedRewards, redemptions] = await Promise.all([
        getRewards(familyId),
        user ? getUserRedemptions(user.uid, familyId) : []
      ]);
      setRewards(fetchedRewards);
      setUserRedemptions(redemptions);
    } catch (error) {
      console.error('Error loading reward store data:', error);
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

  const filteredRewards = rewards.filter(reward => {
    if (selectedCategory === 'all') return true;
    return reward.category === selectedCategory;
  });

  const featuredRewards = filteredRewards.filter(r => r.featured);
  const regularRewards = filteredRewards.filter(r => !r.featured);

  const handleRedeemPress = async (reward: Reward) => {
    if (!user) return;

    try {
      const eligibility = await canRedeemReward(user.uid, reward.id!);
      if (!eligibility.canRedeem) {
        showAlert('Cannot Redeem', eligibility.reason || 'Unable to redeem this reward');
        return;
      }

      setSelectedReward(reward);
      setRedemptionNotes('');
      setShowRedeemModal(true);
    } catch (error) {
      console.error('Error checking redemption eligibility:', error);
      showAlert('Error', 'Failed to check redemption eligibility');
    }
  };

  const confirmRedemption = async () => {
    if (!user || !selectedReward) return;

    try {
      setRedeeming(true);
      const result = await redeemReward(user.uid, selectedReward.id!, redemptionNotes);
      
      if (result.success) {
        showAlert('Success!', `You've redeemed "${selectedReward.name}"! It's now pending approval.`);
        setShowRedeemModal(false);
        setSelectedReward(null);
        setRedemptionNotes('');
        await loadData(); // Refresh data
        onRedemption?.(); // Notify parent to refresh points
      } else {
        showAlert('Error', result.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      showAlert('Error', 'Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  const getRecentRedemptionForReward = (rewardId: string) => {
    return userRedemptions
      .filter(r => r.rewardId === rewardId && r.status !== 'cancelled')
      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime())[0];
  };

  const canAfford = (pointsCost: number) => userPoints >= pointsCost;

  const categories: { value: RewardCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'apps-outline' },
    { value: 'privilege', label: 'Privileges', icon: 'crown-outline' },
    { value: 'item', label: 'Items', icon: 'gift-outline' },
    { value: 'experience', label: 'Experiences', icon: 'happy-outline' },
    { value: 'money', label: 'Money', icon: 'cash-outline' },
    { value: 'digital', label: 'Digital', icon: 'phone-portrait-outline' }
  ];

  const renderReward = (reward: Reward) => {
    const affordable = canAfford(reward.pointsCost);
    const recentRedemption = getRecentRedemptionForReward(reward.id!);
    const isOnCooldown = Boolean(recentRedemption && reward.cooldownDays && 
      new Date() < new Date(new Date(recentRedemption.redeemedAt).getTime() + reward.cooldownDays * 24 * 60 * 60 * 1000));

    return (
      <View
        key={reward.id}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 24,
          padding: 20,
          marginBottom: 16,
          opacity: affordable ? 1 : 0.6,
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
          alignItems: 'flex-start'
        }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons
                name={CATEGORY_ICONS[reward.category] as any}
                size={24}
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
                  paddingVertical: 2
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

            <View style={{
              backgroundColor: '#be185d',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignSelf: 'flex-start',
              marginBottom: 8
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '700'
              }}>
                {reward.pointsCost} points
              </Text>
            </View>

            {reward.description && (
              <Text style={{
                fontSize: 14,
                color: '#831843',
                marginBottom: 12,
                lineHeight: 20
              }}>
                {reward.description}
              </Text>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
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
                  backgroundColor: reward.stockCount && reward.stockCount > 0 ? '#bbf7d0' : '#fecaca',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: reward.stockCount && reward.stockCount > 0 ? '#065f46' : '#dc2626',
                    fontWeight: '600'
                  }}>
                    {reward.stockCount && reward.stockCount > 0 ? `${reward.stockCount} left` : 'Out of stock'}
                  </Text>
                </View>
              )}
            </View>

            {recentRedemption && (
              <View style={{
                backgroundColor: '#fef3c7',
                borderRadius: 12,
                padding: 8,
                marginBottom: 8
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#92400e',
                  fontWeight: '600'
                }}>
                  Recent redemption: {new Date(recentRedemption.redeemedAt).toLocaleDateString()} ({recentRedemption.status})
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: affordable && !isOnCooldown ? '#be185d' : '#f9a8d4',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginLeft: 12
            }}
            onPress={() => handleRedeemPress(reward)}
            disabled={!affordable || isOnCooldown}
          >
            <Text style={{
              color: affordable && !isOnCooldown ? '#ffffff' : '#831843',
              fontSize: 14,
              fontWeight: '600'
            }}>
              {isOnCooldown ? 'Cooldown' : affordable ? 'Redeem' : 'Need more'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
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
            <Ionicons name="storefront" size={24} color="#be185d" />
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#831843',
              marginLeft: 8
            }}>
              Reward Store
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#be185d',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 12
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '700'
              }}>
                {userPoints} points
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#f9a8d4'
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={{
                  backgroundColor: selectedCategory === category.value ? '#be185d' : '#fdf2f8',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: selectedCategory === category.value ? '#be185d' : '#f9a8d4'
                }}
                onPress={() => setSelectedCategory(category.value)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.value ? '#ffffff' : '#be185d'}
                />
                <Text style={{
                  color: selectedCategory === category.value ? '#ffffff' : '#831843',
                  fontWeight: '600',
                  marginLeft: 6
                }}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Content */}
        <ScrollView style={{ flex: 1, padding: 20 }}>
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
          ) : filteredRewards.length === 0 ? (
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
              <Ionicons name="storefront-outline" size={48} color="#f9a8d4" />
              <Text style={{
                color: '#831843',
                fontSize: 18,
                fontWeight: '600',
                marginTop: 16,
                textAlign: 'center'
              }}>
                No rewards available
              </Text>
              <Text style={{
                color: '#9f1239',
                fontSize: 14,
                marginTop: 8,
                textAlign: 'center'
              }}>
                Ask your family admin to add some rewards!
              </Text>
            </View>
          ) : (
            <View>
              {/* Featured Rewards */}
              {featuredRewards.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <Ionicons name="star" size={20} color="#f59e0b" />
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#831843',
                      marginLeft: 8
                    }}>
                      Featured Rewards
                    </Text>
                  </View>
                  {featuredRewards.map(renderReward)}
                </View>
              )}

              {/* Regular Rewards */}
              {regularRewards.length > 0 && (
                <View>
                  {featuredRewards.length > 0 && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 16
                    }}>
                      <Ionicons name="gift" size={20} color="#be185d" />
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: '#831843',
                        marginLeft: 8
                      }}>
                        All Rewards
                      </Text>
                    </View>
                  )}
                  {regularRewards.map(renderReward)}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Redemption Confirmation Modal */}
        <Modal
          visible={showRedeemModal}
          animationType="slide"
          transparent={true}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8
            }}>
              <View style={{
                alignItems: 'center',
                marginBottom: 20
              }}>
                <View style={{
                  backgroundColor: '#be185d',
                  borderRadius: 32,
                  padding: 16,
                  marginBottom: 12
                }}>
                  <Ionicons name="gift" size={32} color="#ffffff" />
                </View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#831843',
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  Redeem Reward
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#831843',
                  textAlign: 'center',
                  marginBottom: 4
                }}>
                  {selectedReward?.name}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#9f1239',
                  textAlign: 'center'
                }}>
                  {selectedReward?.pointsCost} points will be deducted
                </Text>
              </View>

              {/* Optional Notes */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#831843',
                  marginBottom: 8
                }}>
                  Notes (optional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#fdf2f8',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 14,
                    borderWidth: 2,
                    borderColor: '#f9a8d4',
                    color: '#831843',
                    minHeight: 60
                  }}
                  value={redemptionNotes}
                  onChangeText={setRedemptionNotes}
                  placeholder="Any special requests or notes..."
                  placeholderTextColor="#9f1239"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={{
                flexDirection: 'row',
                gap: 12
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#f9a8d4',
                    borderRadius: 16,
                    padding: 12,
                    alignItems: 'center'
                  }}
                  onPress={() => setShowRedeemModal(false)}
                  disabled={redeeming}
                >
                  <Text style={{
                    color: '#831843',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#be185d',
                    borderRadius: 16,
                    padding: 12,
                    alignItems: 'center',
                    opacity: redeeming ? 0.6 : 1
                  }}
                  onPress={confirmRedemption}
                  disabled={redeeming}
                >
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {redeeming ? 'Redeeming...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}