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
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebIcon } from '@/components/ui/WebIcon';
import { useAuth, useFamily } from '@/hooks/useZustandHooks';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTheme } from '@/contexts/ThemeContext';
import { Toast } from '@/components/ui/Toast';
import AdminSettings from '@/components/AdminSettings';
import NotificationSettings from '@/components/NotificationSettings';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { canManageFamily } = useAccessControl();
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  
  const [name, setName] = useState(user?.displayName || '');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const handleChangeAvatar = async () => {
    try {
      // Check if platform supports image picker
      if (Platform.OS === 'web') {
        Alert.alert(
          'Avatar Change',
          'Avatar changing is currently available on mobile devices only. Web support coming soon!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Dynamic import for expo-image-picker on mobile platforms only
      const ImagePicker = await import('expo-image-picker');
      
      // Request permission for camera/photo library access
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required', 
          'Please grant permission to access your photo library to change your avatar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show options for camera or library
      Alert.alert(
        'Change Avatar',
        'Choose how you\'d like to update your profile picture',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted) {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                
                if (!result.canceled && result.assets[0]) {
                  // TODO: Upload image and update user profile
                  Toast.show('Avatar upload feature coming soon!', 'info');
                  console.log('Selected image:', result.assets[0].uri);
                }
              }
            }
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                // TODO: Upload image and update user profile  
                Toast.show('Avatar upload feature coming soon!', 'info');
                console.log('Selected image:', result.assets[0].uri);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error changing avatar:', error);
      Toast.show('Failed to change avatar. Please try again.', 'error');
    }
  };

  const handleUpdateProfile = () => {
    Toast.show('Profile update coming soon!', 'info');
  };

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

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
    profileSection: {
      alignItems: 'center',
      paddingVertical: 24,
      backgroundColor: colors.cardBackground,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#ffffff',
    },
    profileName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    changeAvatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 8,
    },
    changeAvatarText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.content}>
          {/* My Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {user?.photoURL ? (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {getInitials(user.displayName || 'User')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {getInitials(user?.displayName || 'User')}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar}>
                  <WebIcon name="camera" size={16} color={colors.primary} />
                  <Text style={styles.changeAvatarText}>Change Avatar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.profileForm}>
                <Text style={styles.fieldLabel}>My Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                />

                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
                  <Text style={styles.updateButtonText}>Update Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
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
                    { backgroundColor: canManageFamily ? '#fdf2f8' : '#f9fafb' }
                  ]}>
                    <WebIcon 
                      name="shield-checkmark" 
                      size={24} 
                      color={canManageFamily ? '#be185d' : '#9ca3af'} 
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
                  color={canManageFamily ? "#be185d" : "#9ca3af"} 
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
                      color={colors.primary}
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
                  <WebIcon name="sunny" size={20} color={themeMode === 'light' ? colors.primary : colors.textMuted} />
                  <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
                  onPress={() => handleToggleDarkMode('dark')}
                >
                  <WebIcon name="moon" size={20} color={themeMode === 'dark' ? colors.primary : colors.textMuted} />
                  <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>Dark</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, themeMode === 'system' && styles.themeOptionActive]}
                  onPress={() => handleToggleDarkMode('system')}
                >
                  <WebIcon name="phone-portrait" size={20} color={themeMode === 'system' ? colors.primary : colors.textMuted} />
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
                      color={colors.primary} 
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
                  color={colors.primary} 
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
                <WebIcon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <NotificationSettings />
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}
