import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useFamily } from '../../hooks/useZustandHooks';
import { useAccessControl } from '../../hooks/useAccessControl';
import RotationStrategyConfig from './RotationStrategyConfig';
import FairnessEngineDashboard from './FairnessEngineDashboard';
import MemberPreferencesManager from './MemberPreferencesManager';
import ScheduleIntelligencePanel from './ScheduleIntelligencePanel';
import RotationAnalytics from './RotationAnalytics';
import RotationTestingTools from './RotationTestingTools';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RotationManagementProps {
  visible: boolean;
  onClose: () => void;
}

type RotationTab = 
  | 'overview' 
  | 'strategy' 
  | 'fairness' 
  | 'preferences' 
  | 'schedule' 
  | 'analytics' 
  | 'testing';

interface TabConfig {
  id: RotationTab;
  title: string;
  icon: string;
  description: string;
  color: string;
  adminOnly?: boolean;
}

export default function RotationManagement({ visible, onClose }: RotationManagementProps) {
  const { colors, theme } = useTheme();
  const { family, loading } = useFamily();
  const { canManageFamily } = useAccessControl();
  
  const [activeTab, setActiveTab] = useState<RotationTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [rotationEnabled, setRotationEnabled] = useState(true);

  // Tab configuration with admin-only restrictions
  const tabs: TabConfig[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: 'grid',
      description: 'Rotation system status and quick actions',
      color: '#be185d',
    },
    {
      id: 'strategy',
      title: 'Strategy',
      icon: 'settings',
      description: 'Configure rotation strategies',
      color: '#10b981',
      adminOnly: true,
    },
    {
      id: 'fairness',
      title: 'Fairness',
      icon: 'scales',
      description: 'Monitor workload distribution',
      color: '#f59e0b',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: 'heart',
      description: 'Member preferences and skills',
      color: '#8b5cf6',
      adminOnly: true,
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: 'calendar',
      description: 'Calendar integration settings',
      color: '#06b6d4',
      adminOnly: true,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'bar-chart',
      description: 'Performance metrics and insights',
      color: '#ef4444',
    },
    {
      id: 'testing',
      title: 'Testing',
      icon: 'flask',
      description: 'Test rotation scenarios',
      color: '#64748b',
      adminOnly: true,
    },
  ];

  // Filter tabs based on admin permissions
  const availableTabs = tabs.filter(tab => !tab.adminOnly || canManageFamily);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backText: {
      fontSize: 16,
      color: theme === 'dark' ? colors.accent : colors.primary,
      marginLeft: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      flex: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    enableToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: rotationEnabled ? '#10b98120' : '#ef444420',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginLeft: 12,
    },
    enableText: {
      fontSize: 12,
      fontWeight: '600',
      color: rotationEnabled ? '#10b981' : '#ef4444',
      marginLeft: 4,
    },
    tabContainer: {
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    tabScrollView: {
      paddingHorizontal: 12,
    },
    tabsRow: {
      flexDirection: 'row',
      paddingVertical: 12,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    tabActive: {
      backgroundColor: colors.accent,
    },
    tabIcon: {
      marginRight: 6,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    overviewContainer: {
      flex: 1,
      padding: 20,
    },
    statusCard: {
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
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: rotationEnabled ? '#10b98120' : '#ef444420',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    statusInfo: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    statusSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 16,
      gap: 12,
    },
    metricCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    quickActionsCard: {
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
    quickActionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionText: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    actionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real implementation, this would refresh rotation data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const toggleRotationSystem = () => {
    Alert.alert(
      rotationEnabled ? 'Disable Rotation System' : 'Enable Rotation System',
      rotationEnabled 
        ? 'This will temporarily disable automatic chore rotation. Existing assignments will remain.'
        : 'This will enable automatic chore rotation using your configured strategy.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: rotationEnabled ? 'Disable' : 'Enable',
          style: rotationEnabled ? 'destructive' : 'default',
          onPress: () => setRotationEnabled(!rotationEnabled),
        },
      ]
    );
  };

  const renderOverview = () => {
    // Mock data for demo - in real implementation, this would come from rotation service
    const mockMetrics = {
      fairnessScore: 87,
      activeStrategy: 'Calendar-Aware',
      lastRotation: '2 hours ago',
      nextRotation: 'Tomorrow 6:00 AM',
      memberCount: family?.members?.length || 0,
      activeChores: 12,
    };

    const quickActions = [
      {
        id: 'force-rebalance',
        title: 'Force Rebalance',
        description: 'Immediately rebalance chore distribution',
        icon: 'refresh',
        color: '#10b981',
        action: () => Alert.alert('Rebalance', 'Force rebalancing rotation assignments...'),
        adminOnly: true,
      },
      {
        id: 'preview-next',
        title: 'Preview Next Rotation',
        description: 'See upcoming chore assignments',
        icon: 'eye',
        color: '#06b6d4',
        action: () => setActiveTab('testing'),
        adminOnly: false,
      },
      {
        id: 'emergency-override',
        title: 'Emergency Override',
        description: 'Manually assign chores temporarily',
        icon: 'warning',
        color: '#f59e0b',
        action: () => Alert.alert('Emergency Override', 'Emergency assignment controls...'),
        adminOnly: true,
      },
      {
        id: 'export-report',
        title: 'Export Report',
        description: 'Generate rotation performance report',
        icon: 'download',
        color: '#8b5cf6',
        action: () => Alert.alert('Export', 'Generating rotation report...'),
        adminOnly: false,
      },
    ];

    return (
      <ScrollView 
        style={styles.overviewContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* System Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <WebIcon 
                name={rotationEnabled ? "sync" : "pause-circle"} 
                size={24} 
                color={rotationEnabled ? '#10b981' : '#ef4444'} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                Rotation System {rotationEnabled ? 'Active' : 'Disabled'}
              </Text>
              <Text style={styles.statusSubtitle}>
                Strategy: {mockMetrics.activeStrategy} • Last: {mockMetrics.lastRotation}
              </Text>
            </View>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{mockMetrics.fairnessScore}%</Text>
              <Text style={styles.metricLabel}>Fairness Score</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{mockMetrics.memberCount}</Text>
              <Text style={styles.metricLabel}>Active Members</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{mockMetrics.activeChores}</Text>
              <Text style={styles.metricLabel}>Active Chores</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>6h</Text>
              <Text style={styles.metricLabel}>Avg Response</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          {quickActions
            .filter(action => !action.adminOnly || canManageFamily)
            .map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              onPress={rotationEnabled ? action.action : undefined}
              disabled={!rotationEnabled}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <WebIcon name={action.icon} size={20} color={action.color} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <WebIcon name="chevron-forward" size={16} color={colors.textSecondary} />
              {!rotationEnabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>DISABLED</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingSpinner size="large" />
          <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
            Loading rotation system...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'strategy':
        return <RotationStrategyConfig enabled={rotationEnabled} />;
      case 'fairness':
        return <FairnessEngineDashboard enabled={rotationEnabled} />;
      case 'preferences':
        return <MemberPreferencesManager enabled={rotationEnabled} />;
      case 'schedule':
        return <ScheduleIntelligencePanel enabled={rotationEnabled} />;
      case 'analytics':
        return <RotationAnalytics enabled={rotationEnabled} />;
      case 'testing':
        return <RotationTestingTools enabled={rotationEnabled} />;
      default:
        return renderOverview();
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <WebIcon name="chevron-back" size={24} color={theme === 'dark' ? colors.accent : colors.primary} />
          <Text style={styles.backText}>Admin</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rotation Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleRotationSystem} style={styles.enableToggle}>
            <WebIcon 
              name={rotationEnabled ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={rotationEnabled ? '#10b981' : '#ef4444'} 
            />
            <Text style={styles.enableText}>
              {rotationEnabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabsRow}
        >
          {availableTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <WebIcon 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.id ? colors.primary : colors.textSecondary}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}