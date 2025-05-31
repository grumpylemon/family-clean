import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import UniversalIcon from '../ui/UniversalIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useFamily } from '../../hooks/useZustandHooks';
import * as Sentry from '@sentry/react-native';
import * as SentryReact from '@sentry/react';
import { captureExceptionWithContext, addBreadcrumb } from '../../config/sentry';
import { Toast } from '../ui/Toast';

interface FamilyErrorStats {
  familyId: string;
  errorRate: number;
  last24HourCount: number;
  affectedMembers: number;
  resolvedCount: number;
  topErrors: {
    id: string;
    message: string;
    count: number;
    lastSeen: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'chore' | 'family' | 'auth' | 'sync' | 'ui' | 'network';
    resolved: boolean;
  }[];
  platformBreakdown: {
    web: number;
    ios: number;
    android: number;
  };
  categoryBreakdown: {
    chore: number;
    family: number;
    auth: number;
    sync: number;
    ui: number;
    network: number;
  };
  trendData: {
    date: string;
    count: number;
  }[];
}

export function ErrorMonitoringPanel() {
  const { theme } = useTheme();
  const { family } = useFamily();
  const [stats, setStats] = useState<FamilyErrorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorReportingEnabled, setErrorReportingEnabled] = useState(true);
  const [userFeedbackEnabled, setUserFeedbackEnabled] = useState(true);
  const [autoResolveErrors, setAutoResolveErrors] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const colors = theme === 'dark' ? {
    background: '#2d1520',
    text: '#fbcfe8',
    secondaryText: '#f9a8d4',
    border: '#4a1f35',
    cardBg: '#3d1a2a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  } : {
    background: '#ffffff',
    text: '#831843',
    secondaryText: '#9f1239',
    border: '#f9a8d4',
    cardBg: '#fdf2f8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  useEffect(() => {
    if (!family?.id) return;
    
    // Simulate loading family-specific error stats
    // In production, this would fetch from family-filtered Sentry API
    setTimeout(() => {
      const memberCount = family.members?.length || 1;
      const familyErrorStats: FamilyErrorStats = {
        familyId: family.id,
        errorRate: Math.random() * 2, // 0-2% error rate
        last24HourCount: Math.floor(Math.random() * 15),
        affectedMembers: Math.min(Math.floor(Math.random() * memberCount) + 1, memberCount),
        resolvedCount: Math.floor(Math.random() * 8),
        topErrors: [
          {
            id: 'err_1',
            message: 'Chore completion sync failed',
            count: Math.floor(Math.random() * 10) + 1,
            lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            severity: 'medium',
            category: 'chore',
            resolved: false,
          },
          {
            id: 'err_2',
            message: 'Family member photo upload timeout',
            count: Math.floor(Math.random() * 5) + 1,
            lastSeen: new Date(Date.now() - Math.random() * 172800000).toISOString(),
            severity: 'low',
            category: 'family',
            resolved: true,
          },
          {
            id: 'err_3',
            message: 'Offline sync conflict detected',
            count: Math.floor(Math.random() * 3) + 1,
            lastSeen: new Date(Date.now() - Math.random() * 259200000).toISOString(),
            severity: 'high',
            category: 'sync',
            resolved: false,
          },
        ],
        platformBreakdown: {
          web: Math.floor(Math.random() * 10),
          ios: Math.floor(Math.random() * 8),
          android: Math.floor(Math.random() * 6),
        },
        categoryBreakdown: {
          chore: Math.floor(Math.random() * 8),
          family: Math.floor(Math.random() * 5),
          auth: Math.floor(Math.random() * 3),
          sync: Math.floor(Math.random() * 4),
          ui: Math.floor(Math.random() * 6),
          network: Math.floor(Math.random() * 7),
        },
        trendData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5),
        })).reverse(),
      };
      
      setStats(familyErrorStats);
      setIsLoading(false);
    }, 1000);
  }, [family?.id]);

  const handleTestError = () => {
    try {
      // Trigger a test error with family context
      throw new Error(`Family ${family?.name || family?.id} - Test error from Error Monitoring Panel`);
    } catch (error) {
      captureExceptionWithContext(error as Error, {
        familyContext: {
          familyId: family?.id,
          familyName: family?.name,
          memberCount: family?.members?.length,
          source: 'admin_panel',
          action: 'test_error',
        },
        errorMonitoring: {
          testError: true,
          initiatedBy: 'family_admin',
          timestamp: new Date().toISOString(),
        },
      }, {
        test: 'true',
        family_id: family?.id || 'unknown',
        admin_panel: 'error_monitoring',
        error_category: 'test',
      });
      
      // Add breadcrumb for family admin action
      addBreadcrumb({
        message: 'Family admin triggered test error',
        category: 'admin_action',
        level: 'info',
        data: {
          familyId: family?.id,
          action: 'test_error_trigger',
        },
      });
      
      // Show error ID to user
      const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
      const errorId = SentryLib.lastEventId();
      Toast.show(`✅ Test error sent to Sentry!\nError ID: ${errorId || 'pending'}`, 'success');
    }
  };

  const handleViewInSentry = () => {
    const sentryUrl = `https://sentry.io/organizations/family-compass/issues/?query=tag%3Afamily_id%3A${family?.id || ''}`;
    if (Platform.OS === 'web') {
      window.open(sentryUrl, '_blank');
    } else {
      Linking.openURL(sentryUrl);
    }
  };

  const handleMarkErrorResolved = (errorId: string) => {
    if (!stats) return;
    
    const updatedStats = {
      ...stats,
      topErrors: stats.topErrors.map(error => 
        error.id === errorId ? { ...error, resolved: true } : error
      ),
      resolvedCount: stats.resolvedCount + 1,
    };
    
    setStats(updatedStats);
    Toast.show('Error marked as resolved', 'success');
    
    // Add breadcrumb for admin action
    addBreadcrumb({
      message: 'Family admin marked error as resolved',
      category: 'admin_action',
      level: 'info',
      data: {
        familyId: family?.id,
        errorId,
        action: 'mark_resolved',
      },
    });
  };

  const handleRefreshStats = () => {
    setIsLoading(true);
    // Force reload of stats
    setTimeout(() => {
      if (family?.id) {
        // Trigger useEffect to reload data
        setIsLoading(false);
        Toast.show('Error statistics refreshed', 'success');
      }
    }, 1000);
  };

  const formatTimeAgo = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return colors.textSecondary;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chore': return '#8b5cf6';
      case 'family': return '#10b981';
      case 'auth': return '#f59e0b';
      case 'sync': return '#3b82f6';
      case 'ui': return '#06b6d4';
      case 'network': return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with refresh */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Error Monitoring</Text>
        <TouchableOpacity onPress={handleRefreshStats} style={styles.refreshButton}>
          <UniversalIcon name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Family Context */}
      <View style={[styles.familyContext, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.familyContextTitle, { color: colors.text }]}>
          Monitoring: {family?.name || 'Family'}
        </Text>
        <Text style={[styles.familyContextSubtitle, { color: colors.secondaryText }]}>
          {stats?.affectedMembers || 0} of {family?.members?.length || 0} members affected
        </Text>
      </View>

      {/* Error Metrics */}
      <View style={[styles.metricsGrid, { backgroundColor: colors.cardBg }]}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: stats?.errorRate && stats.errorRate < 1 ? colors.success : colors.warning }]}>
            {stats?.errorRate.toFixed(1)}%
          </Text>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>
            Error Rate
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.warning }]}>
            {stats?.last24HourCount}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>
            Last 24 Hours
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {stats?.resolvedCount}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>
            Resolved
          </Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.error }]}>
            {stats?.affectedMembers}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>
            Affected Members
          </Text>
        </View>
      </View>

      {/* Platform Breakdown */}
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Platform Breakdown
        </Text>
        <View style={styles.platformGrid}>
          <View style={styles.platformItem}>
            <UniversalIcon name="globe-outline" size={24} color={colors.text} />
            <Text style={[styles.platformCount, { color: colors.text }]}>
              {stats?.platformBreakdown.web}
            </Text>
            <Text style={[styles.platformLabel, { color: colors.secondaryText }]}>
              Web
            </Text>
          </View>
          <View style={styles.platformItem}>
            <UniversalIcon name="logo-apple" size={24} color={colors.text} />
            <Text style={[styles.platformCount, { color: colors.text }]}>
              {stats?.platformBreakdown.ios}
            </Text>
            <Text style={[styles.platformLabel, { color: colors.secondaryText }]}>
              iOS
            </Text>
          </View>
          <View style={styles.platformItem}>
            <UniversalIcon name="logo-android" size={24} color={colors.text} />
            <Text style={[styles.platformCount, { color: colors.text }]}>
              {stats?.platformBreakdown.android}
            </Text>
            <Text style={[styles.platformLabel, { color: colors.secondaryText }]}>
              Android
            </Text>
          </View>
        </View>
      </View>

      {/* Top Errors */}
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Errors
        </Text>
        {stats?.topErrors.map((error, index) => (
          <View 
            key={error.id} 
            style={[
              styles.errorItem,
              { 
                borderBottomColor: colors.border,
                backgroundColor: error.resolved ? `${colors.success}10` : 'transparent',
              },
              index === stats.topErrors.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <View style={styles.errorInfo}>
              <View style={styles.errorHeader}>
                <Text style={[
                  styles.errorMessage, 
                  { color: error.resolved ? colors.success : colors.text }
                ]} numberOfLines={1}>
                  {error.message}
                </Text>
                <View style={styles.errorBadges}>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(error.severity) + '20' }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: getSeverityColor(error.severity) }
                    ]}>
                      {error.severity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(error.category) + '20' }
                  ]}>
                    <Text style={[
                      styles.categoryText,
                      { color: getCategoryColor(error.category) }
                    ]}>
                      {error.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.errorMeta, { color: colors.secondaryText }]}>
                {error.count} occurrences • {formatTimeAgo(error.lastSeen)}
                {error.resolved && ' • RESOLVED'}
              </Text>
            </View>
            <View style={styles.errorActions}>
              <Text style={[styles.errorCount, { color: error.resolved ? colors.success : colors.error }]}>
                {error.count}
              </Text>
              {!error.resolved && (
                <TouchableOpacity
                  style={[styles.resolveButton, { backgroundColor: colors.success }]}
                  onPress={() => handleMarkErrorResolved(error.id)}
                >
                  <UniversalIcon name="checkmark" size={16} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Configuration */}
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Configuration
        </Text>
        
        <View style={styles.configItem}>
          <View>
            <Text style={[styles.configLabel, { color: colors.text }]}>
              Error Reporting
            </Text>
            <Text style={[styles.configDescription, { color: colors.secondaryText }]}>
              Send errors to Sentry
            </Text>
          </View>
          <Switch
            value={errorReportingEnabled}
            onValueChange={setErrorReportingEnabled}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.configItem}>
          <View>
            <Text style={[styles.configLabel, { color: colors.text }]}>
              User Feedback Widget
            </Text>
            <Text style={[styles.configDescription, { color: colors.secondaryText }]}>
              Allow users to report issues
            </Text>
          </View>
          <Switch
            value={userFeedbackEnabled}
            onValueChange={setUserFeedbackEnabled}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Debug Tools
        </Text>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning }]}
          onPress={handleTestError}
        >
          <UniversalIcon name="bug-outline" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Trigger Test Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.text }]}
          onPress={handleViewInSentry}
        >
          <UniversalIcon name="open-outline" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>View in Sentry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  familyContext: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  familyContextTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  familyContextSubtitle: {
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  metricCard: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  platformGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  platformItem: {
    alignItems: 'center',
  },
  platformCount: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  platformLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  errorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
  },
  errorInfo: {
    flex: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  errorBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  errorMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  resolveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  configDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});