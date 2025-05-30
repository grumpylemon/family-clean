import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useFamily } from '../../hooks/useZustandHooks';
import RoomManagement from '../../components/RoomManagement';
import ChoreManagement from '../../components/ChoreManagement';
import ManageMembers from '../../components/ManageMembers';
import RewardManagement from '../../components/RewardManagement';
import FamilySettings from '../../components/FamilySettings';
import { ZustandAdminPanel } from '../../components/ZustandAdminPanel';
import TakeoverAnalyticsDashboard from '../../components/TakeoverAnalyticsDashboard';
import TakeoverApprovalQueue from '../../components/admin/TakeoverApprovalQueue';
import CustomRulesManager from '../../components/admin/CustomRulesManager';
import PerformanceExportPanel from '../../components/admin/PerformanceExportPanel';

export default function AdminScreen() {
  const { canManageFamily, canManageChores, canManageRewards } = useAccessControl();
  const { family } = useFamily();
  
  // Modal states
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showRewardManagement, setShowRewardManagement] = useState(false);
  const [showFamilySettings, setShowFamilySettings] = useState(false);
  const [showZustandAdmin, setShowZustandAdmin] = useState(false);
  const [showTakeoverAnalytics, setShowTakeoverAnalytics] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  if (!canManageFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
        <View style={styles.noAccessContainer}>
          <Text style={styles.noAccessTitle}>Access Restricted</Text>
          <Text style={styles.noAccessMessage}>
            You don&apos;t have admin privileges to access this section.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const adminTools = [
    {
      id: 'rooms',
      title: 'Room & Space Management',
      description: 'Manage family rooms and assign responsibilities',
      icon: 'home' as const,
      color: '#8b5cf6',
      onPress: () => setShowRoomManagement(true),
      enabled: canManageFamily,
    },
    {
      id: 'members',
      title: 'Member Management',
      description: 'Add, remove, and manage family members',
      icon: 'people' as const,
      color: '#be185d',
      onPress: () => setShowMemberManagement(true),
      enabled: canManageFamily,
    },
    {
      id: 'chores',
      title: 'Chore Management',
      description: 'Create, edit, and organize family chores',
      icon: 'checkmark-circle' as const,
      color: '#10b981',
      onPress: () => setShowChoreManagement(true),
      enabled: canManageChores,
    },
    {
      id: 'rewards',
      title: 'Reward Management',
      description: 'Create and manage family rewards',
      icon: 'gift' as const,
      color: '#f59e0b',
      onPress: () => setShowRewardManagement(true),
      enabled: canManageRewards,
    },
    {
      id: 'family-settings',
      title: 'Family Settings',
      description: 'Configure family preferences and settings',
      icon: 'settings' as const,
      color: '#64748b',
      onPress: () => setShowFamilySettings(true),
      enabled: canManageFamily,
    },
    {
      id: 'zustand-admin',
      title: 'Zustand Remote Admin',
      description: 'Advanced store management and offline controls',
      icon: 'server' as const,
      color: '#7c3aed',
      onPress: () => setShowZustandAdmin(true),
      enabled: canManageFamily,
    },
    {
      id: 'takeover-analytics',
      title: 'Takeover Analytics',
      description: 'View chore takeover insights and collaboration metrics',
      icon: 'analytics' as const,
      color: '#ec4899',
      onPress: () => setShowTakeoverAnalytics(true),
      enabled: canManageFamily,
    },
    {
      id: 'approval-queue',
      title: 'Takeover Approvals',
      description: 'Manage pending takeover requests and bulk operations',
      icon: 'list-circle' as const,
      color: '#f97316',
      onPress: () => setShowApprovalQueue(true),
      enabled: canManageFamily,
    },
    {
      id: 'custom-rules',
      title: 'Custom Rules',
      description: 'Configure takeover rules and family-specific settings',
      icon: 'cog' as const,
      color: '#8b5cf6',
      onPress: () => setShowCustomRules(true),
      enabled: canManageFamily,
    },
    {
      id: 'export-panel',
      title: 'Performance Export',
      description: 'Generate and download family performance reports',
      icon: 'document-text' as const,
      color: '#059669',
      onPress: () => setShowExportPanel(true),
      enabled: canManageFamily,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Family management and administration tools</Text>
        </View>

        <View style={styles.toolsGrid}>
          {adminTools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolCard,
                !tool.enabled && styles.toolCardDisabled
              ]}
              onPress={tool.enabled ? tool.onPress : undefined}
              disabled={!tool.enabled}
            >
              <View style={[styles.toolIcon, { backgroundColor: `${tool.color}20` }]}>
                <Ionicons 
                  name={tool.icon} 
                  size={32} 
                  color={tool.enabled ? tool.color : '#9ca3af'} 
                />
              </View>
              <View style={styles.toolContent}>
                <Text style={[
                  styles.toolTitle,
                  !tool.enabled && styles.toolTitleDisabled
                ]}>
                  {tool.title}
                </Text>
                <Text style={[
                  styles.toolDescription,
                  !tool.enabled && styles.toolDescriptionDisabled
                ]}>
                  {tool.description}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={tool.enabled ? "#be185d" : "#9ca3af"} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Family Code Section */}
        <View style={styles.familyCodeSection}>
          <Text style={styles.familyCodeTitle}>Family Join Code</Text>
          <View style={styles.familyCodeCard}>
            <Text style={styles.familyCodeLabel}>Share this code with family members:</Text>
            <Text style={styles.familyCode}>{family?.joinCode || 'Loading...'}</Text>
            <Text style={styles.familyCodeHint}>New members can use this code to join your family</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Access Levels</Text>
          <View style={styles.accessInfo}>
            <View style={styles.accessItem}>
              <Ionicons 
                name={canManageFamily ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={canManageFamily ? "#10b981" : "#ef4444"} 
              />
              <Text style={styles.accessText}>Family Management</Text>
            </View>
            <View style={styles.accessItem}>
              <Ionicons 
                name={canManageChores ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={canManageChores ? "#10b981" : "#ef4444"} 
              />
              <Text style={styles.accessText}>Chore Management</Text>
            </View>
            <View style={styles.accessItem}>
              <Ionicons 
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
        <View style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf2f8' }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRoomManagement(false)}
              >
                <Ionicons name="close" size={24} color="#831843" />
              </TouchableOpacity>
            </View>
            <RoomManagement />
          </SafeAreaView>
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
      
      <ZustandAdminPanel 
        visible={showZustandAdmin}
        onClose={() => setShowZustandAdmin(false)}
      />

      {/* Takeover Analytics Modal */}
      <Modal
        visible={showTakeoverAnalytics}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTakeoverAnalytics(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf2f8' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTakeoverAnalytics(false)}
            >
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          <TakeoverAnalyticsDashboard />
        </SafeAreaView>
      </Modal>

      {/* Takeover Approval Queue Modal */}
      <Modal
        visible={showApprovalQueue}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApprovalQueue(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf2f8' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowApprovalQueue(false)}
            >
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          <TakeoverApprovalQueue />
        </SafeAreaView>
      </Modal>

      {/* Custom Rules Manager Modal */}
      <Modal
        visible={showCustomRules}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomRules(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf2f8' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCustomRules(false)}
            >
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          <CustomRulesManager />
        </SafeAreaView>
      </Modal>

      {/* Performance Export Panel Modal */}
      <Modal
        visible={showExportPanel}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExportPanel(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf2f8' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowExportPanel(false)}
            >
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          <PerformanceExportPanel />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9f1239',
  },
  toolsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  toolCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#f9fafb',
  },
  toolIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  toolTitleDisabled: {
    color: '#9ca3af',
  },
  toolDescription: {
    fontSize: 14,
    color: '#9f1239',
    lineHeight: 20,
  },
  toolDescriptionDisabled: {
    color: '#9ca3af',
  },
  infoSection: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  accessInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  accessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accessText: {
    fontSize: 16,
    color: '#831843',
    fontWeight: '500',
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noAccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  noAccessMessage: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f9a8d4',
  },
  familyCodeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  familyCodeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  familyCodeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  familyCodeLabel: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 8,
  },
  familyCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#be185d',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  familyCodeHint: {
    fontSize: 12,
    color: '#9f1239',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});