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
  Switch,
  Picker
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import Toast from '@/components/ui/Toast';

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
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedTheme}
                      onValueChange={setSelectedTheme}
                      style={styles.picker}
                    >
                      <Picker.Item label="Default" value="Default" />
                      <Picker.Item label="Pink Theme" value="Pink" />
                      <Picker.Item label="Blue Theme" value="Blue" />
                      <Picker.Item label="Green Theme" value="Green" />
                    </Picker>
                  </View>
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
                  <View style={styles.pickerContainer}>
                    <Picker style={styles.picker}>
                      <Picker.Item label={user?.displayName || 'John'} value="current-user" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.transferRow}>
                  <Text style={styles.transferLabel}>Transfer To</Text>
                  <View style={styles.pickerContainer}>
                    <Picker style={styles.picker}>
                      <Picker.Item label="Select recipient" value="" />
                      {family?.members?.map((member) => (
                        <Picker.Item 
                          key={member.uid} 
                          label={member.name} 
                          value={member.uid} 
                        />
                      ))}
                    </Picker>
                  </View>
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
  },
  picker: {
    color: '#831843',
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
});