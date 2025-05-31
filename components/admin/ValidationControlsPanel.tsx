import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useValidationConfig, useValidationPresets } from '../../hooks/useValidationConfig';
import { StrictnessLevel, FamilyValidationConfig } from '../../types/validationConfig';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Toast } from '../ui/Toast';
import { ValidatedInput } from '../ui/ValidatedInput';

interface ValidationControlsPanelProps {
  onClose?: () => void;
}

export function ValidationControlsPanel({ onClose }: ValidationControlsPanelProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { config, loading, error, updateConfig, resetToDefaults } = useValidationConfig();
  
  const [activeTab, setActiveTab] = useState<'general' | 'chores' | 'members' | 'rewards' | 'messages' | 'analytics'>('general');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Handle configuration updates
  const handleConfigUpdate = useCallback(async (updates: Partial<FamilyValidationConfig>) => {
    try {
      await updateConfig(updates);
      setUnsavedChanges(false);
      Toast.show('Configuration updated successfully', 'success');
    } catch {
      Toast.show('Failed to update configuration', 'error');
    }
  }, [updateConfig]);

  // Handle strictness level change
  const handleStrictnessChange = useCallback((level: StrictnessLevel) => {
    if (!config) return;
    
    setUnsavedChanges(true);
    handleConfigUpdate({ strictnessLevel: level });
  }, [config, handleConfigUpdate]);

  // Handle rule configuration change
  const handleRuleChange = useCallback((
    category: 'choreRules' | 'memberRules' | 'rewardRules',
    field: string,
    updates: any
  ) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      [category]: {
        ...config[category],
        [field]: {
          ...config[category][field as keyof typeof config[category]],
          ...updates
        }
      }
    };
    
    setUnsavedChanges(true);
    handleConfigUpdate(newConfig);
  }, [config, handleConfigUpdate]);

  // Handle custom message change
  const handleCustomMessageChange = useCallback((field: string, message: string) => {
    if (!config) return;
    
    const newMessages = {
      ...config.customMessages,
      [field]: message
    };
    
    setUnsavedChanges(true);
    handleConfigUpdate({ customMessages: newMessages });
  }, [config, handleConfigUpdate]);

  // Handle reset to defaults
  const handleResetToDefaults = useCallback(async () => {
    try {
      await resetToDefaults();
      setUnsavedChanges(false);
      setShowConfirmReset(false);
      Toast.show('Configuration reset to defaults', 'success');
    } catch {
      Toast.show('Failed to reset configuration', 'error');
    }
  }, [resetToDefaults]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Loading validation configuration..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => window.location.reload()}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No validation configuration found. Creating default configuration...
        </Text>
      </View>
    );
  }

  const renderTabButton = (tab: typeof activeTab, title: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { backgroundColor: colors.primary },
        { borderColor: colors.border }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        { color: activeTab === tab ? colors.background : colors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderGeneralTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Validation Strictness Level</Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Choose how strict validation should be for your family
      </Text>
      
      <View style={styles.strictnessOptions}>
        {(['relaxed', 'normal', 'strict', 'custom'] as StrictnessLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.strictnessOption,
              config.strictnessLevel === level && { backgroundColor: colors.primaryLight },
              { borderColor: colors.border }
            ]}
            onPress={() => handleStrictnessChange(level)}
          >
            <View style={styles.strictnessHeader}>
              <Text style={[
                styles.strictnessTitle,
                { color: config.strictnessLevel === level ? colors.primary : colors.text }
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
              {config.strictnessLevel === level && (
                <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.selectedBadgeText, { color: colors.background }]}>Active</Text>
                </View>
              )}
            </View>
            <Text style={[styles.strictnessDescription, { color: colors.textSecondary }]}>
              {getStrictnessDescription(level)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.globalSettings}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Global Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Validation</Text>
          <Switch
            value={config.isEnabled}
            onValueChange={(enabled) => handleConfigUpdate({ isEnabled: enabled })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Show Warnings</Text>
          <Switch
            value={config.globalSettings.showWarnings}
            onValueChange={(enabled) => handleConfigUpdate({
              globalSettings: { ...config.globalSettings, showWarnings: enabled }
            })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Character Count Display</Text>
          <Switch
            value={config.globalSettings.characterCountEnabled}
            onValueChange={(enabled) => handleConfigUpdate({
              globalSettings: { ...config.globalSettings, characterCountEnabled: enabled }
            })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Validation Hints</Text>
          <Switch
            value={config.globalSettings.hintsEnabled}
            onValueChange={(enabled) => handleConfigUpdate({
              globalSettings: { ...config.globalSettings, hintsEnabled: enabled }
            })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.warning }]}
          onPress={() => setShowConfirmReset(true)}
        >
          <Text style={[styles.resetButtonText, { color: colors.background }]}>Reset to Defaults</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.previewButton, { backgroundColor: colors.secondary }]}
          onPress={() => setPreviewMode(!previewMode)}
        >
          <Text style={[styles.previewButtonText, { color: colors.text }]}>
            {previewMode ? 'Exit Preview' : 'Preview Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChoresTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Chore Validation Rules</Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Configure validation requirements for chore creation and editing
      </Text>

      <ValidationRuleEditor
        title="Chore Title"
        rule={config.choreRules.title}
        onRuleChange={(updates) => handleRuleChange('choreRules', 'title', updates)}
        colors={colors}
      />

      <ValidationRuleEditor
        title="Chore Description"
        rule={config.choreRules.description}
        onRuleChange={(updates) => handleRuleChange('choreRules', 'description', updates)}
        colors={colors}
      />

      <ValidationRuleEditor
        title="Points Value"
        rule={config.choreRules.points}
        onRuleChange={(updates) => handleRuleChange('choreRules', 'points', updates)}
        colors={colors}
        isNumeric
      />

      <ValidationRuleEditor
        title="Frequency (Days)"
        rule={config.choreRules.frequency}
        onRuleChange={(updates) => handleRuleChange('choreRules', 'frequency', updates)}
        colors={colors}
        isNumeric
      />

      <ValidationRuleEditor
        title="Cooldown (Hours)"
        rule={config.choreRules.cooldown}
        onRuleChange={(updates) => handleRuleChange('choreRules', 'cooldown', updates)}
        colors={colors}
        isNumeric
      />

      <View style={styles.crossFieldValidation}>
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Cross-Field Validation</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Cooldown vs Frequency Check</Text>
          <Switch
            value={config.choreRules.crossField.cooldownVsFrequency.enabled}
            onValueChange={(enabled) => handleRuleChange('choreRules', 'crossField', {
              cooldownVsFrequency: { ...config.choreRules.crossField.cooldownVsFrequency, enabled }
            })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>
    </View>
  );

  const renderMembersTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Member Validation Rules</Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Configure validation requirements for family member profiles
      </Text>

      <ValidationRuleEditor
        title="Display Name"
        rule={config.memberRules.displayName}
        onRuleChange={(updates) => handleRuleChange('memberRules', 'displayName', updates)}
        colors={colors}
      />

      <ValidationRuleEditor
        title="Email Address"
        rule={config.memberRules.email}
        onRuleChange={(updates) => handleRuleChange('memberRules', 'email', updates)}
        colors={colors}
      />

      <View style={styles.profileRequirements}>
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Profile Requirements</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Profile Photo Required</Text>
          <Switch
            value={config.memberRules.profileRequirements.photoRequired}
            onValueChange={(required) => handleRuleChange('memberRules', 'profileRequirements', {
              ...config.memberRules.profileRequirements,
              photoRequired: required
            })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>
    </View>
  );

  const renderRewardsTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Reward Validation Rules</Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Configure validation requirements for reward creation and editing
      </Text>

      <ValidationRuleEditor
        title="Reward Name"
        rule={config.rewardRules.name}
        onRuleChange={(updates) => handleRuleChange('rewardRules', 'name', updates)}
        colors={colors}
      />

      <ValidationRuleEditor
        title="Reward Description"
        rule={config.rewardRules.description}
        onRuleChange={(updates) => handleRuleChange('rewardRules', 'description', updates)}
        colors={colors}
      />

      <ValidationRuleEditor
        title="Points Cost"
        rule={config.rewardRules.pointsCost}
        onRuleChange={(updates) => handleRuleChange('rewardRules', 'pointsCost', updates)}
        colors={colors}
        isNumeric
      />

      <ValidationRuleEditor
        title="Minimum Level"
        rule={config.rewardRules.minLevel}
        onRuleChange={(updates) => handleRuleChange('rewardRules', 'minLevel', updates)}
        colors={colors}
        isNumeric
      />

      <View style={styles.categoryRequirements}>
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Category Requirements</Text>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Category Required</Text>
          <Switch
            value={config.rewardRules.category.required}
            onValueChange={(required) => handleRuleChange('rewardRules', 'category', {
              ...config.rewardRules.category,
              required
            })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>
    </View>
  );

  const renderMessagesTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Custom Error Messages</Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Personalize validation messages to match your family&apos;s communication style
      </Text>

      {Object.entries(DEFAULT_MESSAGES).map(([field, defaultMessage]) => (
        <View key={field} style={styles.messageEditor}>
          <Text style={[styles.messageLabel, { color: colors.text }]}>
            {formatFieldName(field)}
          </Text>
          <Text style={[styles.defaultMessage, { color: colors.textSecondary }]}>
            Default: &quot;{defaultMessage}&quot;
          </Text>
          <ValidatedInput
            value={config.customMessages[field] || ''}
            onChangeText={(text) => handleCustomMessageChange(field, text)}
            placeholder={defaultMessage}
            style={[styles.messageInput, { borderColor: colors.border, color: colors.text }]}
            multiline
          />
        </View>
      ))}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Validation Analytics</Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Monitor validation performance and user experience
      </Text>

      {config.analytics && (
        <View style={styles.analyticsGrid}>
          <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.analyticsValue, { color: colors.primary }]}>
              {config.analytics.totalValidationErrors}
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.text }]}>Total Validation Errors</Text>
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.analyticsValue, { color: colors.success }]}>
              {config.analytics.completionRates.overall.toFixed(1)}%
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.text }]}>Completion Rate</Text>
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.analyticsValue, { color: colors.secondary }]}>
              {config.analytics.performanceMetrics.averageValidationTime.toFixed(0)}ms
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.text }]}>Avg Validation Time</Text>
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.analyticsValue, { color: colors.warning }]}>
              {config.analytics.performanceMetrics.validationCacheHitRate.toFixed(1)}%
            </Text>
            <Text style={[styles.analyticsLabel, { color: colors.text }]}>Cache Hit Rate</Text>
          </View>
        </View>
      )}

      <Text style={[styles.subSectionTitle, { color: colors.text }]}>Configuration History</Text>
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
        Version {config.version} • Last updated {new Date(config.updatedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Validation Controls</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {unsavedChanges && (
        <View style={[styles.unsavedBanner, { backgroundColor: colors.warning }]}>
          <Text style={[styles.unsavedText, { color: colors.background }]}>
            You have unsaved changes
          </Text>
        </View>
      )}

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('general', 'General')}
          {renderTabButton('chores', 'Chores')}
          {renderTabButton('members', 'Members')}
          {renderTabButton('rewards', 'Rewards')}
          {renderTabButton('messages', 'Messages')}
          {renderTabButton('analytics', 'Analytics')}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'chores' && renderChoresTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
        {activeTab === 'messages' && renderMessagesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>

      <ConfirmDialog
        visible={showConfirmReset}
        title="Reset Configuration"
        message="This will reset all validation rules to their default values. This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={handleResetToDefaults}
        onCancel={() => setShowConfirmReset(false)}
        confirmButtonColor={colors.warning}
      />
    </View>
  );
}

// Helper component for editing individual validation rules
interface ValidationRuleEditorProps {
  title: string;
  rule: any;
  onRuleChange: (updates: any) => void;
  colors: any;
  isNumeric?: boolean;
}

function ValidationRuleEditor({ title, rule, onRuleChange, colors, isNumeric }: ValidationRuleEditorProps) {
  return (
    <View style={[styles.ruleEditor, { borderColor: colors.border }]}>
      <View style={styles.ruleHeader}>
        <Text style={[styles.ruleTitle, { color: colors.text }]}>{title}</Text>
        <Switch
          value={rule.enabled}
          onValueChange={(enabled) => onRuleChange({ enabled })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.background}
        />
      </View>

      {rule.enabled && (
        <View style={styles.ruleSettings}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Required</Text>
            <Switch
              value={rule.required}
              onValueChange={(required) => onRuleChange({ required })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          {!isNumeric && rule.minLength !== undefined && (
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Min Length</Text>
              <ValidatedInput
                value={rule.minLength?.toString() || ''}
                onChangeText={(text) => onRuleChange({ minLength: parseInt(text) || 0 })}
                placeholder="0"
                keyboardType="numeric"
                style={[styles.numericInput, { borderColor: colors.border, color: colors.text }]}
              />
            </View>
          )}

          {!isNumeric && rule.maxLength !== undefined && (
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Max Length</Text>
              <ValidatedInput
                value={rule.maxLength?.toString() || ''}
                onChangeText={(text) => onRuleChange({ maxLength: parseInt(text) || 100 })}
                placeholder="100"
                keyboardType="numeric"
                style={[styles.numericInput, { borderColor: colors.border, color: colors.text }]}
              />
            </View>
          )}

          {isNumeric && rule.min !== undefined && (
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Minimum Value</Text>
              <ValidatedInput
                value={rule.min?.toString() || ''}
                onChangeText={(text) => onRuleChange({ min: parseFloat(text) || 0 })}
                placeholder="0"
                keyboardType="numeric"
                style={[styles.numericInput, { borderColor: colors.border, color: colors.text }]}
              />
            </View>
          )}

          {isNumeric && rule.max !== undefined && (
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Maximum Value</Text>
              <ValidatedInput
                value={rule.max?.toString() || ''}
                onChangeText={(text) => onRuleChange({ max: parseFloat(text) || 1000 })}
                placeholder="1000"
                keyboardType="numeric"
                style={[styles.numericInput, { borderColor: colors.border, color: colors.text }]}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Helper functions
function getStrictnessDescription(level: StrictnessLevel): string {
  switch (level) {
    case 'relaxed':
      return 'Minimal validation requirements. Great for families just getting started or those who prefer flexibility.';
    case 'normal':
      return 'Balanced validation with reasonable requirements. Recommended for most families.';
    case 'strict':
      return 'Enhanced validation with stricter requirements. Ideal for families focused on data quality and consistency.';
    case 'custom':
      return 'Fully customizable validation rules. Configure every aspect to match your family&apos;s specific needs.';
    default:
      return '';
  }
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

const DEFAULT_MESSAGES = {
  choreTitle: 'Chore title must be 2-50 characters',
  chorePoints: 'Points must be between 1 and 100',
  displayName: 'Display name must be 2-30 characters',
  email: 'Must be a valid email address',
  rewardName: 'Reward name must be 2-50 characters',
  rewardCost: 'Cost must be between 1 and 1000 points',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unsavedBanner: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  unsavedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  strictnessOptions: {
    gap: 16,
    marginBottom: 32,
  },
  strictnessOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  strictnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strictnessTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  strictnessDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  globalSettings: {
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ruleEditor: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  ruleSettings: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  numericInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 24,
  },
  crossFieldValidation: {
    marginTop: 24,
  },
  profileRequirements: {
    marginTop: 24,
  },
  categoryRequirements: {
    marginTop: 24,
  },
  messageEditor: {
    marginBottom: 24,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  defaultMessage: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  analyticsCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});