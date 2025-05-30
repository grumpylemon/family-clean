import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import UniversalIcon from './ui/UniversalIcon';
import { WeeklyPointsData } from '../types';
import { getWeeklyComparison } from '../services/firestore';

interface WeeklyComparisonProps {
  userId: string;
  familyId: string;
  weeksToShow?: number;
}

interface WeekBarProps {
  weekData: WeeklyPointsData;
  maxPoints: number;
  index: number;
}

const WeekBar: React.FC<WeekBarProps> = ({ weekData, maxPoints, index }) => {
  const barWidth = maxPoints > 0 ? (weekData.totalPoints / maxPoints) * 100 : 0;
  const weekLabel = index === 0 ? 'This Week' : index === 1 ? 'Last Week' : `${index} Weeks Ago`;
  const barColor = index === 0 ? '#be185d' : '#f9a8d4';

  return (
    <View style={styles.weekRow}>
      <View style={styles.weekLabelContainer}>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <Text style={styles.weekDates}>
          {new Date(weekData.startDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })} - {new Date(weekData.endDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(barWidth, 100)}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <Text style={styles.pointsText}>{weekData.totalPoints} pts</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.choreCount}>{weekData.totalChores} chores</Text>
      </View>
    </View>
  );
};

const WeeklyComparison: React.FC<WeeklyComparisonProps> = ({
  userId,
  familyId,
  weeksToShow = 4,
}) => {
  const [weeksData, setWeeksData] = useState<WeeklyPointsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeklyComparison();
  }, [userId, familyId, weeksToShow]);

  const loadWeeklyComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyComparison(userId, familyId, weeksToShow);
      setWeeksData(data);
    } catch (err) {
      console.error('Error loading weekly comparison:', err);
      setError('Failed to load weekly comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#be185d" />
        </View>
      </View>
    );
  }

  if (error || weeksData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <UniversalIcon name="alert-circle-outline" size={48} color="#9f1239" />
          <Text style={styles.errorText}>{error || 'No data available'}</Text>
        </View>
      </View>
    );
  }

  const maxPoints = Math.max(...weeksData.map(w => w.totalPoints), 1);

  // Calculate week-over-week change
  const weekChange = weeksData.length >= 2
    ? weeksData[0].totalPoints - weeksData[1].totalPoints
    : 0;
  const percentChange = weeksData.length >= 2 && weeksData[1].totalPoints > 0
    ? Math.round((weekChange / weeksData[1].totalPoints) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UniversalIcon name="bar-chart" size={24} color="#be185d" />
        <Text style={styles.title}>Weekly Comparison</Text>
      </View>

      {weeksData.length >= 2 && (
        <View style={styles.changeContainer}>
          <UniversalIcon
            name={weekChange >= 0 ? 'trending-up' : 'trending-down'}
            size={20}
            color={weekChange >= 0 ? '#10b981' : '#ef4444'}
          />
          <Text
            style={[
              styles.changeText,
              { color: weekChange >= 0 ? '#10b981' : '#ef4444' },
            ]}
          >
            {weekChange >= 0 ? '+' : ''}{weekChange} pts ({percentChange >= 0 ? '+' : ''}{percentChange}%)
          </Text>
          <Text style={styles.changeLabel}>vs last week</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {weeksData.map((weekData, index) => (
          <WeekBar
            key={`week-${index}`}
            weekData={weekData}
            maxPoints={maxPoints}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#9f1239',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginLeft: 10,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  changeLabel: {
    fontSize: 14,
    color: '#9f1239',
    marginLeft: 6,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  weekRow: {
    marginBottom: 20,
  },
  weekLabelContainer: {
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  weekDates: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  barBackground: {
    flex: 1,
    height: 32,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#be185d',
    minWidth: 60,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choreCount: {
    fontSize: 12,
    color: '#9f1239',
  },
});

export default WeeklyComparison;