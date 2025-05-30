import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '../stores/hooks';
import TakeoverLeaderboard from './TakeoverLeaderboard';
import ChoreHealthMetrics from './ChoreHealthMetrics';
import { AnalyticsPeriod } from '../types';

export default function TakeoverAnalyticsDashboard() {
  const { family } = useFamilyStore((state) => state.family);
  const { 
    refreshAnalytics, 
    isLoading, 
    collaborationScore,
    insights,
    selectedPeriod,
  } = useFamilyStore((state) => state.analytics);

  useEffect(() => {
    if (family) {
      refreshAnalytics();
    }
  }, [family, selectedPeriod]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#be185d" />
        <Text style={styles.loadingText}>Calculating analytics...</Text>
      </View>
    );
  }

  const getCollaborationScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'analytics';
      case 'suggestion':
        return 'bulb';
      case 'achievement':
        return 'star';
      case 'warning':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Takeover Analytics</Text>
          <Text style={styles.subtitle}>
            Family collaboration insights for {selectedPeriod.replace('-', ' ')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshAnalytics}
        >
          <Ionicons name="refresh" size={24} color="#be185d" />
        </TouchableOpacity>
      </View>

      {/* Collaboration Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Collaboration Score</Text>
          <Ionicons name="people" size={24} color="#be185d" />
        </View>
        <View style={styles.scoreContent}>
          <View style={styles.scoreCircle}>
            <Text
              style={[
                styles.scoreValue,
                { color: getCollaborationScoreColor(collaborationScore) },
              ]}
            >
              {collaborationScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreDescription}>
              {collaborationScore >= 80
                ? 'Excellent teamwork! Your family helps each other consistently.'
                : collaborationScore >= 60
                ? 'Good collaboration with room for improvement.'
                : 'Consider encouraging more family members to help with overdue chores.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Leaderboard Section */}
      <View style={styles.section}>
        <TakeoverLeaderboard />
      </View>

      {/* Chore Health Metrics */}
      <View style={styles.section}>
        <ChoreHealthMetrics />
      </View>

      {/* Insights Section */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Insights</Text>
            <Ionicons name="sparkles" size={20} color="#be185d" />
          </View>
          <View style={styles.insightsList}>
            {insights.slice(0, 5).map((insight) => (
              <View
                key={insight.id}
                style={[
                  styles.insightCard,
                  { borderLeftColor: getInsightColor(insight.priority) },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Ionicons
                    name={getInsightIcon(insight.type) as any}
                    size={20}
                    color={getInsightColor(insight.priority)}
                  />
                  <Text style={styles.insightType}>
                    {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                  </Text>
                </View>
                <Text style={styles.insightMessage}>{insight.message}</Text>
                {insight.actionable && insight.action && (
                  <TouchableOpacity style={styles.insightAction}>
                    <Text style={styles.insightActionText}>
                      {insight.action.type === 'reassign'
                        ? 'Reassign Chore'
                        : insight.action.type === 'adjust_points'
                        ? 'Adjust Points'
                        : insight.action.type === 'change_schedule'
                        ? 'Update Schedule'
                        : 'Take Action'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#be185d" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            {insights.filter((i) => i.type === 'achievement').length}
          </Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bulb" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            {insights.filter((i) => i.type === 'suggestion').length}
          </Text>
          <Text style={styles.statLabel}>Suggestions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.statValue}>
            {insights.filter((i) => i.type === 'warning').length}
          </Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9f1239',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
  },
  subtitle: {
    fontSize: 14,
    color: '#9f1239',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  scoreCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 24,
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
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 14,
    color: '#9f1239',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#831843',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9f1239',
    textTransform: 'uppercase',
  },
  insightMessage: {
    fontSize: 14,
    color: '#831843',
    lineHeight: 20,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  insightActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 40,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    minWidth: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
  },
});