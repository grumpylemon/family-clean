import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useAuth, useFamily } from '../../hooks/useZustandHooks';
import { WebIcon } from '../../components/ui/WebIcon';
import { Reward, RewardCategory, RewardRedemption } from '../../types';
import { 
  getRewards, 
  canRedeemReward,
  redeemReward,
  getUserRedemptions
} from '../../services/firestore';

export default function RewardsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { family, currentMember, loading: familyLoading } = useFamily();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | 'all'>('all');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redemptionNotes, setRedemptionNotes] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (family?.id) {
      loadData();
    }
  }, [family?.id]);

  const loadData = async () => {
    if (!family?.id) return;
    
    try {
      setLoading(true);
      const [fetchedRewards, redemptions] = await Promise.all([
        getRewards(family.id),
        user ? getUserRedemptions(user.uid, family.id) : []
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

  if (authLoading || familyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#be185d" />
          <Text style={styles.message}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!family || !currentMember) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <WebIcon name="gift-outline" size={64} color="#f9a8d4" style={{ marginBottom: 16 }} />
          <Text style={styles.message}>Please join a family to access rewards.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredRewards = rewards.filter(reward => {
    if (selectedCategory === 'all') return true;
    return reward.category === selectedCategory;
  });

  const featuredRewards = filteredRewards.filter(r => r.featured);
  const regularRewards = filteredRewards.filter(r => !r.featured);

  const categories: { value: RewardCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'apps-outline' },
    { value: 'privilege', label: 'Privileges', icon: 'crown-outline' },
    { value: 'item', label: 'Items', icon: 'gift-outline' },
    { value: 'experience', label: 'Experiences', icon: 'happy-outline' },
    { value: 'money', label: 'Money', icon: 'cash-outline' },
    { value: 'digital', label: 'Digital', icon: 'phone-portrait-outline' }
  ];

  const CATEGORY_ICONS: Record<RewardCategory, string> = {
    privilege: 'crown-outline',
    item: 'gift-outline',
    experience: 'happy-outline',
    money: 'cash-outline',
    digital: 'phone-portrait-outline',
    other: 'ellipsis-horizontal-outline'
  };

  const canAfford = (pointsCost: number) => currentMember.points.current >= pointsCost;

  const getRecentRedemptionForReward = (rewardId: string) => {
    return userRedemptions
      .filter(r => r.rewardId === rewardId && r.status !== 'cancelled')
      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime())[0];
  };

  const renderReward = (reward: Reward) => {
    const affordable = canAfford(reward.pointsCost);
    const recentRedemption = getRecentRedemptionForReward(reward.id!);
    const isOnCooldown = Boolean(recentRedemption && reward.cooldownDays && 
      new Date() < new Date(new Date(recentRedemption.redeemedAt).getTime() + reward.cooldownDays * 24 * 60 * 60 * 1000));

    return (
      <View key={reward.id} style={[styles.rewardCard, !affordable && styles.rewardCardDisabled]}>
        <View style={styles.rewardHeader}>
          <WebIcon
            name={CATEGORY_ICONS[reward.category]}
            size={24}
            color="#be185d"
          />
          {reward.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          )}
        </View>

        <Text style={styles.rewardName}>{reward.name}</Text>
        
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{reward.pointsCost} points</Text>
        </View>

        {reward.description && (
          <Text style={styles.rewardDescription} numberOfLines={2}>
            {reward.description}
          </Text>
        )}

        <View style={styles.rewardMeta}>
          {reward.minLevel && (
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>Level {reward.minLevel}+</Text>
            </View>
          )}
          {reward.cooldownDays && (
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{reward.cooldownDays}d cooldown</Text>
            </View>
          )}
          {reward.hasStock && !reward.isUnlimited && (
            <View style={[
              styles.metaBadge, 
              reward.stockCount && reward.stockCount > 0 ? styles.stockAvailable : styles.stockOut
            ]}>
              <Text style={[
                styles.metaText,
                reward.stockCount && reward.stockCount > 0 ? styles.stockAvailableText : styles.stockOutText
              ]}>
                {reward.stockCount && reward.stockCount > 0 ? `${reward.stockCount} left` : 'Out of stock'}
              </Text>
            </View>
          )}
        </View>

        {recentRedemption && (
          <View style={styles.recentRedemption}>
            <Text style={styles.recentRedemptionText}>
              Redeemed: {new Date(recentRedemption.redeemedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.redeemButton,
            (!affordable || isOnCooldown) && styles.redeemButtonDisabled
          ]}
          onPress={() => handleRedeemPress(reward)}
          disabled={!affordable || isOnCooldown}
        >
          <Text style={[
            styles.redeemButtonText,
            (!affordable || isOnCooldown) && styles.redeemButtonTextDisabled
          ]}>
            {isOnCooldown ? 'Cooldown' : affordable ? 'Redeem' : 'Need more'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <WebIcon name="storefront" size={24} color="#be185d" />
          <Text style={styles.headerTitle}>Reward Store</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{currentMember.points.current} points</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryChip,
              selectedCategory === category.value && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <WebIcon
              name={category.icon}
              size={16}
              color={selectedCategory === category.value ? '#ffffff' : '#be185d'}
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.value && styles.categoryChipTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rewards Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#be185d" />
            <Text style={styles.loadingText}>Loading rewards...</Text>
          </View>
        ) : filteredRewards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <WebIcon name="storefront-outline" size={64} color="#f9a8d4" />
            <Text style={styles.emptyTitle}>No rewards available</Text>
            <Text style={styles.emptySubtitle}>
              Ask your family admin to add some rewards!
            </Text>
          </View>
        ) : (
          <View>
            {/* Featured Rewards */}
            {featuredRewards.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <WebIcon name="star" size={20} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>Featured Rewards</Text>
                </View>
                <View style={styles.rewardsGrid}>
                  {featuredRewards.map(renderReward)}
                </View>
              </View>
            )}

            {/* Regular Rewards */}
            {regularRewards.length > 0 && (
              <View style={styles.section}>
                {featuredRewards.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <WebIcon name="gift" size={20} color="#be185d" />
                    <Text style={styles.sectionTitle}>All Rewards</Text>
                  </View>
                )}
                <View style={styles.rewardsGrid}>
                  {regularRewards.map(renderReward)}
                </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <WebIcon name="gift" size={32} color="#ffffff" />
              </View>
              <Text style={styles.modalTitle}>Redeem Reward</Text>
              <Text style={styles.modalRewardName}>{selectedReward?.name}</Text>
              <Text style={styles.modalPoints}>
                {selectedReward?.pointsCost} points will be deducted
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={redemptionNotes}
                onChangeText={setRedemptionNotes}
                placeholder="Any special requests or notes..."
                placeholderTextColor="#9f1239"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRedeemModal(false)}
                disabled={redeeming}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, redeeming && styles.confirmButtonDisabled]}
                onPress={confirmRedemption}
                disabled={redeeming}
              >
                <Text style={styles.confirmButtonText}>
                  {redeeming ? 'Redeeming...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 18,
    color: '#831843',
    textAlign: 'center',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fdf2f8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  pointsContainer: {
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryScroll: {
    backgroundColor: '#fdf2f8',
    maxHeight: 50,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  categoryChipActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  categoryChipText: {
    color: '#831843',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#831843',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9f1239',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  rewardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '47%',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  pointsBadge: {
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pointsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  rewardDescription: {
    fontSize: 13,
    color: '#831843',
    marginBottom: 8,
    lineHeight: 18,
  },
  rewardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metaBadge: {
    backgroundColor: '#fbcfe8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#831843',
    fontWeight: '600',
  },
  stockAvailable: {
    backgroundColor: '#bbf7d0',
  },
  stockAvailableText: {
    color: '#065f46',
  },
  stockOut: {
    backgroundColor: '#fecaca',
  },
  stockOutText: {
    color: '#dc2626',
  },
  recentRedemption: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 6,
    marginBottom: 8,
  },
  recentRedemptionText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
  },
  redeemButton: {
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#f9a8d4',
  },
  redeemButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  redeemButtonTextDisabled: {
    color: '#831843',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    backgroundColor: '#be185d',
    borderRadius: 32,
    padding: 16,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  modalRewardName: {
    fontSize: 16,
    color: '#831843',
    marginBottom: 4,
  },
  modalPoints: {
    fontSize: 14,
    color: '#9f1239',
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    color: '#831843',
    minHeight: 60,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f9a8d4',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#831843',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#be185d',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});