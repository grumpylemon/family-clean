import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebIcon } from '../../components/ui/WebIcon';
import { useAuth, useFamily } from '../../hooks/useZustandHooks';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useTheme } from '../../contexts/ThemeContext';
import { Toast } from '../../components/ui/Toast';
import AdminSettings from '../../components/AdminSettings';
import NotificationSettings from '../../components/NotificationSettings';
import { AdvancedUserProfile } from '../../components/profile/AdvancedUserProfile';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { canManageFamily } = useAccessControl();
  const { colors, theme, themeMode, setThemeMode, isLoading: themeLoading } = useTheme();
  
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);


  const handleToggleDarkMode = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await setThemeMode(mode);
      
      // Show feedback to user
      Toast.show(
        `Theme set to ${mode === 'system' ? 'follow system' : mode} mode`,
        'success'
      );
      
      console.log(`Theme preference saved: ${mode}`);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      Toast.show('Failed to save theme preference. Please try again.', 'error');
    }
  };


  // Show loading while theme is initializing or colors not available
  if (themeLoading || !colors) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdf2f8' }}>
        <ActivityIndicator size="large" color="#be185d" />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 12,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    settingsCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 8,
      elevation: 3,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingSection: {
      paddingVertical: 12,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 4,
      paddingBottom: 8,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.primary,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    themeOptionTextActive: {
      color: colors.primary,
    },
    adminItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    adminLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    adminIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    adminTextContainer: {
      flex: 1,
    },
    adminTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    adminSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    adminArrow: {
      marginLeft: 8,
    },
    joinButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    joinButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
    },
    noFamilySection: {
      padding: 40,
      alignItems: 'center',
    },
    noFamilyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    noFamilyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    adminDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    adminDescriptionDisabled: {
      color: colors.textMuted,
    },
    adminItemDisabled: {
      opacity: 0.5,
    },
    adminTitleDisabled: {
      color: colors.textMuted,
    },
    comingSoonSection: {
      opacity: 0.6,
    },
    comingSoonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 12,
      opacity: 0.6,
    },
    comingSoonText: {
      flex: 1,
    },
    comingSoonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    comingSoonDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    profileCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
      shadowRadius: 8,
      elevation: 3,
    },
    emptyProfileText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* Enhanced User Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Profile</Text>
            {user ? (
              <AdvancedUserProfile
                user={user}
                onProfileUpdate={(updates) => {
                  // Profile updates will be handled by the component
                  console.log('Profile updated:', updates);
                }}
                canEdit={true}
                showPrivacyControls={true}
                viewerRole="member"
              />
            ) : (
              <View style={styles.profileCard}>
                <Text style={styles.emptyProfileText}>Please log in to manage your profile</Text>
              </View>
            )}
          </View>

          {/* Admin Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity 
                style={[
                  styles.adminItem,
                  !canManageFamily && styles.adminItemDisabled
                ]}
                onPress={canManageFamily ? () => setShowAdminSettings(true) : undefined}
                disabled={!canManageFamily}
              >
                <View style={styles.adminLeft}>
                  <View style={[
                    styles.adminIcon, 
                    { backgroundColor: canManageFamily ? (theme === 'dark' ? colors.surface : '#fdf2f8') : (theme === 'dark' ? colors.background : '#f9fafb') }
                  ]}>
                    <WebIcon 
                      name="shield-checkmark" 
                      size={24} 
                      color={canManageFamily ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} 
                    />
                  </View>
                  <View style={styles.adminTextContainer}>
                    <Text style={[
                      styles.adminTitle,
                      !canManageFamily && styles.adminTitleDisabled
                    ]}>
                      Admin Panel
                    </Text>
                    <Text style={[
                      styles.adminDescription,
                      !canManageFamily && styles.adminDescriptionDisabled
                    ]}>
                      {canManageFamily 
                        ? 'Family management and administration tools'
                        : 'Requires administrator privileges'
                      }
                    </Text>
                  </View>
                </View>
                <WebIcon 
                  name="chevron-forward" 
                  size={20} 
                  color={canManageFamily ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* App Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Preferences</Text>
            <View style={styles.settingsCard}>
              <View style={styles.settingSection}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <WebIcon 
                      name={theme === 'dark' ? "moon" : "sunny"} 
                      size={20} 
                      color={theme === 'dark' ? colors.accent : colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Theme</Text>
                    <Text style={styles.settingDescription}>Choose your preferred appearance</Text>
                  </View>
                </View>
              </View>
              <View style={styles.themeOptions}>
                <TouchableOpacity 
                  style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
                  onPress={() => handleToggleDarkMode('light')}
                >
                  <WebIcon name="sunny" size={20} color={themeMode === 'light' ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} />
                  <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
                  onPress={() => handleToggleDarkMode('dark')}
                >
                  <WebIcon name="moon" size={20} color={themeMode === 'dark' ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} />
                  <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>Dark</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, themeMode === 'system' && styles.themeOptionActive]}
                  onPress={() => handleToggleDarkMode('system')}
                >
                  <WebIcon name="phone-portrait" size={20} color={themeMode === 'system' ? (theme === 'dark' ? colors.accent : colors.primary) : colors.textMuted} />
                  <Text style={[styles.themeOptionText, themeMode === 'system' && styles.themeOptionTextActive]}>System</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity 
                style={styles.adminItem}
                onPress={() => setShowNotificationSettings(true)}
              >
                <View style={styles.adminLeft}>
                  <View style={styles.adminIcon}>
                    <WebIcon 
                      name="notifications" 
                      size={24} 
                      color={theme === 'dark' ? colors.accent : colors.primary} 
                    />
                  </View>
                  <View style={styles.adminTextContainer}>
                    <Text style={styles.adminTitle}>
                      Notification Settings
                    </Text>
                    <Text style={styles.adminDescription}>
                      Customize when and how you receive notifications
                    </Text>
                  </View>
                </View>
                <WebIcon 
                  name="chevron-forward" 
                  size={20} 
                  color={theme === 'dark' ? colors.accent : colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* More Settings Coming Soon */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coming Soon</Text>
            <View style={styles.settingsCard}>
              <View style={styles.comingSoonItem}>
                <WebIcon name="language-outline" size={24} color={colors.textSecondary} />
                <View style={styles.comingSoonText}>
                  <Text style={styles.comingSoonTitle}>Language</Text>
                  <Text style={styles.comingSoonDescription}>Choose your preferred language</Text>
                </View>
              </View>
              <View style={styles.comingSoonItem}>
                <WebIcon name="lock-closed-outline" size={24} color={colors.textSecondary} />
                <View style={styles.comingSoonText}>
                  <Text style={styles.comingSoonTitle}>Privacy</Text>
                  <Text style={styles.comingSoonDescription}>Manage privacy settings</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Admin Settings Modal */}
      <AdminSettings 
        visible={showAdminSettings}
        onClose={() => setShowAdminSettings(false)}
      />

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fdf2f8', zIndex: 1000 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f9a8d4' }}>
              <TouchableOpacity
                style={{ padding: 8, borderRadius: 20, backgroundColor: '#f9a8d4' }}
                onPress={() => setShowNotificationSettings(false)}
              >
                <WebIcon name="close" size={24} color={theme === 'dark' ? '#ffffff' : colors.text} />
              </TouchableOpacity>
            </View>
            <NotificationSettings />
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}
