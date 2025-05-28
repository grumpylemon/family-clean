import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeeklyPointsData } from '@/types';
import { getWeeklyPointsData } from '@/services/firestore';

interface WeeklyProgressProps {
  userId: string;
  familyId: string;
  userName?: string;
}

interface DayProgressProps {
  day: string;
  date: string;
  points: number;
  choreCount: number;
  maxPoints: number;
  isToday: boolean;
}

const DayProgress: React.FC<DayProgressProps> = ({
  day,
  date,
  points,
  choreCount,
  maxPoints,
  isToday,
}) => {
  const barHeight = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

  return (
    <View style={[styles.dayContainer, isToday && styles.todayContainer]}>
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                height: `${Math.min(barHeight, 100)}%`,
                backgroundColor: isToday ? '#be185d' : '#f9a8d4',
              },
            ]}
          />
        </View>
        <Text style={styles.pointsLabel}>{points}</Text>
      </View>
      <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day}</Text>
      {choreCount > 0 && (
        <Text style={styles.choreCount}>{choreCount} chore{choreCount !== 1 ? 's' : ''}</Text>
      )}
    </View>
  );
};

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({ userId, familyId, userName }) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeklyData();
  }, [userId, familyId]);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyPointsData(userId, familyId);
      setWeeklyData(data);
    } catch (err) {
      console.error('Error loading weekly data:', err);
      setError('Failed to load weekly progress');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const isToday = (dateString: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
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

  if (error || !weeklyData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9f1239" />
          <Text style={styles.errorText}>{error || 'No data available'}</Text>
        </View>
      </View>
    );
  }

  const maxPoints = Math.max(...weeklyData.dailyPoints.map(d => d.points), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={24} color="#be185d" />
        <Text style={styles.title}>
          {userName ? `${userName}'s Week` : 'Weekly Progress'}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{weeklyData.totalPoints}</Text>
          <Text style={styles.summaryLabel}>Total Points</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{weeklyData.totalChores}</Text>
          <Text style={styles.summaryLabel}>Chores Done</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {weeklyData.totalChores > 0
              ? Math.round(weeklyData.totalPoints / weeklyData.totalChores)
              : 0}
          </Text>
          <Text style={styles.summaryLabel}>Avg Points</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContainer}
      >
        {weeklyData.dailyPoints.map((dayData, index) => (
          <DayProgress
            key={dayData.date}
            day={getDayName(dayData.date)}
            date={dayData.date}
            points={dayData.points}
            choreCount={dayData.choreCount}
            maxPoints={maxPoints}
            isToday={isToday(dayData.date)}
          />
        ))}
      </ScrollView>

      <View style={styles.weekInfo}>
        <Text style={styles.weekInfoText}>
          Week {weeklyData.weekNumber} of {weeklyData.year}
        </Text>
      </View>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginLeft: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fdf2f8',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#be185d',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
  },
  chartContainer: {
    paddingVertical: 10,
  },
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  todayContainer: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 4,
  },
  barContainer: {
    height: 120,
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barBackground: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 100,
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 16,
  },
  pointsLabel: {
    position: 'absolute',
    bottom: 105,
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
    marginTop: 8,
  },
  todayLabel: {
    color: '#be185d',
    fontWeight: '700',
  },
  choreCount: {
    fontSize: 10,
    color: '#9f1239',
    marginTop: 2,
  },
  weekInfo: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#fdf2f8',
    alignItems: 'center',
  },
  weekInfoText: {
    fontSize: 12,
    color: '#9f1239',
  },
});

export default WeeklyProgress;