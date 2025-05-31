import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useFamily } from '../../hooks/useZustandHooks';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';
import { ChoreType, FamilyMember } from '../../types';

interface MemberPreferencesManagerProps {
  enabled: boolean;
}

interface MemberPreferences {
  userId: string;
  chorePreferences: Record<ChoreType, number>; // -2 to +2 scale
  skillCertifications: string[];
  availabilityPattern: WeeklyAvailability;
  capacityLimits: {
    maxDailyChores: number;
    maxWeeklyPoints: number;
    preferredTimeSlots: string[];
  };
  specialSettings: {
    skipWeekends: boolean;
    requiresSupervision: boolean;
    canTakeOverChores: boolean;
    preferGroupTasks: boolean;
  };
}

interface WeeklyAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  Thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface TimeSlot {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  available: boolean;
}

const choreTypes: ChoreType[] = ['individual', 'family', 'shared', 'pet', 'room'];
const choreTypeLabels: Record<ChoreType, string> = {
  individual: 'Personal Tasks',
  family: 'Family Chores',
  shared: 'Shared Duties',
  pet: 'Pet Care',
  room: 'Room Cleaning',
};

const preferenceScale = [
  { value: -2, label: 'Strongly Dislike', color: '#ef4444', icon: 'sad' },
  { value: -1, label: 'Dislike', color: '#f59e0b', icon: 'remove-circle' },
  { value: 0, label: 'Neutral', color: '#64748b', icon: 'remove' },
  { value: 1, label: 'Like', color: '#10b981', icon: 'checkmark-circle' },
  { value: 2, label: 'Strongly Like', color: '#059669', icon: 'heart' },
];

const skillCertifications = [
  'Cooking', 'Cleaning', 'Laundry', 'Gardening', 'Pet Care', 
  'Repairs', 'Organization', 'Technology', 'Car Maintenance', 'Childcare'
];

export default function MemberPreferencesManager({ enabled }: MemberPreferencesManagerProps) {
  const { colors, theme } = useTheme();
  const { family } = useFamily();
  
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [memberPreferences, setMemberPreferences] = useState<Record<string, MemberPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    memberSelector: {
      flexDirection: 'row',
      marginBottom: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    memberButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginHorizontal: 2,
    },
    memberButtonActive: {
      backgroundColor: colors.primary,
    },
    memberAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    memberButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    memberButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    preferencesCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    choreTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    choreTypeRowLast: {
      borderBottomWidth: 0,
    },
    choreTypeLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    preferenceButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    preferenceButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
      backgroundColor: colors.surface,
    },
    preferenceButtonActive: {
      transform: [{ scale: 1.1 }],
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    skillChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    skillChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    skillChipTextActive: {
      color: '#ffffff',
    },
    capacityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    capacityRowLast: {
      borderBottomWidth: 0,
    },
    capacityLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    capacityControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    capacityButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    capacityValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginHorizontal: 16,
      minWidth: 40,
      textAlign: 'center',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    switchRowLast: {
      borderBottomWidth: 0,
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    switchDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    availabilityButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    availabilityText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginTop: 20,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  useEffect(() => {
    loadMemberPreferences();
  }, []);

  useEffect(() => {
    if (family?.members?.length && !selectedMember) {
      setSelectedMember(family.members[0]);
    }
  }, [family?.members]);

  const loadMemberPreferences = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real implementation, load from rotation service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockPreferences: Record<string, MemberPreferences> = {};
      family?.members?.forEach(member => {
        mockPreferences[member.uid] = {
          userId: member.uid,
          chorePreferences: {
            individual: 1,
            family: 0,
            shared: -1,
            pet: 2,
            room: 0,
          },
          skillCertifications: ['Cleaning', 'Pet Care'],
          availabilityPattern: {} as WeeklyAvailability, // Simplified for demo
          capacityLimits: {
            maxDailyChores: 3,
            maxWeeklyPoints: 200,
            preferredTimeSlots: ['morning', 'evening'],
          },
          specialSettings: {
            skipWeekends: false,
            requiresSupervision: false,
            canTakeOverChores: true,
            preferGroupTasks: false,
          },
        };
      });
      
      setMemberPreferences(mockPreferences);
    } catch (error) {
      Toast.show({
        type: 'error',
        message: 'Failed to load member preferences',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (choreType: ChoreType, value: number) => {
    if (!enabled || !selectedMember) return;
    
    setMemberPreferences(prev => ({
      ...prev,
      [selectedMember.uid]: {
        ...prev[selectedMember.uid],
        chorePreferences: {
          ...prev[selectedMember.uid]?.chorePreferences,
          [choreType]: value,
        },
      },
    }));
  };

  const toggleSkillCertification = (skill: string) => {
    if (!enabled || !selectedMember) return;
    
    setMemberPreferences(prev => {
      const currentSkills = prev[selectedMember.uid]?.skillCertifications || [];
      const hasSkill = currentSkills.includes(skill);
      
      return {
        ...prev,
        [selectedMember.uid]: {
          ...prev[selectedMember.uid],
          skillCertifications: hasSkill
            ? currentSkills.filter(s => s !== skill)
            : [...currentSkills, skill],
        },
      };
    });
  };

  const updateCapacityLimit = (key: 'maxDailyChores' | 'maxWeeklyPoints', delta: number) => {
    if (!enabled || !selectedMember) return;
    
    setMemberPreferences(prev => ({
      ...prev,
      [selectedMember.uid]: {
        ...prev[selectedMember.uid],
        capacityLimits: {
          ...prev[selectedMember.uid]?.capacityLimits,
          [key]: Math.max(0, (prev[selectedMember.uid]?.capacityLimits?.[key] || 0) + delta),
        },
      },
    }));
  };

  const toggleSpecialSetting = (key: keyof MemberPreferences['specialSettings']) => {
    if (!enabled || !selectedMember) return;
    
    setMemberPreferences(prev => ({
      ...prev,
      [selectedMember.uid]: {
        ...prev[selectedMember.uid],
        specialSettings: {
          ...prev[selectedMember.uid]?.specialSettings,
          [key]: !prev[selectedMember.uid]?.specialSettings?.[key],
        },
      },
    }));
  };

  const handleSavePreferences = async () => {
    if (!enabled || !selectedMember) return;

    setSaving(true);
    try {
      // Here you would save preferences via rotation admin service
      // await rotationAdminService.updateMemberPreferences(selectedMember.uid, memberPreferences[selectedMember.uid]);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Toast.show({
        type: 'success',
        message: `Preferences saved for ${selectedMember.name}`,
        duration: 3000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        message: 'Failed to save preferences',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner size="large" />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
          Loading member preferences...
        </Text>
      </View>
    );
  }

  const currentPreferences = selectedMember ? memberPreferences[selectedMember.uid] : null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Member Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Member</Text>
          <View style={styles.memberSelector}>
            {family?.members?.map((member) => (
              <TouchableOpacity
                key={member.uid}
                style={[
                  styles.memberButton,
                  selectedMember?.uid === member.uid && styles.memberButtonActive,
                ]}
                onPress={() => setSelectedMember(member)}
              >
                <View style={styles.memberAvatar}>
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 10 }}>
                    {member.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[
                  styles.memberButtonText,
                  selectedMember?.uid === member.uid && styles.memberButtonTextActive,
                ]}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedMember && currentPreferences && (
          <>
            {/* Chore Preferences */}
            <View style={styles.preferencesCard}>
              <Text style={styles.cardTitle}>Chore Preferences</Text>
              {choreTypes.map((choreType, index) => (
                <View 
                  key={choreType}
                  style={[
                    styles.choreTypeRow,
                    index === choreTypes.length - 1 && styles.choreTypeRowLast,
                  ]}
                >
                  <Text style={styles.choreTypeLabel}>
                    {choreTypeLabels[choreType]}
                  </Text>
                  <View style={styles.preferenceButtons}>
                    {preferenceScale.map((scale) => {
                      const isSelected = currentPreferences.chorePreferences[choreType] === scale.value;
                      return (
                        <TouchableOpacity
                          key={scale.value}
                          style={[
                            styles.preferenceButton,
                            { backgroundColor: isSelected ? scale.color : colors.surface },
                            isSelected && styles.preferenceButtonActive,
                          ]}
                          onPress={() => updatePreference(choreType, scale.value)}
                          disabled={!enabled}
                        >
                          <WebIcon 
                            name={scale.icon} 
                            size={16} 
                            color={isSelected ? '#ffffff' : colors.textSecondary} 
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              
              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>Enable rotation to edit preferences</Text>
                </View>
              )}
            </View>

            {/* Skill Certifications */}
            <View style={styles.preferencesCard}>
              <Text style={styles.cardTitle}>Skill Certifications</Text>
              <View style={styles.skillsGrid}>
                {skillCertifications.map((skill) => {
                  const isSelected = currentPreferences.skillCertifications.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      style={[
                        styles.skillChip,
                        isSelected && styles.skillChipActive,
                      ]}
                      onPress={() => toggleSkillCertification(skill)}
                      disabled={!enabled}
                    >
                      <Text style={[
                        styles.skillChipText,
                        isSelected && styles.skillChipTextActive,
                      ]}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>Enable rotation to edit skills</Text>
                </View>
              )}
            </View>

            {/* Capacity Limits */}
            <View style={styles.preferencesCard}>
              <Text style={styles.cardTitle}>Capacity Limits</Text>
              
              <View style={styles.capacityRow}>
                <Text style={styles.capacityLabel}>Max Daily Chores</Text>
                <View style={styles.capacityControls}>
                  <TouchableOpacity 
                    style={styles.capacityButton}
                    onPress={() => updateCapacityLimit('maxDailyChores', -1)}
                    disabled={!enabled}
                  >
                    <WebIcon name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.capacityValue}>
                    {currentPreferences.capacityLimits.maxDailyChores}
                  </Text>
                  <TouchableOpacity 
                    style={styles.capacityButton}
                    onPress={() => updateCapacityLimit('maxDailyChores', 1)}
                    disabled={!enabled}
                  >
                    <WebIcon name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.capacityRow, styles.capacityRowLast]}>
                <Text style={styles.capacityLabel}>Max Weekly Points</Text>
                <View style={styles.capacityControls}>
                  <TouchableOpacity 
                    style={styles.capacityButton}
                    onPress={() => updateCapacityLimit('maxWeeklyPoints', -25)}
                    disabled={!enabled}
                  >
                    <WebIcon name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.capacityValue}>
                    {currentPreferences.capacityLimits.maxWeeklyPoints}
                  </Text>
                  <TouchableOpacity 
                    style={styles.capacityButton}
                    onPress={() => updateCapacityLimit('maxWeeklyPoints', 25)}
                    disabled={!enabled}
                  >
                    <WebIcon name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>Enable rotation to edit limits</Text>
                </View>
              )}
            </View>

            {/* Special Settings */}
            <View style={styles.preferencesCard}>
              <Text style={styles.cardTitle}>Special Settings</Text>
              
              {Object.entries({
                skipWeekends: 'Skip Weekend Assignments',
                requiresSupervision: 'Requires Adult Supervision',
                canTakeOverChores: 'Can Take Over Other Chores',
                preferGroupTasks: 'Prefers Group Tasks',
              }).map(([key, label], index, array) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.switchRow,
                    index === array.length - 1 && styles.switchRowLast,
                  ]}
                  onPress={() => toggleSpecialSetting(key as keyof MemberPreferences['specialSettings'])}
                  disabled={!enabled}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>{label}</Text>
                  </View>
                  <WebIcon 
                    name={currentPreferences.specialSettings[key as keyof MemberPreferences['specialSettings']] ? "toggle" : "toggle-outline"} 
                    size={24} 
                    color={currentPreferences.specialSettings[key as keyof MemberPreferences['specialSettings']] ? colors.primary : colors.textSecondary} 
                  />
                </TouchableOpacity>
              ))}
              
              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>Enable rotation to edit settings</Text>
                </View>
              )}
            </View>

            {/* Save Button */}
            {enabled && (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSavePreferences}
                disabled={saving}
              >
                {saving ? (
                  <LoadingSpinner size="small" color="#ffffff" />
                ) : (
                  <WebIcon name="save" size={20} color="#ffffff" />
                )}
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}