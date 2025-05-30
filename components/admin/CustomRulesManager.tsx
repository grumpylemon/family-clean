import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useFamilyStore } from '../../stores/hooks';
import { CustomTakeoverRules, ChoreTypeRules, MemberRules, User } from '../../types';

export default function CustomRulesManager() {
  const { family } = useFamilyStore((state) => state.family);
  const [rules, setRules] = useState<CustomTakeoverRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    choreTypes: true,
    members: false,
    timeRules: false,
  });

  // Mock data for demonstration
  const mockChoreTypes = ['kitchen', 'bathroom', 'laundry', 'outdoor', 'general'];
  const mockMembers: User[] = [
    { id: 'user_1', name: 'John', email: 'john@family.com', avatarUrl: '', familyId: family?.id || '' },
    { id: 'user_2', name: 'Sarah', email: 'sarah@family.com', avatarUrl: '', familyId: family?.id || '' },
    { id: 'user_3', name: 'Mike', email: 'mike@family.com', avatarUrl: '', familyId: family?.id || '' },
    { id: 'user_4', name: 'Emma', email: 'emma@family.com', avatarUrl: '', familyId: family?.id || '' },
  ];

  useEffect(() => {
    loadCustomRules();
  }, [family?.id]);

  const loadCustomRules = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from Firebase
      // For now, using mock data with sensible defaults
      const mockRules: CustomTakeoverRules = {
        byChoreType: {
          kitchen: {
            takeoverThresholdHours: 8,
            bonusMultiplier: 1.2,
            maxDailyTakeovers: 3,
            requiresApproval: false,
            allowedDays: [0, 1, 2, 3, 4, 5, 6], // All days
          },
          bathroom: {
            takeoverThresholdHours: 12,
            bonusMultiplier: 1.5,
            maxDailyTakeovers: 2,
            requiresApproval: true,
            allowedDays: [0, 1, 2, 3, 4, 5, 6],
          },
          laundry: {
            takeoverThresholdHours: 24,
            bonusMultiplier: 1.0,
            maxDailyTakeovers: 1,
            requiresApproval: false,
            allowedDays: [1, 2, 3, 4, 5], // Weekdays only
          },
          outdoor: {
            takeoverThresholdHours: 48,
            bonusMultiplier: 2.0,
            maxDailyTakeovers: 1,
            requiresApproval: true,
            allowedDays: [0, 6], // Weekends only
          },
          general: {
            takeoverThresholdHours: 16,
            bonusMultiplier: 1.0,
            maxDailyTakeovers: 2,
            requiresApproval: false,
            allowedDays: [0, 1, 2, 3, 4, 5, 6],
          },
        },
        byMember: {
          user_1: {
            takeoverLimit: 5,
            bonusMultiplier: 1.0,
            cooldownMultiplier: 1.0,
            canSkipApproval: false,
            restrictedChoreTypes: [],
          },
          user_2: {
            takeoverLimit: 8,
            bonusMultiplier: 1.2,
            cooldownMultiplier: 0.8,
            canSkipApproval: true,
            restrictedChoreTypes: ['outdoor'],
          },
        },
        timeBasedRules: [
          {
            id: 'weekend_boost',
            name: 'Weekend Boost',
            timeRange: { start: '00:00', end: '23:59' },
            daysOfWeek: [0, 6], // Saturday and Sunday
            modifications: { bonusMultiplier: 1.5 },
            priority: 1,
          },
          {
            id: 'evening_rush',
            name: 'Evening Rush Hour',
            timeRange: { start: '17:00', end: '20:00' },
            daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
            modifications: { takeoverThresholdHours: 4 },
            priority: 2,
          },
        ],
        emergencyOverrides: [],
      };

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setRules(mockRules);
    } catch (error) {
      console.error('Failed to load custom rules:', error);
      Alert.alert('Error', 'Failed to load custom rules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomRules = async () => {
    if (!rules) return;
    
    setIsSaving(true);
    try {
      // In a real app, this would save to Firebase
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate save
      
      Alert.alert('Success', 'Custom rules saved successfully.');
    } catch (error) {
      console.error('Failed to save custom rules:', error);
      Alert.alert('Error', 'Failed to save custom rules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateChoreTypeRule = (choreType: string, field: keyof ChoreTypeRules, value: any) => {
    if (!rules) return;
    
    setRules(prev => ({
      ...prev!,
      byChoreType: {
        ...prev!.byChoreType,
        [choreType]: {
          ...prev!.byChoreType[choreType],
          [field]: value,
        },
      },
    }));
  };

  const updateMemberRule = (memberId: string, field: keyof MemberRules, value: any) => {
    if (!rules) return;
    
    setRules(prev => ({
      ...prev!,
      byMember: {
        ...prev!.byMember,
        [memberId]: {
          ...prev!.byMember[memberId],
          [field]: value,
        },
      },
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getDayNames = (dayNumbers: number[]): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNumbers.map(day => days[day]).join(', ');
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Rules',
      'This will reset all custom rules to default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => loadCustomRules(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#be185d" />
        <Text style={styles.loadingText}>Loading custom rules...</Text>
      </View>
    );
  }

  if (!rules) {
    return (
      <View style={styles.errorContainer}>
        <WebIcon name="warning" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to Load Rules</Text>
        <Text style={styles.errorSubtitle}>
          Unable to load custom takeover rules. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCustomRules}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Takeover Rules</Text>
        <Text style={styles.subtitle}>
          Configure takeover behavior for different chore types and family members
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chore Type Rules */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('choreTypes')}
          >
            <Text style={styles.sectionTitle}>Chore Type Rules</Text>
            <WebIcon
              name={expandedSections.choreTypes ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#be185d"
            />
          </TouchableOpacity>

          {expandedSections.choreTypes && (
            <View style={styles.sectionContent}>
              {mockChoreTypes.map(choreType => {
                const rule = rules.byChoreType[choreType];
                if (!rule) return null;

                return (
                  <View key={choreType} style={styles.ruleCard}>
                    <Text style={styles.cardTitle}>
                      {choreType.charAt(0).toUpperCase() + choreType.slice(1)} Chores
                    </Text>
                    
                    <View style={styles.ruleRow}>
                      <Text style={styles.ruleLabel}>Takeover Threshold (hours):</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={rule.takeoverThresholdHours.toString()}
                        onChangeText={(text) => 
                          updateChoreTypeRule(choreType, 'takeoverThresholdHours', parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                        maxLength={3}
                      />
                    </View>

                    <View style={styles.ruleRow}>
                      <Text style={styles.ruleLabel}>Bonus Multiplier:</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={rule.bonusMultiplier.toString()}
                        onChangeText={(text) => 
                          updateChoreTypeRule(choreType, 'bonusMultiplier', parseFloat(text) || 1.0)
                        }
                        keyboardType="decimal-pad"
                        maxLength={4}
                      />
                    </View>

                    <View style={styles.ruleRow}>
                      <Text style={styles.ruleLabel}>Max Daily Takeovers:</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={rule.maxDailyTakeovers.toString()}
                        onChangeText={(text) => 
                          updateChoreTypeRule(choreType, 'maxDailyTakeovers', parseInt(text) || 1)
                        }
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>

                    <View style={styles.switchRow}>
                      <Text style={styles.ruleLabel}>Requires Admin Approval:</Text>
                      <Switch
                        value={rule.requiresApproval}
                        onValueChange={(value) => 
                          updateChoreTypeRule(choreType, 'requiresApproval', value)
                        }
                        trackColor={{ false: '#f3f4f6', true: '#fbcfe8' }}
                        thumbColor={rule.requiresApproval ? '#be185d' : '#9ca3af'}
                      />
                    </View>

                    <View style={styles.ruleRow}>
                      <Text style={styles.ruleLabel}>Allowed Days:</Text>
                      <Text style={styles.daysList}>
                        {getDayNames(rule.allowedDays)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Member-Specific Rules */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('members')}
          >
            <Text style={styles.sectionTitle}>Member-Specific Rules</Text>
            <WebIcon
              name={expandedSections.members ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#be185d"
            />
          </TouchableOpacity>

          {expandedSections.members && (
            <View style={styles.sectionContent}>
              {mockMembers.map(member => {
                const rule = rules.byMember[member.id];
                if (!rule) return null;

                return (
                  <View key={member.id} style={styles.ruleCard}>
                    <Text style={styles.cardTitle}>{member.name}</Text>
                    
                    <View style={styles.ruleRow}>
                      <Text style={styles.ruleLabel}>Daily Takeover Limit:</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={rule.takeoverLimit.toString()}
                        onChangeText={(text) => 
                          updateMemberRule(member.id, 'takeoverLimit', parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>

                    <View style={styles.ruleRow}>
                      <Text style={styles.ruleLabel}>Bonus Multiplier:</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={rule.bonusMultiplier.toString()}
                        onChangeText={(text) => 
                          updateMemberRule(member.id, 'bonusMultiplier', parseFloat(text) || 1.0)
                        }
                        keyboardType="decimal-pad"
                        maxLength={4}
                      />
                    </View>

                    <View style={styles.switchRow}>
                      <Text style={styles.ruleLabel}>Can Skip Approval:</Text>
                      <Switch
                        value={rule.canSkipApproval}
                        onValueChange={(value) => 
                          updateMemberRule(member.id, 'canSkipApproval', value)
                        }
                        trackColor={{ false: '#f3f4f6', true: '#fbcfe8' }}
                        thumbColor={rule.canSkipApproval ? '#be185d' : '#9ca3af'}
                      />
                    </View>

                    {rule.restrictedChoreTypes.length > 0 && (
                      <View style={styles.ruleRow}>
                        <Text style={styles.ruleLabel}>Restricted Chore Types:</Text>
                        <Text style={styles.restrictionsList}>
                          {rule.restrictedChoreTypes.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Time-Based Rules */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('timeRules')}
          >
            <Text style={styles.sectionTitle}>Time-Based Rules</Text>
            <WebIcon
              name={expandedSections.timeRules ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#be185d"
            />
          </TouchableOpacity>

          {expandedSections.timeRules && (
            <View style={styles.sectionContent}>
              {rules.timeBasedRules.map(timeRule => (
                <View key={timeRule.id} style={styles.ruleCard}>
                  <Text style={styles.cardTitle}>{timeRule.name}</Text>
                  
                  <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Time Range:</Text>
                    <Text style={styles.valueText}>
                      {timeRule.timeRange.start} - {timeRule.timeRange.end}
                    </Text>
                  </View>

                  <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Days:</Text>
                    <Text style={styles.valueText}>
                      {getDayNames(timeRule.daysOfWeek)}
                    </Text>
                  </View>

                  <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Modifications:</Text>
                    <Text style={styles.valueText}>
                      {Object.entries(timeRule.modifications).map(([key, value]) => 
                        `${key}: ${value}`
                      ).join(', ')}
                    </Text>
                  </View>

                  <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Priority:</Text>
                    <Text style={styles.valueText}>{timeRule.priority}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetToDefaults}
          disabled={isSaving}
        >
          <WebIcon name="refresh" size={20} color="#ef4444" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={saveCustomRules}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <WebIcon name="save" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Rules</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9f1239',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#fdf2f8',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#be185d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9f1239',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#be185d',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
  },
  sectionContent: {
    gap: 12,
  },
  ruleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#be185d',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleLabel: {
    fontSize: 14,
    color: '#9f1239',
    fontWeight: '600',
    flex: 1,
  },
  numberInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#831843',
    textAlign: 'center',
    minWidth: 60,
  },
  daysList: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  restrictionsList: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  valueText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#be185d',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});