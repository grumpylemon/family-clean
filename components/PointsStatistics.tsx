import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPointStatistics, 
  getPointTransactionHistory, 
  getAllPointMilestones 
} from '@/services/pointsService';
import { PointTransaction, PointMilestone } from '@/types';
import { PointTransfer } from './PointTransfer';

const { width } = Dimensions.get('window');

interface PointsStatisticsProps {
  userId: string;
  familyId: string;
  visible: boolean;
  onClose: () => void;
}

interface PointStats {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  lifetimePoints: number;
  weeklyPoints: number;
  averageDaily: number;
  biggestSingleEarn: number;
  currentMilestone?: PointMilestone;
  nextMilestone?: PointMilestone;
  milestonesAchieved: number;
}

export const PointsStatistics: React.FC<PointsStatisticsProps> = ({
  userId,
  familyId,
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'milestones'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PointStats | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [milestones] = useState<PointMilestone[]>(getAllPointMilestones());
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, userId, familyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pointStats, transactionHistory] = await Promise.all([
        getPointStatistics(userId, familyId),
        getPointTransactionHistory(userId, familyId, 50)
      ]);

      setStats(pointStats);
      setTransactions(transactionHistory);
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (transaction: PointTransaction) => {
    switch (transaction.type) {
      case 'earned': return '⬆️';
      case 'spent': return '⬇️';
      case 'bonus': return '✨';
      case 'milestone': return '🏆';
      case 'penalty': return '⚠️';
      case 'transferred': return '↔️';
      default: return '•';
    }
  };

  const getTransactionColor = (transaction: PointTransaction) => {
    switch (transaction.type) {
      case 'earned':
      case 'bonus':
      case 'milestone':
        return '#10b981';
      case 'spent':
      case 'penalty':
        return '#ef4444';
      case 'transferred':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.currentBalance || 0}</Text>
          <Text style={styles.statLabel}>Current Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.lifetimePoints || 0}</Text>
          <Text style={styles.statLabel}>Lifetime Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.weeklyPoints || 0}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(stats?.averageDaily || 0)}</Text>
          <Text style={styles.statLabel}>Daily Average</Text>
        </View>
      </View>

      {/* Transfer Points Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.transferButton}
          onPress={() => setShowTransfer(true)}
        >
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          <Text style={styles.transferButtonText}>Transfer Points to Family</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        
        {stats?.nextMilestone && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Next Milestone</Text>
              <Text style={styles.progressMilestone}>
                {stats.nextMilestone.icon} {stats.nextMilestone.title}
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, (stats.lifetimePoints / stats.nextMilestone.pointsRequired) * 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {stats.lifetimePoints} / {stats.nextMilestone.pointsRequired} points
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.achievementCard}>
          <Text style={styles.achievementTitle}>Achievements</Text>
          <View style={styles.achievementStats}>
            <View style={styles.achievementStat}>
              <Text style={styles.achievementNumber}>{stats?.milestonesAchieved || 0}</Text>
              <Text style={styles.achievementLabel}>Milestones</Text>
            </View>
            <View style={styles.achievementStat}>
              <Text style={styles.achievementNumber}>{stats?.biggestSingleEarn || 0}</Text>
              <Text style={styles.achievementLabel}>Best Single Earn</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Complete chores to start earning points!</Text>
        </View>
      ) : (
        transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionEmoji}>{getTransactionIcon(transaction)}</Text>
            </View>
            
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>
                {transaction.description}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(transaction.createdAt as string)}
              </Text>
              {transaction.metadata?.choreTitle && (
                <Text style={styles.transactionMeta}>
                  {transaction.metadata.choreTitle}
                </Text>
              )}
            </View>
            
            <View style={styles.transactionAmount}>
              <Text 
                style={[
                  styles.transactionPoints, 
                  { color: getTransactionColor(transaction) }
                ]}
              >
                {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderMilestones = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Point Milestones</Text>
      {milestones.map((milestone) => {
        const isAchieved = stats ? stats.lifetimePoints >= milestone.pointsRequired : false;
        const isCurrent = stats?.currentMilestone?.id === milestone.id;
        const isNext = stats?.nextMilestone?.id === milestone.id;
        
        return (
          <View 
            key={milestone.id} 
            style={[
              styles.milestoneItem,
              isAchieved && styles.milestoneAchieved,
              isCurrent && styles.milestoneCurrent
            ]}
          >
            <View style={styles.milestoneIcon}>
              <Text style={[
                styles.milestoneEmoji,
                !isAchieved && styles.milestoneEmojiDisabled
              ]}>
                {milestone.icon}
              </Text>
            </View>
            
            <View style={styles.milestoneDetails}>
              <Text style={[
                styles.milestoneTitle,
                !isAchieved && styles.milestoneTitleDisabled
              ]}>
                {milestone.title}
              </Text>
              <Text style={styles.milestoneDescription}>
                {milestone.description}
              </Text>
              <Text style={styles.milestonePoints}>
                {milestone.pointsRequired.toLocaleString()} points
              </Text>
              
              {milestone.unlockRewards && (
                <View style={styles.milestoneRewards}>
                  {milestone.unlockRewards.bonusPoints && (
                    <Text style={styles.milestoneReward}>
                      🎁 +{milestone.unlockRewards.bonusPoints} bonus points
                    </Text>
                  )}
                  {milestone.unlockRewards.specialBadge && (
                    <Text style={styles.milestoneReward}>
                      🏅 {milestone.unlockRewards.specialBadge} badge
                    </Text>
                  )}
                </View>
              )}
            </View>
            
            <View style={styles.milestoneStatus}>
              {isAchieved ? (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              ) : isNext ? (
                <Text style={styles.milestoneProgress}>
                  {stats ? Math.round((stats.lifetimePoints / milestone.pointsRequired) * 100) : 0}%
                </Text>
              ) : (
                <Ionicons name="lock-closed" size={20} color="#9ca3af" />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Points & Progress</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {(['overview', 'history', 'milestones'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#be185d" />
            <Text style={styles.loadingText}>Loading points data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'milestones' && renderMilestones()}
          </>
        )}
        
        {/* Point Transfer Modal */}
        <PointTransfer
          visible={showTransfer}
          onClose={() => setShowTransfer(false)}
          currentUserPoints={stats?.currentBalance || 0}
        />
      </View>
    </Modal>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  closeButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#be185d',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#be185d',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2, // Account for padding and gap
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  progressMilestone: {
    fontSize: 18,
    fontWeight: '700',
    color: '#be185d',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f9a8d4',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#be185d',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
    textAlign: 'center',
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 16,
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 4,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9f1239',
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9f1239',
  },
  transactionMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#be185d',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneAchieved: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  milestoneCurrent: {
    borderLeftWidth: 4,
    borderLeftColor: '#be185d',
  },
  milestoneIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  milestoneEmoji: {
    fontSize: 24,
  },
  milestoneEmojiDisabled: {
    opacity: 0.5,
  },
  milestoneDetails: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  milestoneTitleDisabled: {
    color: '#9ca3af',
  },
  milestoneDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9f1239',
    marginBottom: 4,
  },
  milestonePoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#be185d',
  },
  milestoneRewards: {
    marginTop: 8,
  },
  milestoneReward: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
    marginBottom: 2,
  },
  milestoneStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  milestoneProgress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#be185d',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9f1239',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginTop: 16,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  transferButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
});