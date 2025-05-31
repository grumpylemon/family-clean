import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoreCompletionHistory, PerformanceMetrics } from '../../types';
import { choreCardService } from '../../services/choreCardService';

interface Props {
  choreId: string;
  userId: string;
  choreTitle: string;
  visible: boolean;
  onClose: () => void;
}

const PerformanceHistory: React.FC<Props> = ({
  choreId,
  userId,
  choreTitle,
  visible,
  onClose
}) => {
  const [completionHistory, setCompletionHistory] = useState<ChoreCompletionHistory[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPerformanceData();
    }
  }, [visible, choreId, userId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [history, metrics] = await Promise.all([
        choreCardService.getCompletionHistory(userId, choreId, 20),
        choreCardService.getPerformanceMetrics(userId, choreId)
      ]);
      
      setCompletionHistory(history);
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return '#be185d';
      case 'complete': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'incomplete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getQualityIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'star';
      case 'complete': return 'checkmark-circle';
      case 'partial': return 'remove-circle';
      case 'incomplete': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getSatisfactionEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😤';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😊';
      default: return '😐';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const renderCompletionItem = ({ item, index }: { item: ChoreCompletionHistory; index: number }) => {
    const qualityColor = getQualityColor(item.qualityRating);
    const qualityIcon = getQualityIcon(item.qualityRating);
    
    return (
      <View style={styles.completionItem}>
        <View style={styles.completionHeader}>
          <View style={styles.completionLeft}>
            <View style={[styles.qualityBadge, { backgroundColor: qualityColor }]}>
              <Ionicons name={qualityIcon as any} size={16} color="#ffffff" />
            </View>
            <View style={styles.completionInfo}>
              <Text style={styles.completionTitle}>
                {item.qualityRating.charAt(0).toUpperCase() + item.qualityRating.slice(1)}
              </Text>
              <Text style={styles.completionDate}>
                {new Date(item.completedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.completionRight}>
            <Text style={styles.satisfactionEmoji}>
              {getSatisfactionEmoji(item.satisfactionRating)}
            </Text>
            <Text style={styles.timeText}>
              {formatDuration(item.timeToComplete)}
            </Text>
          </View>
        </View>
        
        <View style={styles.completionDetails}>
          <View style={styles.pointsEarned}>
            <Text style={styles.pointsText}>{item.pointsEarned} pts</Text>
            <Text style={styles.xpText}>{item.xpEarned} XP</Text>
          </View>
          
          {item.comments && (
            <Text style={styles.commentText}>"{item.comments}"</Text>
          )}
        </View>
      </View>
    );
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, icon?: string, color = '#be185d') => (
    <View style={styles.metricCard}>
      {icon && (
        <Ionicons name={icon as any} size={24} color={color} style={styles.metricIcon} />
      )}
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Performance History</Text>
            <Text style={styles.subtitle}>{choreTitle}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Performance Metrics */}
          {performanceMetrics && (
            <View style={styles.metricsSection}>
              <Text style={styles.sectionTitle}>📊 Your Stats</Text>
              
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  'Completions',
                  performanceMetrics.totalCompletions,
                  'Total times',
                  'checkmark-done',
                  '#10b981'
                )}
                
                {renderMetricCard(
                  'Quality',
                  (performanceMetrics.averageQualityRating * 100).toFixed(0) + '%',
                  'Average rating',
                  'star',
                  '#be185d'
                )}
                
                {renderMetricCard(
                  'Satisfaction',
                  getSatisfactionEmoji(Math.round(performanceMetrics.averageSatisfactionRating)),
                  `${performanceMetrics.averageSatisfactionRating.toFixed(1)}/5`,
                  'heart',
                  '#f59e0b'
                )}
                
                {renderMetricCard(
                  'Avg Time',
                  formatDuration(Math.round(performanceMetrics.averageCompletionTime)),
                  'Per completion',
                  'time',
                  '#6b7280'
                )}
              </View>
              
              {performanceMetrics.excellentCount > 0 && (
                <View style={styles.achievementBadge}>
                  <Ionicons name="trophy" size={20} color="#be185d" />
                  <Text style={styles.achievementText}>
                    🌟 {performanceMetrics.excellentCount} Excellent completion{performanceMetrics.excellentCount !== 1 ? 's' : ''}!
                  </Text>
                </View>
              )}
              
              {performanceMetrics.qualityStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={20} color="#ef4444" />
                  <Text style={styles.streakText}>
                    🔥 {performanceMetrics.qualityStreak} excellent streak!
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Completion History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>📋 Recent Completions</Text>
            
            {completionHistory.length > 0 ? (
              <FlatList
                data={completionHistory}
                renderItem={renderCompletionItem}
                keyExtractor={(item, index) => `${item.id || index}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No completion history yet</Text>
                <Text style={styles.emptySubtitle}>
                  Complete this task to start tracking your performance!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    fontSize: 16,
    color: '#831843',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
  },
  subtitle: {
    fontSize: 14,
    color: '#9f1239',
    fontWeight: '500',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  metricsSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 2,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef7ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f9a8d4',
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
    marginLeft: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  historySection: {
    marginBottom: 24,
  },
  completionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  completionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qualityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completionInfo: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  completionDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  completionRight: {
    alignItems: 'center',
  },
  satisfactionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  completionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
    marginRight: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
  },
  commentText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PerformanceHistory;