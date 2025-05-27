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
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
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
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.title}>Family Settings</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedView style={styles.content}>
            <ThemedText style={styles.errorText}>
              Only family admins can modify settings
            </ThemedText>
            
            <ThemedView style={styles.infoSection}>
              <ThemedText style={styles.infoTitle}>Family Information</ThemedText>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Family Name:</ThemedText>
                <ThemedText style={styles.infoValue}>{family?.name}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Join Code:</ThemedText>
                <ThemedText style={[styles.infoValue, styles.joinCode]}>{family?.joinCode}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Members:</ThemedText>
                <ThemedText style={styles.infoValue}>{family?.members.length || 0}</ThemedText>
              </ThemedView>
            </ThemedView>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveFamily}
            >
              <ThemedText style={styles.leaveButtonText}>Leave Family</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
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
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Family Settings</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Done</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.scrollView}>
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Family Name</ThemedText>
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Enter family name"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Join Code</ThemedText>
              <ThemedView style={styles.joinCodeContainer}>
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
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Chore Settings</ThemedText>
            
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Default Chore Points</ThemedText>
              <TextInput
                style={styles.input}
                value={defaultChorePoints}
                onChangeText={setDefaultChorePoints}
                placeholder="10"
                keyboardType="numeric"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Default Cooldown Hours</ThemedText>
              <TextInput
                style={styles.input}
                value={defaultChoreCooldownHours}
                onChangeText={setDefaultChoreCooldownHours}
                placeholder="24"
                keyboardType="numeric"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedView style={styles.switchRow}>
                <ThemedText style={styles.label}>Allow Point Transfers</ThemedText>
                <Switch
                  value={allowPointTransfers}
                  onValueChange={setAllowPointTransfers}
                  trackColor={{ false: '#767577', true: '#4285F4' }}
                  thumbColor={allowPointTransfers ? '#fff' : '#f4f3f4'}
                />
              </ThemedView>
              <ThemedText style={styles.helperText}>
                Allow family members to transfer points between each other
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Schedule Settings</ThemedText>
            
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Week Start Day</ThemedText>
              <ThemedView style={styles.weekDaySelector}>
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
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
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
              <ThemedView style={styles.dangerZoneContent}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteFamily}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete Family</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.dangerWarning}>
                  This will permanently delete all family data
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveSettings}
              disabled={loading}
            >
              <ThemedText style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>

        {loading && (
          <ThemedView style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
          </ThemedView>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    opacity: 0.7,
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
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
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
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});