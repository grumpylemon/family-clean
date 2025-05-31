import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { WebIcon } from './ui/WebIcon';
import { useAccessControl } from '../hooks/useAccessControl';
import { useFamily } from '../hooks/useZustandHooks';
import { useTheme } from '../contexts/ThemeContext';
import RoomManagement from './RoomManagement';
import ChoreManagement from './ChoreManagement';
import ManageMembers from './ManageMembers';
import RewardManagement from './RewardManagement';
import FamilySettings from './FamilySettings';
import { ZustandAdminPanel } from './ZustandAdminPanel';
import { ErrorMonitoringPanel } from './admin/ErrorMonitoringPanel';
import { ValidationControlsPanel } from './admin/ValidationControlsPanel';
import { TemplateLibrary } from './TemplateLibrary';
import { AIIntegrationPanel } from './admin/AIIntegrationPanel';
import RotationManagement from './admin/RotationManagement';

interface AdminSettingsProps {
  visible: boolean;
  onClose: () => void;
}

interface AdminMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  enabled: boolean;
  hasChevron?: boolean;
}

export function AdminSettings({ visible, onClose }: AdminSettingsProps) {
  const { canManageFamily, canManageChores, canManageRewards } = useAccessControl();
  const { family } = useFamily();
  const { colors, theme } = useTheme();
  
  // Create dynamic styles based on theme
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
      flex: 1,
    },
    headerSpacer: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
    },
    adminCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    adminIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme === 'dark' ? colors.surface : colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    adminInfo: {
      flex: 1,
    },
    adminTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    adminSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingsGroup: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingValue: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
    },
    accessItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    accessText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme === 'dark' ? colors.background : colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
      backgroundColor: theme === 'dark' ? colors.background : colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? colors.border : colors.accent,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? colors.text : colors.primaryDark,
    },
    modalContent: {
      flex: 1,
    },
    modalCloseButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme === 'dark' ? colors.surface : colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    backButtonText: {
      fontSize: 16,
      color: theme === 'dark' ? colors.text : colors.primaryDark,
      marginLeft: 8,
    },
    quickAccessGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    quickAccessButton: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    quickAccessIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    quickAccessText: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingItemDisabled: {
      opacity: 0.5,
    },
    settingTitleDisabled: {
      color: '#9ca3af',
    },
    settingDescriptionDisabled: {
      color: '#9ca3af',
    },
  });
  
  // Modal states for each admin function
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showRewardManagement, setShowRewardManagement] = useState(false);
  const [showFamilySettings, setShowFamilySettings] = useState(false);
  const [showZustandAdmin, setShowZustandAdmin] = useState(false);
  const [showErrorMonitoring, setShowErrorMonitoring] = useState(false);
  const [showValidationControls, setShowValidationControls] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showAIIntegration, setShowAIIntegration] = useState(false);
  const [showRotationManagement, setShowRotationManagement] = useState(false);

  // Organized admin menu items with better grouping and categorization
  const coreManagementItems: AdminMenuItem[] = [
    {
      id: 'member-management',
      title: 'Member Management',
      description: 'Add, remove, and manage family members',
      icon: 'people',
      color: '#be185d',
      onPress: () => setShowMemberManagement(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
    {
      id: 'chore-management',
      title: 'Chore Management',
      description: 'Create, edit, and organize family chores',
      icon: 'checkmark-circle',
      color: '#10b981',
      onPress: () => setShowChoreManagement(true),
      enabled: canManageChores,
      hasChevron: true,
    },
    {
      id: 'reward-management',
      title: 'Reward Management',
      description: 'Create and manage family rewards',
      icon: 'gift',
      color: '#f59e0b',
      onPress: () => setShowRewardManagement(true),
      enabled: canManageRewards,
      hasChevron: true,
    },
    {
      id: 'family-settings',
      title: 'Family Settings',
      description: 'Configure family preferences and settings',
      icon: 'settings',
      color: '#64748b',
      onPress: () => setShowFamilySettings(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
  ];

  const advancedFeaturesItems: AdminMenuItem[] = [
    {
      id: 'rotation-management',
      title: 'Rotation Management',
      description: 'Configure intelligent chore rotation system',
      icon: 'sync',
      color: '#be185d',
      onPress: () => setShowRotationManagement(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
    {
      id: 'room-management',
      title: 'Room & Space Management',
      description: 'Manage family rooms and assign responsibilities',
      icon: 'home',
      color: '#8b5cf6',
      onPress: () => setShowRoomManagement(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
    {
      id: 'template-library',
      title: 'Template Library',
      description: 'Browse and apply household routine templates',
      icon: 'library',
      color: '#7c2d12',
      onPress: () => setShowTemplateLibrary(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
    {
      id: 'ai-integration',
      title: 'AI Integration',
      description: 'Configure Google Gemini API and AI features',
      icon: 'sparkles',
      color: '#8b5cf6',
      onPress: () => setShowAIIntegration(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
  ];

  const systemToolsItems: AdminMenuItem[] = [
    {
      id: 'validation-controls',
      title: 'Validation Controls',
      description: 'Customize form validation rules and behavior',
      icon: 'checkmark-done',
      color: '#059669',
      onPress: () => setShowValidationControls(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
    {
      id: 'error-monitoring',
      title: 'Error Monitoring',
      description: 'Track app errors and stability metrics',
      icon: 'bug',
      color: '#ef4444',
      onPress: () => setShowErrorMonitoring(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
    {
      id: 'zustand-admin',
      title: 'Store Management',
      description: 'Advanced store management and offline controls',
      icon: 'server',
      color: '#7c3aed',
      onPress: () => setShowZustandAdmin(true),
      enabled: canManageFamily,
      hasChevron: true,
    },
  ];

  // Quick access buttons for most-used functions
  const quickAccessItems = [
    {
      id: 'quick-chore',
      title: 'Add Chore',
      icon: 'add-circle',
      color: '#10b981',
      onPress: () => setShowChoreManagement(true),
      enabled: canManageChores,
    },
    {
      id: 'quick-member',
      title: 'Add Member',
      icon: 'person-add',
      color: '#be185d',
      onPress: () => setShowMemberManagement(true),
      enabled: canManageFamily,
    },
    {
      id: 'quick-template',
      title: 'Templates',
      icon: 'copy',
      color: '#7c2d12',
      onPress: () => setShowTemplateLibrary(true),
      enabled: canManageFamily,
    },
    {
      id: 'quick-ai',
      title: 'AI Assistant',
      icon: 'sparkles',
      color: '#8b5cf6',
      onPress: () => setShowAIIntegration(true),
      enabled: canManageFamily,
    },
  ];

  // Family information items
  const familyInfoItems = [
    {
      id: 'family-code',
      title: 'Family Join Code',
      value: family?.joinCode || 'Loading...',
      icon: 'key',
      color: '#ec4899',
    },
    {
      id: 'family-name',
      title: 'Family Name',
      value: family?.name || 'Loading...',
      icon: 'home',
      color: '#be185d',
    },
    {
      id: 'member-count',
      title: 'Total Members',
      value: family?.members?.length?.toString() || '0',
      icon: 'people',
      color: '#10b981',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.background} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <WebIcon name="chevron-back" size={24} color={theme === 'dark' ? colors.accent : colors.primary} />
            <Text style={styles.backText}>Settings</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Admin</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Admin Access Section */}
          <View style={styles.section}>
            <View style={styles.adminCard}>
              <View style={styles.adminIcon}>
                <WebIcon name="shield-checkmark" size={32} color={theme === 'dark' ? colors.accent : colors.primary} />
              </View>
              <View style={styles.adminInfo}>
                <Text style={styles.adminTitle}>Administrator</Text>
                <Text style={styles.adminSubtitle}>Full access to family management</Text>
              </View>
            </View>
          </View>

          {/* Family Information */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Family Information</Text>
            <View style={styles.settingsGroup}>
              {familyInfoItems.map((item, index) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.settingItem, 
                    index === familyInfoItems.length - 1 && styles.settingItemLast
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: `${item.color}20` }]}>
                      <WebIcon name={item.icon} size={18} color={item.color} />
                    </View>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.settingValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Access Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.quickAccessGrid}>
              {quickAccessItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.quickAccessButton,
                    { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.divider,
                      opacity: item.enabled ? 1 : 0.5
                    }
                  ]}
                  onPress={item.enabled ? item.onPress : undefined}
                  disabled={!item.enabled}
                >
                  <View style={[styles.quickAccessIcon, { backgroundColor: `${item.color}20` }]}>
                    <WebIcon 
                      name={item.icon} 
                      size={20} 
                      color={item.enabled ? item.color : '#9ca3af'} 
                    />
                  </View>
                  <Text style={[
                    styles.quickAccessText, 
                    { color: item.enabled ? colors.text : colors.textMuted }
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Core Management */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Core Management</Text>
            <View style={styles.settingsGroup}>
              {coreManagementItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index === coreManagementItems.length - 1 && styles.settingItemLast,
                    !item.enabled && styles.settingItemDisabled
                  ]}
                  onPress={item.enabled ? item.onPress : undefined}
                  disabled={!item.enabled}
                >
                  <View style={styles.settingItemContent}>
                    <View style={[styles.settingIcon, { backgroundColor: `${item.color}20` }]}>
                      <WebIcon 
                        name={item.icon} 
                        size={18} 
                        color={item.enabled ? item.color : '#9ca3af'} 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={[
                        styles.settingTitle, 
                        !item.enabled && { color: colors.textMuted }
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.settingDescription,
                        !item.enabled && { color: colors.textMuted }
                      ]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {item.hasChevron && (
                    <WebIcon 
                      name="chevron-forward" 
                      size={18} 
                      color={item.enabled ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Advanced Features */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Advanced Features</Text>
            <View style={styles.settingsGroup}>
              {advancedFeaturesItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index === advancedFeaturesItems.length - 1 && styles.settingItemLast,
                    !item.enabled && styles.settingItemDisabled
                  ]}
                  onPress={item.enabled ? item.onPress : undefined}
                  disabled={!item.enabled}
                >
                  <View style={styles.settingItemContent}>
                    <View style={[styles.settingIcon, { backgroundColor: `${item.color}20` }]}>
                      <WebIcon 
                        name={item.icon} 
                        size={18} 
                        color={item.enabled ? item.color : '#9ca3af'} 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={[
                        styles.settingTitle, 
                        !item.enabled && { color: colors.textMuted }
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.settingDescription,
                        !item.enabled && { color: colors.textMuted }
                      ]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {item.hasChevron && (
                    <WebIcon 
                      name="chevron-forward" 
                      size={18} 
                      color={item.enabled ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* System Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>System Tools</Text>
            <View style={styles.settingsGroup}>
              {systemToolsItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index === systemToolsItems.length - 1 && styles.settingItemLast,
                    !item.enabled && styles.settingItemDisabled
                  ]}
                  onPress={item.enabled ? item.onPress : undefined}
                  disabled={!item.enabled}
                >
                  <View style={styles.settingItemContent}>
                    <View style={[styles.settingIcon, { backgroundColor: `${item.color}20` }]}>
                      <WebIcon 
                        name={item.icon} 
                        size={18} 
                        color={item.enabled ? item.color : '#9ca3af'} 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={[
                        styles.settingTitle, 
                        !item.enabled && { color: colors.textMuted }
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.settingDescription,
                        !item.enabled && { color: colors.textMuted }
                      ]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {item.hasChevron && (
                    <WebIcon 
                      name="chevron-forward" 
                      size={18} 
                      color={item.enabled ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Access Level Information */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Access Levels</Text>
            <View style={styles.settingsGroup}>
              <View style={styles.accessItem}>
                <WebIcon 
                  name={canManageFamily ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={canManageFamily ? "#10b981" : "#ef4444"} 
                />
                <Text style={styles.accessText}>Family Management</Text>
              </View>
              <View style={styles.accessItem}>
                <WebIcon 
                  name={canManageChores ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={canManageChores ? "#10b981" : "#ef4444"} 
                />
                <Text style={styles.accessText}>Chore Management</Text>
              </View>
              <View style={styles.accessItem}>
                <WebIcon 
                  name={canManageRewards ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={canManageRewards ? "#10b981" : "#ef4444"} 
                />
                <Text style={styles.accessText}>Reward Management</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Admin Modals */}
        <Modal
          visible={showRoomManagement}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowRoomManagement(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room & Space Management</Text>
              <TouchableOpacity 
                onPress={() => setShowRoomManagement(false)}
                style={styles.modalCloseButton}
              >
                <WebIcon name="close" size={24} color={theme === 'dark' ? colors.text : colors.primaryDark} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <RoomManagement />
            </View>
          </View>
        </Modal>

        <ChoreManagement 
          visible={showChoreManagement}
          onClose={() => setShowChoreManagement(false)}
        />
        
        <ManageMembers 
          visible={showMemberManagement}
          onClose={() => setShowMemberManagement(false)}
        />
        
        <RewardManagement 
          visible={showRewardManagement}
          onClose={() => setShowRewardManagement(false)}
        />
        
        <FamilySettings 
          visible={showFamilySettings}
          onClose={() => setShowFamilySettings(false)}
        />
        
        {/* Zustand Admin Panel */}
        <ZustandAdminPanel 
          visible={showZustandAdmin}
          onClose={() => setShowZustandAdmin(false)}
        />
        
        {/* Error Monitoring Panel */}
        <Modal
          visible={showErrorMonitoring}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowErrorMonitoring(false)}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => setShowErrorMonitoring(false)}
                style={styles.backButton}
              >
                <WebIcon name="arrow-back" size={24} color={theme === 'dark' ? colors.text : colors.primaryDark} />
                <Text style={styles.backButtonText}>Admin Panel</Text>
              </TouchableOpacity>
            </View>
            <ErrorMonitoringPanel />
          </SafeAreaView>
        </Modal>
        
        {/* Validation Controls Panel */}
        <Modal
          visible={showValidationControls}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowValidationControls(false)}
        >
          <SafeAreaView style={styles.container}>
            <ValidationControlsPanel onClose={() => setShowValidationControls(false)} />
          </SafeAreaView>
        </Modal>
        
        {/* Template Library */}
        <TemplateLibrary
          visible={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onTemplateApplied={(templateId, choreCount) => {
            // Could add additional handling here
            console.log(`Applied template ${templateId}, created ${choreCount} chores`);
          }}
        />
        
        {/* AI Integration Panel */}
        <AIIntegrationPanel
          visible={showAIIntegration}
          onClose={() => setShowAIIntegration(false)}
        />
        
        {/* Rotation Management */}
        <RotationManagement
          visible={showRotationManagement}
          onClose={() => setShowRotationManagement(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}


export default AdminSettings;