import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import UniversalIcon from './ui/UniversalIcon';
import { TakeoverLeaderboardEntry, AnalyticsPeriod } from '../types';
import { useFamilyStore } from '../stores/hooks';

interface TakeoverLeaderboardProps {
  onPeriodChange?: (period: AnalyticsPeriod) => void;
}

export default function TakeoverLeaderboard({ onPeriodChange }: TakeoverLeaderboardProps) {
  const { leaderboard, selectedPeriod, setSelectedPeriod } = useFamilyStore(
    (state) => state.analytics
  );

  const periods: { value: AnalyticsPeriod; label: string }[] = [
    { value: 'weekly', label: 'Week' },
    { value: 'monthly', label: 'Month' },
    { value: 'all-time', label: 'All Time' },
  ];

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <UniversalIcon name="trending-up" size={16} color="#10b981" />;
      case 'down':
        return <UniversalIcon name="trending-down" size={16} color="#ef4444" />;
      case 'stable':
        return <UniversalIcon name="remove" size={16} color="#6b7280" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Helper Heroes</Text>
        <UniversalIcon name="trophy" size={24} color="#f59e0b" />
      </View>

      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
        contentContainerStyle={styles.periodSelectorContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.periodTab,
              selectedPeriod === period.value && styles.periodTabActive,
            ]}
            onPress={() => handlePeriodChange(period.value)}
          >
            <Text
              style={[
                styles.periodTabText,
                selectedPeriod === period.value && styles.periodTabTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leaderboard */}
      <ScrollView style={styles.leaderboardList}>
        {leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <UniversalIcon name="people-outline" size={48} color="#f9a8d4" />
            <Text style={styles.emptyText}>No takeover data yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to help a family member!
            </Text>
          </View>
        ) : (
          leaderboard.map((entry, index) => (
            <View
              key={entry.userId}
              style={[
                styles.leaderboardItem,
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace,
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>
                  {getRankIcon(entry.rank) || entry.rank}
                </Text>
                {getTrendIcon(entry.trend)}
              </View>

              <View style={styles.userInfo}>
                {entry.photoURL ? (
                  <Image source={{ uri: entry.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {entry.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{entry.userName}</Text>
                  <View style={styles.stats}>
                    <View style={styles.statItem}>
                      <UniversalIcon name="hand-right" size={14} color="#9f1239" />
                      <Text style={styles.statText}>{entry.totalTakeovers}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <UniversalIcon name="star" size={14} color="#f59e0b" />
                      <Text style={styles.statText}>+{entry.bonusPointsEarned}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <UniversalIcon name="time" size={14} color="#6b7280" />
                      <Text style={styles.statText}>
                        {entry.averageResponseTime.toFixed(1)}h
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {entry.currentStreak > 0 && (
                <View style={styles.streakBadge}>
                  <UniversalIcon name="flame" size={16} color="#ef4444" />
                  <Text style={styles.streakText}>{entry.currentStreak}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Summary Stats */}
      {leaderboard.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {leaderboard.reduce((sum, e) => sum + e.totalTakeovers, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Total Takeovers</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {leaderboard.length}
            </Text>
            <Text style={styles.summaryLabel}>Active Helpers</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(
                leaderboard.reduce((sum, e) => sum + e.averageResponseTime, 0) /
                leaderboard.length
              ).toFixed(1)}h
            </Text>
            <Text style={styles.summaryLabel}>Avg Response</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#be185d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  periodSelector: {
    maxHeight: 40,
    marginBottom: 20,
  },
  periodSelectorContent: {
    gap: 8,
  },
  periodTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  periodTabActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
  },
  periodTabTextActive: {
    color: 'white',
  },
  leaderboardList: {
    flex: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  firstPlace: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  secondPlace: {
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  thirdPlace: {
    borderColor: '#f59e0b',
    backgroundColor: '#fff7ed',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#be185d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#9f1239',
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9f1239',
    marginTop: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#be185d',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#fbcfe8',
  },
});