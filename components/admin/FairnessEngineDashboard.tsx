import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useFamily } from '../../hooks/useZustandHooks';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';

interface FairnessEngineDashboardProps {
  enabled: boolean;
}

interface FairnessMetrics {
  overallScore: number;
  workloadVariance: number;
  preferenceRespectRate: number;
  memberWorkloads: MemberWorkload[];
  recommendations: FairnessRecommendation[];
  trends: FairnessTrend[];
}

interface MemberWorkload {
  userId: string;
  userName: string;
  photoURL?: string;
  currentChores: number;
  weeklyPoints: number;
  capacityUtilization: number; // 0-100%
  fairnessScore: number; // 0-100%
  preferenceMatch: number; // 0-100%
  trendDirection: 'up' | 'down' | 'stable';
}

interface FairnessRecommendation {
  id: string;
  type: 'rebalance' | 'preference' | 'capacity' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionLabel: string;
  impact: string;
  affectedMembers: string[];
}

interface FairnessTrend {
  date: string;
  score: number;
  variance: number;
  memberCount: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function FairnessEngineDashboard({ enabled }: FairnessEngineDashboardProps) {
  const { colors, theme } = useTheme();
  const { family } = useFamily();
  
  const [fairnessData, setFairnessData] = useState<FairnessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    overviewCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      position: 'relative',
    },
    scoreText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
    },
    scoreLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    metricBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      marginHorizontal: 4,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    timeframeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    timeframeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    timeframeButtonActive: {
      backgroundColor: colors.primary,
    },
    timeframeText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    timeframeTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    memberCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    memberStatus: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    trendIcon: {
      marginLeft: 8,
    },
    memberMetrics: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    memberMetric: {
      flex: 1,
      alignItems: 'center',
    },
    memberMetricValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    memberMetricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.surface,
      borderRadius: 3,
      marginTop: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
    },
    recommendationCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderLeftWidth: 4,
    },
    recommendationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    recommendationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    recommendationContent: {
      flex: 1,
    },
    recommendationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    recommendationDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    recommendationImpact: {
      fontSize: 12,
      fontStyle: 'italic',
      color: colors.textMuted,
      marginBottom: 12,
    },
    recommendationActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginLeft: 8,
    },
    primaryAction: {
      backgroundColor: colors.primary,
    },
    secondaryAction: {
      backgroundColor: colors.surface,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#ffffff',
    },
    actionTextSecondary: {
      color: colors.text,
    },
    chartContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    trendChart: {
      height: 120,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    trendLine: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 80,
      marginBottom: 8,
    },
    trendPoint: {
      width: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
      marginHorizontal: 2,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  // Mock data for demonstration
  const mockFairnessData: FairnessMetrics = {
    overallScore: 87,
    workloadVariance: 18,
    preferenceRespectRate: 73,
    memberWorkloads: [
      {
        userId: '1',
        userName: 'Sarah',
        currentChores: 8,
        weeklyPoints: 240,
        capacityUtilization: 75,
        fairnessScore: 92,
        preferenceMatch: 85,
        trendDirection: 'up',
      },
      {
        userId: '2',
        userName: 'Mike',
        currentChores: 6,
        weeklyPoints: 180,
        capacityUtilization: 60,
        fairnessScore: 78,
        preferenceMatch: 65,
        trendDirection: 'down',
      },
      {
        userId: '3',
        userName: 'Emma',
        currentChores: 10,
        weeklyPoints: 300,
        capacityUtilization: 90,
        fairnessScore: 85,
        preferenceMatch: 70,
        trendDirection: 'stable',
      },
    ],
    recommendations: [
      {
        id: '1',
        type: 'rebalance',
        priority: 'medium',
        title: 'Workload Imbalance Detected',
        description: 'Emma is approaching capacity limit while Mike has availability for more chores.',
        actionLabel: 'Rebalance Now',
        impact: 'Would improve overall fairness by 12%',
        affectedMembers: ['Emma', 'Mike'],
      },
      {
        id: '2',
        type: 'preference',
        priority: 'low',
        title: 'Preference Optimization Available',
        description: 'Swapping kitchen and laundry chores between Sarah and Mike would improve satisfaction.',
        actionLabel: 'Apply Swap',
        impact: 'Would increase preference match by 8%',
        affectedMembers: ['Sarah', 'Mike'],
      },
    ],
    trends: [
      { date: '2024-01-01', score: 82, variance: 22, memberCount: 3 },
      { date: '2024-01-02', score: 85, variance: 20, memberCount: 3 },
      { date: '2024-01-03', score: 87, variance: 18, memberCount: 3 },
      { date: '2024-01-04', score: 89, variance: 16, memberCount: 3 },
      { date: '2024-01-05', score: 87, variance: 18, memberCount: 3 },
    ],
  };

  useEffect(() => {
    loadFairnessData();
  }, [selectedTimeframe]);

  const loadFairnessData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFairnessData(mockFairnessData);
    } catch (error) {
      Toast.show({
        type: 'error',
        message: 'Failed to load fairness data',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFairnessData();
    setRefreshing(false);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#06b6d4';
      default: return '#10b981';
    }
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (direction: string): string => {
    switch (direction) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  const handleRecommendationAction = (recommendationId: string) => {
    if (!enabled) return;
    
    Toast.show({
      type: 'success',
      message: 'Applying recommendation...',
      duration: 2000,
    });
  };

  if (loading && !fairnessData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner size="large" />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
          Loading fairness metrics...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {(['week', 'month', 'quarter'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.timeframeTextActive,
              ]}>
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overall Fairness Score */}
        <View style={styles.overviewCard}>
          <View style={styles.scoreContainer}>
            <View style={[
              styles.scoreCircle,
              {
                backgroundColor: `${getScoreColor(fairnessData?.overallScore || 0)}20`,
                borderWidth: 8,
                borderColor: getScoreColor(fairnessData?.overallScore || 0),
              }
            ]}>
              <Text style={styles.scoreText}>{fairnessData?.overallScore || 0}</Text>
            </View>
            <Text style={styles.scoreLabel}>Overall Fairness Score</Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{fairnessData?.workloadVariance || 0}%</Text>
              <Text style={styles.metricLabel}>Workload Variance</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{fairnessData?.preferenceRespectRate || 0}%</Text>
              <Text style={styles.metricLabel}>Preference Match</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{fairnessData?.memberWorkloads.length || 0}</Text>
              <Text style={styles.metricLabel}>Active Members</Text>
            </View>
          </View>
        </View>

        {/* Member Workloads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Workloads</Text>
          {fairnessData?.memberWorkloads.map((member) => (
            <View key={member.userId} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberAvatar}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>
                    {member.userName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.userName}</Text>
                  <Text style={styles.memberStatus}>
                    {member.currentChores} chores • {member.weeklyPoints} points
                  </Text>
                </View>
                <WebIcon 
                  name={getTrendIcon(member.trendDirection)}
                  size={20}
                  color={getTrendColor(member.trendDirection)}
                  style={styles.trendIcon}
                />
              </View>

              <View style={styles.memberMetrics}>
                <View style={styles.memberMetric}>
                  <Text style={styles.memberMetricValue}>{member.capacityUtilization}%</Text>
                  <Text style={styles.memberMetricLabel}>Capacity</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        {
                          width: `${member.capacityUtilization}%`,
                          backgroundColor: member.capacityUtilization > 85 ? '#ef4444' : colors.primary,
                        }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.memberMetric}>
                  <Text style={styles.memberMetricValue}>{member.fairnessScore}</Text>
                  <Text style={styles.memberMetricLabel}>Fairness</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        {
                          width: `${member.fairnessScore}%`,
                          backgroundColor: getScoreColor(member.fairnessScore),
                        }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.memberMetric}>
                  <Text style={styles.memberMetricValue}>{member.preferenceMatch}%</Text>
                  <Text style={styles.memberMetricLabel}>Preferences</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        {
                          width: `${member.preferenceMatch}%`,
                          backgroundColor: getScoreColor(member.preferenceMatch),
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
              
              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>Enable rotation to view live data</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Fairness Trends Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Fairness Trends</Text>
          <View style={styles.trendChart}>
            <View style={styles.trendLine}>
              {fairnessData?.trends.map((trend, index) => (
                <View
                  key={index}
                  style={[
                    styles.trendPoint,
                    { height: `${trend.score}%` }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.metricLabel}>Last 7 days</Text>
          </View>
          
          {!enabled && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>Enable rotation to view trends</Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {fairnessData?.recommendations.map((recommendation) => (
            <View 
              key={recommendation.id} 
              style={[
                styles.recommendationCard,
                { borderLeftColor: getPriorityColor(recommendation.priority) }
              ]}
            >
              <View style={styles.recommendationHeader}>
                <View style={[
                  styles.recommendationIcon,
                  { backgroundColor: `${getPriorityColor(recommendation.priority)}20` }
                ]}>
                  <WebIcon 
                    name={
                      recommendation.type === 'rebalance' ? 'scales' :
                      recommendation.type === 'preference' ? 'heart' :
                      recommendation.type === 'capacity' ? 'speedometer' : 'warning'
                    }
                    size={16} 
                    color={getPriorityColor(recommendation.priority)} 
                  />
                </View>
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                  <Text style={styles.recommendationDescription}>
                    {recommendation.description}
                  </Text>
                  <Text style={styles.recommendationImpact}>
                    Impact: {recommendation.impact}
                  </Text>
                </View>
              </View>
              
              <View style={styles.recommendationActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() => {/* Dismiss recommendation */}}
                >
                  <Text style={[styles.actionText, styles.actionTextSecondary]}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => handleRecommendationAction(recommendation.id)}
                  disabled={!enabled}
                >
                  <Text style={styles.actionText}>
                    {recommendation.actionLabel}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>Enable rotation to apply recommendations</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}