import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '@/stores/hooks';
import { ChoreHealthMetric } from '@/types';

export default function ChoreHealthMetrics() {
  const { choreHealthMetrics } = useFamilyStore((state) => state.analytics);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return 'checkmark-circle';
    if (score >= 60) return 'alert-circle';
    return 'close-circle';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Needs Attention';
    return 'Critical';
  };

  const renderMetricBar = (value: number, maxValue: number, color: string) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (
      <View style={styles.metricBar}>
        <View
          style={[
            styles.metricBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    );
  };

  const overallHealth = choreHealthMetrics.length > 0
    ? Math.round(
        choreHealthMetrics.reduce((sum, m) => sum + m.healthScore, 0) /
        choreHealthMetrics.length
      )
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chore Health</Text>
        <View style={styles.overallHealth}>
          <Ionicons
            name={getHealthIcon(overallHealth) as any}
            size={20}
            color={getHealthColor(overallHealth)}
          />
          <Text
            style={[
              styles.overallHealthText,
              { color: getHealthColor(overallHealth) },
            ]}
          >
            {overallHealth}% {getHealthLabel(overallHealth)}
          </Text>
        </View>
      </View>

      {choreHealthMetrics.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#f9a8d4" />
          <Text style={styles.emptyText}>No chore health data available</Text>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {Math.round(
                  choreHealthMetrics.reduce((sum, m) => sum + m.takeoverRate, 0) /
                  choreHealthMetrics.length * 100
                )}%
              </Text>
              <Text style={styles.summaryLabel}>Avg Takeover Rate</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {Math.round(
                  choreHealthMetrics.reduce(
                    (sum, m) => sum + m.averageOverdueHours,
                    0
                  ) / choreHealthMetrics.length
                )}h
              </Text>
              <Text style={styles.summaryLabel}>Avg Overdue Time</Text>
            </View>
          </View>

          {/* Detailed Metrics */}
          <ScrollView style={styles.metricsList} showsVerticalScrollIndicator={false}>
            {choreHealthMetrics
              .sort((a, b) => a.healthScore - b.healthScore)
              .map((metric, index) => (
                <View key={`${metric.choreId || index}`} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricTitleContainer}>
                      <Text style={styles.metricTitle}>
                        {metric.choreTitle || `${metric.choreType} Chores`}
                      </Text>
                      <View
                        style={[
                          styles.healthBadge,
                          { backgroundColor: `${getHealthColor(metric.healthScore)}20` },
                        ]}
                      >
                        <Ionicons
                          name={getHealthIcon(metric.healthScore) as any}
                          size={16}
                          color={getHealthColor(metric.healthScore)}
                        />
                        <Text
                          style={[
                            styles.healthBadgeText,
                            { color: getHealthColor(metric.healthScore) },
                          ]}
                        >
                          {metric.healthScore}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.metricDetails}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Takeover Rate</Text>
                      <Text style={styles.metricValue}>
                        {Math.round(metric.takeoverRate * 100)}%
                      </Text>
                    </View>
                    {renderMetricBar(
                      metric.takeoverRate,
                      0.5, // 50% max for visualization
                      metric.takeoverRate > 0.3 ? '#ef4444' : '#10b981'
                    )}

                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Avg Overdue</Text>
                      <Text style={styles.metricValue}>
                        {metric.averageOverdueHours.toFixed(1)} hours
                      </Text>
                    </View>
                    {renderMetricBar(
                      metric.averageOverdueHours,
                      72, // 3 days max for visualization
                      metric.averageOverdueHours > 48 ? '#ef4444' : '#10b981'
                    )}

                    {metric.mostFrequentHelper && (
                      <View style={styles.helperInfo}>
                        <Ionicons name="person" size={14} color="#9f1239" />
                        <Text style={styles.helperText}>
                          Most helped by {metric.mostFrequentHelperName}
                        </Text>
                      </View>
                    )}

                    {metric.originalAssigneePattern && (
                      <View style={styles.patternInfo}>
                        <Ionicons name="warning" size={14} color="#f59e0b" />
                        <Text style={styles.patternText}>
                          {metric.originalAssigneePattern.userName} misses{' '}
                          {Math.round(metric.originalAssigneePattern.missRate * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  overallHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overallHealthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    padding: 16,
    borderRadius: 16,
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
  metricsList: {
    maxHeight: 400,
  },
  metricCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    marginBottom: 12,
  },
  metricTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    flex: 1,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricDetails: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#9f1239',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  metricBar: {
    height: 6,
    backgroundColor: '#fbcfe8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  helperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  helperText: {
    fontSize: 12,
    color: '#9f1239',
  },
  patternInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  patternText: {
    fontSize: 12,
    color: '#f59e0b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9f1239',
    marginTop: 16,
  },
});