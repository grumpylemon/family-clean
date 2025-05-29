import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useFamily } from '@/contexts/FamilyContext';
import RoomManagement from '@/components/RoomManagement';
import ChoreManagement from '@/components/ChoreManagement';
import ManageMembers from '@/components/ManageMembers';
import RewardManagement from '@/components/RewardManagement';
import FamilySettings from '@/components/FamilySettings';

interface AdminSettingsProps {
  visible: boolean;
  onClose: () => void;
}

interface AdminMenuItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  enabled: boolean;
  hasChevron?: boolean;
}

export function AdminSettings({ visible, onClose }: AdminSettingsProps) {
  const { canManageFamily, canManageChores, canManageRewards } = useAccessControl();
  const { family } = useFamily();
  
  // Modal states for each admin function
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  const [showChoreManagement, setShowChoreManagement] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showRewardManagement, setShowRewardManagement] = useState(false);
  const [showFamilySettings, setShowFamilySettings] = useState(false);

  // Admin menu items in iOS Settings style
  const adminMenuItems: AdminMenuItem[] = [
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
        <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#be185d" />
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
                <Ionicons name="shield-checkmark" size={32} color="#be185d" />
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
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.settingValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Admin Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Administration Tools</Text>
            <View style={styles.settingsGroup}>
              {adminMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index === adminMenuItems.length - 1 && styles.settingItemLast,
                    !item.enabled && styles.settingItemDisabled
                  ]}
                  onPress={item.enabled ? item.onPress : undefined}
                  disabled={!item.enabled}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: `${item.color}20` }]}>
                      <Ionicons 
                        name={item.icon} 
                        size={18} 
                        color={item.enabled ? item.color : '#9ca3af'} 
                      />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={[
                        styles.settingTitle, 
                        !item.enabled && styles.settingTitleDisabled
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.settingDescription,
                        !item.enabled && styles.settingDescriptionDisabled
                      ]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {item.hasChevron && (
                    <Ionicons 
                      name="chevron-forward" 
                      size={18} 
                      color={item.enabled ? "#be185d" : "#9ca3af"} 
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
          <RoomManagement />
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowRoomManagement(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fdf2f8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#be185d',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
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
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  adminIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fdf2f8',
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
    color: '#831843',
    marginBottom: 2,
  },
  adminSubtitle: {
    fontSize: 14,
    color: '#9f1239',
  },
  settingsGroup: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: '#9ca3af',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingDescriptionDisabled: {
    color: '#d1d5db',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  accessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  accessText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  modalHeader: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: '#f9a8d4',
    borderRadius: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AdminSettings;