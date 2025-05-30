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
import * as Sentry from '@sentry/react-native';
import * as SentryReact from '@sentry/react';
import { captureExceptionWithContext } from '../../config/sentry';

interface ErrorStats {
  errorRate: number;
  last24HourCount: number;
  affectedUsers: number;
  topErrors: {
    message: string;
    count: number;
    lastSeen: string;
  }[];
  platformBreakdown: {
    web: number;
    ios: number;
    android: number;
  };
}

export function ErrorMonitoringPanel() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorReportingEnabled, setErrorReportingEnabled] = useState(true);
  const [userFeedbackEnabled, setUserFeedbackEnabled] = useState(true);

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
    // Simulate loading error stats
    // In production, this would fetch from Sentry API
    setTimeout(() => {
      setStats({
        errorRate: 0.8,
        last24HourCount: 12,
        affectedUsers: 5,
        topErrors: [
          {
            message: 'Network request failed',
            count: 8,
            lastSeen: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            message: 'Cannot read property of undefined',
            count: 3,
            lastSeen: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            message: 'Firebase auth timeout',
            count: 1,
            lastSeen: new Date(Date.now() - 14400000).toISOString(),
          },
        ],
        platformBreakdown: {
          web: 7,
          ios: 3,
          android: 2,
        },
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleTestError = () => {
    try {
      // Trigger a test error
      throw new Error('Test error from Error Monitoring Panel');
    } catch (error) {
      captureExceptionWithContext(error as Error, {
        errorMonitoring: {
          source: 'admin_panel',
          action: 'test_error',
        },
      }, {
        test: 'true',
        admin_panel: 'error_monitoring',
      });
      
      // Show error ID to user
      const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
      const errorId = SentryLib.lastEventId();
      alert(`Test error sent to Sentry!\nError ID: ${errorId}`);
    }
  };

  const handleViewInSentry = () => {
    const sentryUrl = 'https://sentry.io/organizations/family-compass/issues/';
    if (Platform.OS === 'web') {
      window.open(sentryUrl, '_blank');
    } else {
      Linking.openURL(sentryUrl);
    }
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Error Monitoring</Text>

      {/* Error Metrics */}
      <View style={[styles.metricsGrid, { backgroundColor: colors.cardBg }]}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.success }]}>
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
          <Text style={[styles.metricValue, { color: colors.error }]}>
            {stats?.affectedUsers}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>
            Affected Users
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
          Top Errors
        </Text>
        {stats?.topErrors.map((error, index) => (
          <View 
            key={index} 
            style={[
              styles.errorItem,
              { borderBottomColor: colors.border },
              index === stats.topErrors.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <View style={styles.errorInfo}>
              <Text style={[styles.errorMessage, { color: colors.text }]} numberOfLines={1}>
                {error.message}
              </Text>
              <Text style={[styles.errorMeta, { color: colors.secondaryText }]}>
                {error.count} occurrences • {formatTimeAgo(error.lastSeen)}
              </Text>
            </View>
            <Text style={[styles.errorCount, { color: colors.error }]}>
              {error.count}
            </Text>
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
    borderBottomWidth: 1,
  },
  errorInfo: {
    flex: 1,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  errorCount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
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