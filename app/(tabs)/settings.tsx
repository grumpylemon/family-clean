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
import { Toast } from '@/components/ui/Toast';
import AdminSettings from '@/components/AdminSettings';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { canManageFamily } = useAccessControl();
  
  const [name, setName] = useState(user?.displayName || '');
  const [defaultPoints, setDefaultPoints] = useState(family?.settings.defaultChorePoints?.toString() || '5');
  const [defaultCooldown, setDefaultCooldown] = useState(family?.settings.defaultChoreCooldownHours?.toString() || '24');
  const [defaultUrgency, setDefaultUrgency] = useState('30');
  const [allowTransfers, setAllowTransfers] = useState(family?.settings.allowPointTransfers || false);
  const [monetaryEnabled, setMonetaryEnabled] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('Default');
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  const handleUpdateProfile = () => {
    Toast.show('Profile update coming soon!', 'info');
  };

  const handleSaveSettings = () => {
    Toast.show('Settings save coming soon!', 'info');
  };

  const handleTransferPoints = () => {
    Toast.show('Point transfers coming soon!', 'info');
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

          {/* Family Settings Section */}
          {canManageFamily && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Family Settings</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Default Chore Points</Text>
                  <TextInput
                    style={styles.settingInput}
                    value={defaultPoints}
                    onChangeText={setDefaultPoints}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Default Chore Cooldown (Hours)</Text>
                  <TextInput
                    style={styles.settingInput}
                    value={defaultCooldown}
                    onChangeText={setDefaultCooldown}
                    keyboardType="numeric"
                    placeholder="24"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Default Urgency Duration (Minutes)</Text>
                  <TextInput
                    style={styles.settingInput}
                    value={defaultUrgency}
                    onChangeText={setDefaultUrgency}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Allow Admins to Transfer Points</Text>
                  <Switch
                    value={allowTransfers}
                    onValueChange={setAllowTransfers}
                    trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                    thumbColor={allowTransfers ? '#be185d' : '#9ca3af'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Enable Monetary System</Text>
                  <Text style={styles.settingSubtext}>(Chores can have real money value)</Text>
                  <Switch
                    value={monetaryEnabled}
                    onValueChange={setMonetaryEnabled}
                    trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                    thumbColor={monetaryEnabled ? '#be185d' : '#9ca3af'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>App Theme Preset</Text>
                  <TouchableOpacity style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>{selectedTheme}</Text>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Transfer Points Section */}
          {canManageFamily && allowTransfers && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transfer Points</Text>
              <View style={styles.transferCard}>
                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Transfer From</Text>
                  <TouchableOpacity style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>{user?.displayName || 'John'}</Text>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Transfer To</Text>
                  <TouchableOpacity style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>Select recipient</Text>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Amount to Transfer</Text>
                  <TextInput
                    style={styles.transferInput}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <TouchableOpacity style={styles.transferButton} onPress={handleTransferPoints}>
                  <Text style={styles.transferButtonText}>Transfer Points</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
});