/**
 * AI Integration Panel for Admin Settings
 * Allows families to configure their own Google Gemini API keys and AI preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { UniversalIcon } from '../ui/UniversalIcon';
import { Toast } from '../ui/Toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useFamily } from '../../hooks/useZustandHooks';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { safeCollection } from '../../config/firebase';

interface FamilyAIConfig {
  geminiApiKey?: string;
  aiEnabled: boolean;
  features: {
    naturalLanguageOperations: boolean;
    smartSuggestions: boolean;
    conflictDetection: boolean;
    impactAnalysis: boolean;
    optimizationRecommendations: boolean;
  };
  preferences: {
    suggestionFrequency: 'none' | 'minimal' | 'normal' | 'frequent';
    autoApprovalThreshold: number;
    languageStyle: 'formal' | 'casual' | 'family_friendly';
    conflictSensitivity: 'low' | 'medium' | 'high';
  };
  usage: {
    requestsThisMonth: number;
    lastRequestDate?: string;
    monthlyLimit: number;
  };
}

const DEFAULT_AI_CONFIG: FamilyAIConfig = {
  aiEnabled: false,
  features: {
    naturalLanguageOperations: true,
    smartSuggestions: true,
    conflictDetection: true,
    impactAnalysis: true,
    optimizationRecommendations: false
  },
  preferences: {
    suggestionFrequency: 'normal',
    autoApprovalThreshold: 0.8,
    languageStyle: 'family_friendly',
    conflictSensitivity: 'medium'
  },
  usage: {
    requestsThisMonth: 0,
    monthlyLimit: 1000
  }
};

interface AIIntegrationPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function AIIntegrationPanel({ visible, onClose }: AIIntegrationPanelProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { family } = useFamily();
  
  const [config, setConfig] = useState<FamilyAIConfig>(DEFAULT_AI_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    if (visible && family?.id) {
      loadAIConfig();
    }
  }, [visible, family?.id]);

  const loadAIConfig = async () => {
    if (!family?.id) return;
    
    setLoading(true);
    try {
      const configDoc = doc(safeCollection('familyAIConfig'), family.id);
      const configSnap = await getDoc(configDoc);
      
      if (configSnap.exists()) {
        const data = configSnap.data() as FamilyAIConfig;
        setConfig(data);
        setApiKey(data.geminiApiKey ? '••••••••••••••••' : '');
      } else {
        setConfig(DEFAULT_AI_CONFIG);
        setApiKey('');
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
      Toast.show('Failed to load AI configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveAIConfig = async () => {
    if (!family?.id) return;
    
    setSaving(true);
    try {
      const configDoc = doc(safeCollection('familyAIConfig'), family.id);
      
      // Only update API key if user entered a new one
      const updateData = { ...config };
      if (apiKey && !apiKey.includes('••••')) {
        updateData.geminiApiKey = apiKey;
      }
      
      await updateDoc(configDoc, updateData);
      
      Toast.show('AI configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving AI config:', error);
      Toast.show('Failed to save AI configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testAPIConnection = async () => {
    if (!apiKey || apiKey.includes('••••')) {
      Toast.show('Please enter a valid API key to test', 'error');
      return;
    }

    setTestingConnection(true);
    try {
      // Test the API key with a simple request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Test connection' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        }
      );

      if (response.ok) {
        Toast.show('✅ API key is valid and working!', 'success');
      } else {
        const errorData = await response.json();
        Toast.show(`❌ API key test failed: ${errorData.error?.message || 'Invalid key'}`, 'error');
      }
    } catch (error) {
      console.error('API test error:', error);
      Toast.show('❌ Failed to test API connection', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const resetToDefaults = () => {
    const message = 'This will reset all AI settings to default values. Are you sure?';
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        setConfig(DEFAULT_AI_CONFIG);
        setApiKey('');
        Toast.show('Settings reset to defaults', 'success');
      }
    } else {
      Alert.alert(
        'Reset AI Settings',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reset', 
            style: 'destructive',
            onPress: () => {
              setConfig(DEFAULT_AI_CONFIG);
              setApiKey('');
              Toast.show('Settings reset to defaults', 'success');
            }
          }
        ]
      );
    }
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const renderAPIKeySection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Google Gemini API Configuration
      </Text>
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Enter your own Google Gemini API key to enable AI-powered bulk operations. 
        Get your free API key at https://makersuite.google.com/app/apikey
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>API Key</Text>
        <View style={[styles.apiKeyInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your Google Gemini API key"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowApiKey(!showApiKey)}
          >
            <UniversalIcon 
              name={showApiKey ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={testAPIConnection}
            disabled={testingConnection || !apiKey || apiKey.includes('••••')}
          >
            {testingConnection ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <UniversalIcon name="wifi" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.testButtonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
        <UniversalIcon name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          Your API key is stored securely and only used for your family&apos;s AI requests. 
          We recommend setting a monthly usage limit in Google Cloud Console.
        </Text>
      </View>
    </View>
  );

  const renderFeatureToggle = (
    featureKey: keyof FamilyAIConfig['features'],
    title: string,
    description: string
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={config.features[featureKey]}
        onValueChange={(value) => updateConfig(`features.${featureKey}`, value)}
        trackColor={{ false: colors.border, true: colors.primary + '30' }}
        thumbColor={config.features[featureKey] ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  const renderPreferencePicker = (
    prefKey: keyof FamilyAIConfig['preferences'],
    title: string,
    options: Array<{ value: any; label: string }>
  ) => (
    <View style={styles.preferenceGroup}>
      <Text style={[styles.preferenceTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.pickerRow}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              { 
                backgroundColor: config.preferences[prefKey] === option.value 
                  ? colors.primary + '20' 
                  : colors.surface,
                borderColor: config.preferences[prefKey] === option.value 
                  ? colors.primary 
                  : colors.border
              }
            ]}
            onPress={() => updateConfig(`preferences.${prefKey}`, option.value)}
          >
            <Text style={[
              styles.pickerOptionText,
              { 
                color: config.preferences[prefKey] === option.value 
                  ? colors.primary 
                  : colors.text
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderUsageStats = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Usage Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {config.usage.requestsThisMonth}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Requests This Month
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {config.usage.monthlyLimit - config.usage.requestsThisMonth}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Remaining
          </Text>
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Monthly Request Limit</Text>
        <TextInput
          style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={config.usage.monthlyLimit.toString()}
          onChangeText={(text) => updateConfig('usage.monthlyLimit', parseInt(text) || 1000)}
          placeholder="1000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <UniversalIcon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI Integration</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <UniversalIcon name="refresh" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading AI configuration...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderAPIKeySection()}

          <View style={styles.section}>
            <View style={styles.masterToggle}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  Enable AI Features
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Master switch for all AI-powered bulk operations
                </Text>
              </View>
              <Switch
                value={config.aiEnabled}
                onValueChange={(value) => updateConfig('aiEnabled', value)}
                trackColor={{ false: colors.border, true: colors.primary + '30' }}
                thumbColor={config.aiEnabled ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>

          {config.aiEnabled && (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Features</Text>
                
                {renderFeatureToggle(
                  'naturalLanguageOperations',
                  'Natural Language Operations',
                  'Convert conversations into bulk chore operations'
                )}
                
                {renderFeatureToggle(
                  'smartSuggestions',
                  'Smart Suggestions',
                  'AI-powered optimization recommendations'
                )}
                
                {renderFeatureToggle(
                  'conflictDetection',
                  'Conflict Detection',
                  'Automatic detection of scheduling and workload conflicts'
                )}
                
                {renderFeatureToggle(
                  'impactAnalysis',
                  'Family Impact Analysis',
                  'Preview how changes will affect each family member'
                )}
                
                {renderFeatureToggle(
                  'optimizationRecommendations',
                  'Optimization Recommendations',
                  'Proactive suggestions for improving household efficiency'
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Preferences</Text>
                
                {renderPreferencePicker(
                  'suggestionFrequency',
                  'Suggestion Frequency',
                  [
                    { value: 'none', label: 'None' },
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'frequent', label: 'Frequent' }
                  ]
                )}
                
                {renderPreferencePicker(
                  'languageStyle',
                  'Communication Style',
                  [
                    { value: 'formal', label: 'Formal' },
                    { value: 'casual', label: 'Casual' },
                    { value: 'family_friendly', label: 'Family Friendly' }
                  ]
                )}
                
                {renderPreferencePicker(
                  'conflictSensitivity',
                  'Conflict Detection Sensitivity',
                  [
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]
                )}
              </View>

              {renderUsageStats()}
            </>
          )}

          <View style={styles.saveSection}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: saving ? 0.7 : 1
                }
              ]}
              onPress={saveAIConfig}
              disabled={saving}
            >
              {saving ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <UniversalIcon name="save" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  resetButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  apiKeyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  numberInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  eyeButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  preferenceGroup: {
    marginBottom: 20,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  saveSection: {
    padding: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});