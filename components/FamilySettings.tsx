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
  View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { useFamily } from '@/contexts/FamilyContext';

interface FamilySettingsProps {
  visible: boolean;
  onClose: () => void;
}

export function FamilySettings({ visible, onClose }: FamilySettingsProps) {
  const { family, isAdmin, updateFamilySettings } = useFamily();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [familyName, setFamilyName] = useState('');
  const [defaultChorePoints, setDefaultChorePoints] = useState('10');
  const [defaultChoreCooldownHours, setDefaultChoreCooldownHours] = useState('24');
  const [allowPointTransfers, setAllowPointTransfers] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState('0');
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    if (visible && family) {
      // Initialize form with current settings
      setFamilyName(family.name);
      setDefaultChorePoints(family.settings.defaultChorePoints.toString());
      setDefaultChoreCooldownHours(family.settings.defaultChoreCooldownHours.toString());
      setAllowPointTransfers(family.settings.allowPointTransfers);
      setWeekStartDay(family.settings.weekStartDay.toString());
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
          allowPointTransfers,
          weekStartDay: parseInt(weekStartDay) || 0,
        },
      };

      const success = await updateFamilySettings(updates.settings, updates.name);
      
      if (success) {
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
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Family Settings</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <ThemedText style={styles.errorText}>
              Only family admins can modify settings
            </ThemedText>
            
            <View style={styles.infoSection}>
              <ThemedText style={styles.infoTitle}>Family Information</ThemedText>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Family Name:</ThemedText>
                <ThemedText style={styles.infoValue}>{family?.name}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Join Code:</ThemedText>
                <ThemedText style={[styles.infoValue, styles.joinCode]}>{family?.joinCode}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Members:</ThemedText>
                <ThemedText style={styles.infoValue}>{family?.members.length || 0}</ThemedText>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveFamily}
            >
              <ThemedText style={styles.leaveButtonText}>Leave Family</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Family Settings</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Family Name</ThemedText>
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Enter family name"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Join Code</ThemedText>
              <View style={styles.joinCodeContainer}>
                <ThemedText style={styles.joinCodeText}>{family?.joinCode}</ThemedText>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    // TODO: Implement copy to clipboard
                    Alert.alert('Info', 'Join code copied to clipboard');
                  }}
                >
                  <ThemedText style={styles.copyButtonText}>Copy</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Chore Settings</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Default Chore Points</ThemedText>
              <TextInput
                style={styles.input}
                value={defaultChorePoints}
                onChangeText={setDefaultChorePoints}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Default Cooldown Hours</ThemedText>
              <TextInput
                style={styles.input}
                value={defaultChoreCooldownHours}
                onChangeText={setDefaultChoreCooldownHours}
                placeholder="24"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <ThemedText style={styles.label}>Allow Point Transfers</ThemedText>
                <Switch
                  value={allowPointTransfers}
                  onValueChange={setAllowPointTransfers}
                  trackColor={{ false: '#767577', true: '#4285F4' }}
                  thumbColor={allowPointTransfers ? '#fff' : '#f4f3f4'}
                />
              </View>
              <ThemedText style={styles.helperText}>
                Allow family members to transfer points between each other
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Schedule Settings</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Week Start Day</ThemedText>
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
                    <ThemedText
                      style={[
                        styles.weekDayButtonText,
                        weekStartDay === day.value && styles.weekDayButtonTextSelected,
                      ]}
                    >
                      {day.label.substring(0, 3)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Danger Zone</ThemedText>
            
            <TouchableOpacity
              style={styles.dangerToggle}
              onPress={() => setShowDangerZone(!showDangerZone)}
            >
              <ThemedText style={styles.dangerToggleText}>
                {showDangerZone ? 'Hide' : 'Show'} Danger Zone
              </ThemedText>
            </TouchableOpacity>

            {showDangerZone && (
              <View style={styles.dangerZoneContent}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteFamily}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete Family</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.dangerWarning}>
                  This will permanently delete all family data
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveSettings}
              disabled={loading}
            >
              <ThemedText style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#EA4335',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  joinCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: '#4285F4',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4285F4',
    borderRadius: 4,
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
    color: '#6b7280',
    marginTop: 4,
  },
  weekDaySelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  weekDayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  weekDayButtonSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  weekDayButtonText: {
    fontSize: 14,
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
    color: '#EA4335',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerZoneContent: {
    marginTop: 16,
    alignItems: 'center',
  },
  dangerWarning: {
    fontSize: 12,
    color: '#EA4335',
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4285F4',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  leaveButton: {
    backgroundColor: '#EA4335',
    marginTop: 20,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EA4335',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  joinCode: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FamilySettings;