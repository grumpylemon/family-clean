import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  View,
  Text,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Toast } from '@/components/ui/Toast';
import { DEFAULT_COLLABORATION_SETTINGS, updateCollaborationSettings } from '@/services/collaborationService';
import { CollaborationSettings } from '@/types';

interface FamilySettingsProps {
  visible: boolean;
  onClose: () => void;
}

export function FamilySettings({ visible, onClose }: FamilySettingsProps) {
  const { family, isAdmin, updateFamilySettings } = useFamily();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [familyName, setFamilyName] = useState('');
  const [defaultChorePoints, setDefaultChorePoints] = useState('10');
  const [defaultChoreCooldownHours, setDefaultChoreCooldownHours] = useState('24');
  const [defaultUrgencyMinutes, setDefaultUrgencyMinutes] = useState('30');
  const [allowPointTransfers, setAllowPointTransfers] = useState(false);
  const [enableMonetarySystem, setEnableMonetarySystem] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState('0');
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showTransferPoints, setShowTransferPoints] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  
  // Collaboration Settings state
  const [collaborationSettings, setCollaborationSettings] = useState<CollaborationSettings>({
    ...DEFAULT_COLLABORATION_SETTINGS,
    familyId: family?.id || ''
  });
  const [showCollaborationSettings, setShowCollaborationSettings] = useState(false);

  useEffect(() => {
    if (visible && family) {
      // Initialize form with current settings
      setFamilyName(family.name);
      setDefaultChorePoints(family.settings.defaultChorePoints.toString());
      setDefaultChoreCooldownHours(family.settings.defaultChoreCooldownHours.toString());
      setAllowPointTransfers(family.settings.allowPointTransfers);
      setWeekStartDay(family.settings.weekStartDay.toString());
      
      // Initialize collaboration settings
      if (family.collaborationSettings) {
        setCollaborationSettings({
          ...family.collaborationSettings,
          familyId: family.id || ''
        });
      } else {
        setCollaborationSettings({
          ...DEFAULT_COLLABORATION_SETTINGS,
          familyId: family.id || ''
        });
      }
    }
  }, [visible, family]);

  const handleSaveSettings = async () => {
    if (!family || !isAdmin) return;

    if (!familyName.trim()) {
      Alert.alert('Error', 'Family name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      // Update family name and settings
      const updates = {
        name: familyName.trim(),
        settings: {
          defaultChorePoints: parseInt(defaultChorePoints) || 10,
          defaultChoreCooldownHours: parseInt(defaultChoreCooldownHours) || 24,
          defaultUrgencyMinutes: parseInt(defaultUrgencyMinutes) || 30,
          allowPointTransfers,
          enableMonetarySystem,
          weekStartDay: parseInt(weekStartDay) || 0,
        },
      };

      const success = await updateFamilySettings(updates.settings, updates.name);
      
      if (success) {
        // Also update collaboration settings
        if (family.id) {
          await updateCollaborationSettings(family.id, collaborationSettings);
        }
        
        Alert.alert('Success', 'Family settings updated successfully');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update settings');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating settings');
      console.error('Error updating settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      'Leave Family',
      'Are you sure you want to leave this family? You can rejoin later using the family code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement leave family functionality
            Alert.alert('Info', 'Leave family feature coming soon');
          },
        },
      ]
    );
  };

  const handleDeleteFamily = () => {
    Alert.alert(
      'Delete Family',
      'Are you sure you want to permanently delete this family? This action cannot be undone and will remove all family data including chores and rewards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm family deletion',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Confirm',
                  onPress: () => {
                    // TODO: Implement family deletion
                    Alert.alert('Info', 'Family deletion feature coming soon');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const weekDays = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  if (!isAdmin) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#be185d" />
              <Text style={styles.backText}>Admin</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Family Settings</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.content}>
            <Text style={styles.errorText}>
              Only family admins can modify settings
            </Text>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Family Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Family Name:</Text>
                <Text style={styles.infoValue}>{family?.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Join Code:</Text>
                <Text style={[styles.infoValue, styles.joinCode]}>{family?.joinCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Members:</Text>
                <Text style={styles.infoValue}>{family?.members.length || 0}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveFamily}
            >
              <Text style={styles.leaveButtonText}>Leave Family</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#be185d" />
            <Text style={styles.backText}>Admin</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Family Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Family Name</Text>
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Enter family name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Join Code</Text>
              <View style={styles.joinCodeContainer}>
                <Text style={styles.joinCodeText}>{family?.joinCode}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    // TODO: Implement copy to clipboard
                    Toast.show('Join code copied to clipboard', 'success');
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chore Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Chore Points</Text>
              <TextInput
                style={styles.input}
                value={defaultChorePoints}
                onChangeText={setDefaultChorePoints}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Cooldown Hours</Text>
              <TextInput
                style={styles.input}
                value={defaultChoreCooldownHours}
                onChangeText={setDefaultChoreCooldownHours}
                placeholder="24"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Urgency Duration (Minutes)</Text>
              <TextInput
                style={styles.input}
                value={defaultUrgencyMinutes}
                onChangeText={setDefaultUrgencyMinutes}
                placeholder="30"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Allow Point Transfers</Text>
                <Switch
                  value={allowPointTransfers}
                  onValueChange={setAllowPointTransfers}
                  trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                  thumbColor={allowPointTransfers ? '#be185d' : '#9ca3af'}
                />
              </View>
              <Text style={styles.helperText}>
                Allow admins to transfer points between family members
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Enable Monetary System</Text>
                <Switch
                  value={enableMonetarySystem}
                  onValueChange={setEnableMonetarySystem}
                  trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                  thumbColor={enableMonetarySystem ? '#be185d' : '#9ca3af'}
                />
              </View>
              <Text style={styles.helperText}>
                Chores can have real money value
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Week Start Day</Text>
              <View style={styles.weekDaySelector}>
                {weekDays.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.weekDayButton,
                      weekStartDay === day.value && styles.weekDayButtonSelected,
                    ]}
                    onPress={() => setWeekStartDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.weekDayButtonText,
                        weekStartDay === day.value && styles.weekDayButtonTextSelected,
                      ]}
                    >
                      {day.label.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Collaboration Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collaboration Features</Text>
            
            <TouchableOpacity
              style={styles.collaborationToggle}
              onPress={() => setShowCollaborationSettings(!showCollaborationSettings)}
            >
              <Text style={styles.collaborationToggleText}>
                {showCollaborationSettings ? 'Hide' : 'Show'} Collaboration Settings
              </Text>
            </TouchableOpacity>
            
            {showCollaborationSettings && (
              <View style={styles.collaborationContent}>
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Enable Help Requests</Text>
                    <Switch
                      value={collaborationSettings.helpRequestsEnabled}
                      onValueChange={(value) => setCollaborationSettings({
                        ...collaborationSettings,
                        helpRequestsEnabled: value
                      })}
                      trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                      thumbColor={collaborationSettings.helpRequestsEnabled ? '#be185d' : '#9ca3af'}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Allow members to request help with their chores
                  </Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Enable Trade Proposals</Text>
                    <Switch
                      value={collaborationSettings.tradeProposalsEnabled}
                      onValueChange={(value) => setCollaborationSettings({
                        ...collaborationSettings,
                        tradeProposalsEnabled: value
                      })}
                      trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                      thumbColor={collaborationSettings.tradeProposalsEnabled ? '#be185d' : '#9ca3af'}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Allow members to propose chore trades with each other
                  </Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Enable Urgency System</Text>
                    <Switch
                      value={collaborationSettings.urgencySystemEnabled}
                      onValueChange={(value) => setCollaborationSettings({
                        ...collaborationSettings,
                        urgencySystemEnabled: value
                      })}
                      trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                      thumbColor={collaborationSettings.urgencySystemEnabled ? '#be185d' : '#9ca3af'}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Chores become urgent as due dates approach with bonus points
                  </Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Enable Chore Stealing</Text>
                    <Switch
                      value={collaborationSettings.choreStealingEnabled}
                      onValueChange={(value) => setCollaborationSettings({
                        ...collaborationSettings,
                        choreStealingEnabled: value
                      })}
                      trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                      thumbColor={collaborationSettings.choreStealingEnabled ? '#be185d' : '#9ca3af'}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Allow members to "steal" urgent chores for bonus points
                  </Text>
                </View>
                
                {/* Help Request Settings */}
                {collaborationSettings.helpRequestsEnabled && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Help Request Settings</Text>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Default Expiration (hours)</Text>
                      <TextInput
                        style={styles.input}
                        value={collaborationSettings.helpRequestDefaults.expirationHours.toString()}
                        onChangeText={(value) => setCollaborationSettings({
                          ...collaborationSettings,
                          helpRequestDefaults: {
                            ...collaborationSettings.helpRequestDefaults,
                            expirationHours: parseInt(value) || 24
                          }
                        })}
                        keyboardType="numeric"
                        placeholder="24"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Min Helper Points Share (%)</Text>
                      <TextInput
                        style={styles.input}
                        value={collaborationSettings.helpRequestDefaults.minPointsSplit.toString()}
                        onChangeText={(value) => setCollaborationSettings({
                          ...collaborationSettings,
                          helpRequestDefaults: {
                            ...collaborationSettings.helpRequestDefaults,
                            minPointsSplit: parseInt(value) || 20
                          }
                        })}
                        keyboardType="numeric"
                        placeholder="20"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                )}
                
                {/* Trade Settings */}
                {collaborationSettings.tradeProposalsEnabled && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Trade Settings</Text>
                    
                    <View style={styles.inputGroup}>
                      <View style={styles.switchRow}>
                        <Text style={styles.label}>Require Admin Approval</Text>
                        <Switch
                          value={collaborationSettings.tradeDefaults.requireAdminApproval}
                          onValueChange={(value) => setCollaborationSettings({
                            ...collaborationSettings,
                            tradeDefaults: {
                              ...collaborationSettings.tradeDefaults,
                              requireAdminApproval: value
                            }
                          })}
                          trackColor={{ false: '#f1f5f9', true: '#f9a8d4' }}
                          thumbColor={collaborationSettings.tradeDefaults.requireAdminApproval ? '#be185d' : '#9ca3af'}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Fairness Threshold (%)</Text>
                      <TextInput
                        style={styles.input}
                        value={collaborationSettings.tradeDefaults.fairnessThreshold.toString()}
                        onChangeText={(value) => setCollaborationSettings({
                          ...collaborationSettings,
                          tradeDefaults: {
                            ...collaborationSettings.tradeDefaults,
                            fairnessThreshold: parseInt(value) || 70
                          }
                        })}
                        keyboardType="numeric"
                        placeholder="70"
                        placeholderTextColor="#9ca3af"
                      />
                      <Text style={styles.helperText}>
                        Trades below this fairness score require admin approval
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Transfer Points Section */}
          {allowPointTransfers && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transfer Points</Text>
              <TouchableOpacity
                style={styles.transferToggle}
                onPress={() => setShowTransferPoints(!showTransferPoints)}
              >
                <Text style={styles.transferToggleText}>
                  {showTransferPoints ? 'Hide' : 'Show'} Transfer Options
                </Text>
              </TouchableOpacity>
              
              {showTransferPoints && (
                <View style={styles.transferContent}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Transfer From</Text>
                    <TouchableOpacity style={styles.pickerContainer}>
                      <Text style={styles.pickerText}>{user?.displayName || 'Select member'}</Text>
                      <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Transfer To</Text>
                    <TouchableOpacity style={styles.pickerContainer}>
                      <Text style={styles.pickerText}>Select recipient</Text>
                      <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Amount to Transfer</Text>
                    <TextInput
                      style={styles.input}
                      value={transferAmount}
                      onChangeText={setTransferAmount}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.transferButton]}
                    onPress={() => Toast.show('Point transfer coming soon!', 'info')}
                  >
                    <Text style={styles.transferButtonText}>Transfer Points</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            
            <TouchableOpacity
              style={styles.dangerToggle}
              onPress={() => setShowDangerZone(!showDangerZone)}
            >
              <Text style={styles.dangerToggleText}>
                {showDangerZone ? 'Hide' : 'Show'} Danger Zone
              </Text>
            </TouchableOpacity>

            {showDangerZone && (
              <View style={styles.dangerZoneContent}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteFamily}
                >
                  <Text style={styles.deleteButtonText}>Delete Family</Text>
                </TouchableOpacity>
                <Text style={styles.dangerWarning}>
                  This will permanently delete all family data
                </Text>
              </View>
            )}
          </View>

          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveSettings}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#be185d" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fdf2f8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f9a8d4',
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
    backgroundColor: '#fdf2f8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ef4444',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#831843',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#831843',
  },
  input: {
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fdf2f8',
    color: '#831843',
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fdf2f8',
  },
  joinCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: '#be185d',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#be185d',
    borderRadius: 8,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
    fontStyle: 'italic',
  },
  weekDaySelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  weekDayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f9a8d4',
    backgroundColor: '#ffffff',
  },
  weekDayButtonSelected: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  weekDayButtonText: {
    fontSize: 14,
    color: '#831843',
  },
  weekDayButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  dangerToggle: {
    padding: 8,
    alignItems: 'center',
  },
  dangerToggleText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerZoneContent: {
    marginTop: 16,
    alignItems: 'center',
  },
  dangerWarning: {
    fontSize: 12,
    color: '#ef4444',
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  transferToggle: {
    padding: 8,
    alignItems: 'center',
  },
  transferToggleText: {
    color: '#be185d',
    fontSize: 14,
    fontWeight: '600',
  },
  transferContent: {
    marginTop: 16,
  },
  pickerContainer: {
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#f9a8d4',
    borderRadius: 12,
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
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#be185d',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    padding: 20,
    paddingTop: 8,
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    marginTop: 20,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transferButton: {
    backgroundColor: '#10b981',
  },
  transferButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#831843',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9f1239',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#831843',
  },
  joinCode: {
    color: '#be185d',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(253, 242, 248, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collaborationToggle: {
    padding: 8,
    alignItems: 'center',
  },
  collaborationToggleText: {
    color: '#be185d',
    fontSize: 14,
    fontWeight: '600',
  },
  collaborationContent: {
    marginTop: 16,
  },
  subsection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#831843',
  },
});

export default FamilySettings;