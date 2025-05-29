import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Toast } from '@/components/ui/Toast';
import AdminSettings from '@/components/AdminSettings';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { canManageFamily } = useAccessControl();
  const colorScheme = useColorScheme();
  
  const [name, setName] = useState(user?.displayName || '');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  const handleUpdateProfile = () => {
    Toast.show('Profile update coming soon!', 'info');
  };

  const handleToggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    // TODO: Implement dark mode toggle functionality
    Toast.show(`${value ? 'Dark' : 'Light'} mode coming soon!`, 'info');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
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
                <TouchableOpacity style={styles.changeAvatarButton}>
                  <Ionicons name="camera" size={16} color="#be185d" />
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
                    <Ionicons 
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
                <Ionicons 
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
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons 
                      name={isDarkMode ? "moon" : "sunny"} 
                      size={20} 
                      color="#be185d" 
                    />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Dark Mode</Text>
                    <Text style={styles.settingDescription}>Switch between light and dark themes</Text>
                  </View>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                  thumbColor={isDarkMode ? '#be185d' : '#9ca3af'}
                />
              </View>
            </View>
          </View>

          {/* More Settings Coming Soon */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coming Soon</Text>
            <View style={styles.settingsCard}>
              <View style={styles.comingSoonItem}>
                <Ionicons name="notifications-outline" size={24} color="#9f1239" />
                <View style={styles.comingSoonText}>
                  <Text style={styles.comingSoonTitle}>Notifications</Text>
                  <Text style={styles.comingSoonDescription}>Customize notification preferences</Text>
                </View>
              </View>
              <View style={styles.comingSoonItem}>
                <Ionicons name="language-outline" size={24} color="#9f1239" />
                <View style={styles.comingSoonText}>
                  <Text style={styles.comingSoonTitle}>Language</Text>
                  <Text style={styles.comingSoonDescription}>Choose your preferred language</Text>
                </View>
              </View>
              <View style={styles.comingSoonItem}>
                <Ionicons name="lock-closed-outline" size={24} color="#9f1239" />
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
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#831843',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
  },
  profileForm: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#831843',
  },
  updateButton: {
    backgroundColor: '#be185d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 20,
  },
  settingItem: {
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  settingSubtext: {
    fontSize: 12,
    color: '#9f1239',
    fontStyle: 'italic',
  },
  settingInput: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#831843',
  },
  pickerContainer: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
    color: '#831843',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#be185d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  transferCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  transferRow: {
    gap: 8,
  },
  transferLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  transferInput: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#831843',
  },
  transferButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  transferButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  adminItemDisabled: {
    opacity: 0.5,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  adminTitleDisabled: {
    color: '#9ca3af',
  },
  adminDescription: {
    fontSize: 14,
    color: '#9f1239',
  },
  adminDescriptionDisabled: {
    color: '#d1d5db',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 2,
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
    color: '#831843',
    marginBottom: 2,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#9f1239',
  },
});