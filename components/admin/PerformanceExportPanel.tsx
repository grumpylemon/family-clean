import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useFamilyStore } from '../../stores/hooks';
import { PerformanceReport, ExportSettings } from '../../types';

type ExportFormat = 'csv' | 'pdf' | 'both';
type ExportFrequency = 'daily' | 'weekly' | 'monthly';

interface ExportHistory {
  id: string;
  type: string;
  generatedAt: string;
  format: ExportFormat;
  fileSize: string;
  downloadUrl?: string;
}

export default function PerformanceExportPanel() {
  const { family } = useFamilyStore((state) => state.family);
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadExportSettings();
    loadExportHistory();
  }, [family?.id]);

  const loadExportSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from Firebase
      const mockSettings: ExportSettings = {
        autoGenerate: true,
        frequency: 'weekly',
        recipients: ['admin@family.com'],
        includeCharts: true,
        format: 'both',
        lastGeneratedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setExportSettings(mockSettings);
    } catch (error) {
      console.error('Failed to load export settings:', error);
      Alert.alert('Error', 'Failed to load export settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExportHistory = async () => {
    try {
      // Mock export history
      const mockHistory: ExportHistory[] = [
        {
          id: 'export_1',
          type: 'Monthly Family Report',
          generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          format: 'pdf',
          fileSize: '2.3 MB',
        },
        {
          id: 'export_2',
          type: 'Weekly Takeover Analytics',
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          format: 'csv',
          fileSize: '456 KB',
        },
        {
          id: 'export_3',
          type: 'Quarterly Performance Review',
          generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          format: 'both',
          fileSize: '8.7 MB',
        },
      ];

      setExportHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    if (!exportSettings) return;
    
    setExportSettings(prev => ({
      ...prev!,
      [key]: value,
    }));
  };

  const addRecipient = () => {
    Alert.prompt(
      'Add Recipient',
      'Enter email address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (email) => {
            if (email && email.includes('@')) {
              updateSetting('recipients', [...(exportSettings?.recipients || []), email]);
            } else {
              Alert.alert('Error', 'Please enter a valid email address.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const removeRecipient = (email: string) => {
    updateSetting('recipients', exportSettings?.recipients.filter(r => r !== email) || []);
  };

  const generateExport = async (type: 'instant' | 'scheduled') => {
    setIsExporting(true);
    
    try {
      const exportData = {
        familyId: family?.id,
        period: selectedPeriod,
        format: exportSettings?.format || 'pdf',
        includeCharts: exportSettings?.includeCharts || true,
        customDateRange: customStartDate && customEndDate ? {
          start: customStartDate,
          end: customEndDate,
        } : undefined,
      };

      // Simulate export generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add to history
      const newExport: ExportHistory = {
        id: `export_${Date.now()}`,
        type: type === 'instant' ? 'On-Demand Report' : 'Scheduled Report',
        generatedAt: new Date().toISOString(),
        format: exportSettings?.format || 'pdf',
        fileSize: '1.2 MB',
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      
      Alert.alert(
        'Export Complete',
        `Your ${type} export has been generated successfully. Check your export history to download.`
      );
      
    } catch (error) {
      console.error('Export generation failed:', error);
      Alert.alert('Error', 'Failed to generate export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = (exportItem: ExportHistory) => {
    // In a real app, this would trigger a download
    Alert.alert(
      'Download Ready',
      `Download ${exportItem.type} (${exportItem.fileSize})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            Alert.alert('Success', 'Export downloaded to your device.');
          },
        },
      ]
    );
  };

  const saveSettings = async () => {
    if (!exportSettings) return;
    
    try {
      // In a real app, this would save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Export settings saved successfully.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#be185d" />
        <Text style={styles.loadingText}>Loading export settings...</Text>
      </View>
    );
  }

  if (!exportSettings) {
    return (
      <View style={styles.errorContainer}>
        <WebIcon name="warning" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to Load Settings</Text>
        <Text style={styles.errorSubtitle}>
          Unable to load export settings. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadExportSettings}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Export</Text>
        <Text style={styles.subtitle}>
          Generate and manage family performance reports
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Export</Text>
          <View style={styles.quickExportCard}>
            <Text style={styles.cardSubtitle}>Generate an instant report</Text>
            
            <View style={styles.periodSelector}>
              <Text style={styles.label}>Time Period:</Text>
              <View style={styles.periodButtons}>
                {(['week', 'month', 'quarter', 'year'] as const).map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      selectedPeriod === period && styles.periodButtonActive
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive
                    ]}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Date Range */}
            <View style={styles.customDateSection}>
              <Text style={styles.label}>Custom Date Range (Optional):</Text>
              <View style={styles.dateInputs}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="Start Date (YYYY-MM-DD)"
                  value={customStartDate}
                  onChangeText={setCustomStartDate}
                />
                <TextInput
                  style={styles.dateInput}
                  placeholder="End Date (YYYY-MM-DD)"
                  value={customEndDate}
                  onChangeText={setCustomEndDate}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.exportButton, isExporting && styles.disabledButton]}
              onPress={() => generateExport('instant')}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <WebIcon name="download" size={20} color="white" />
                  <Text style={styles.exportButtonText}>Generate Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automated Export Settings</Text>
          <View style={styles.settingsCard}>
            
            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>Auto-Generate Reports:</Text>
              <Switch
                value={exportSettings.autoGenerate}
                onValueChange={(value) => updateSetting('autoGenerate', value)}
                trackColor={{ false: '#f3f4f6', true: '#fbcfe8' }}
                thumbColor={exportSettings.autoGenerate ? '#be185d' : '#9ca3af'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Frequency:</Text>
              <View style={styles.frequencyButtons}>
                {(['daily', 'weekly', 'monthly'] as ExportFrequency[]).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      exportSettings.frequency === freq && styles.frequencyButtonActive
                    ]}
                    onPress={() => updateSetting('frequency', freq)}
                  >
                    <Text style={[
                      styles.frequencyButtonText,
                      exportSettings.frequency === freq && styles.frequencyButtonTextActive
                    ]}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Format:</Text>
              <View style={styles.formatButtons}>
                {(['csv', 'pdf', 'both'] as ExportFormat[]).map(format => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.formatButton,
                      exportSettings.format === format && styles.formatButtonActive
                    ]}
                    onPress={() => updateSetting('format', format)}
                  >
                    <Text style={[
                      styles.formatButtonText,
                      exportSettings.format === format && styles.formatButtonTextActive
                    ]}>
                      {format.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.settingLabel}>Include Charts:</Text>
              <Switch
                value={exportSettings.includeCharts}
                onValueChange={(value) => updateSetting('includeCharts', value)}
                trackColor={{ false: '#f3f4f6', true: '#fbcfe8' }}
                thumbColor={exportSettings.includeCharts ? '#be185d' : '#9ca3af'}
              />
            </View>

            {/* Recipients */}
            <View style={styles.recipientsSection}>
              <View style={styles.recipientsHeader}>
                <Text style={styles.settingLabel}>Email Recipients:</Text>
                <TouchableOpacity style={styles.addButton} onPress={addRecipient}>
                  <WebIcon name="add" size={20} color="#be185d" />
                </TouchableOpacity>
              </View>
              
              {exportSettings.recipients.map((email, index) => (
                <View key={index} style={styles.recipientItem}>
                  <Text style={styles.recipientEmail}>{email}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeRecipient(email)}
                  >
                    <WebIcon name="close" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
              <WebIcon name="save" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export History</Text>
          <View style={styles.historyList}>
            {exportHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.type}</Text>
                  <Text style={styles.historyDetails}>
                    {item.format.toUpperCase()} • {item.fileSize} • {getTimeAgo(item.generatedAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => downloadExport(item)}
                >
                  <WebIcon name="download" size={20} color="#be185d" />
                </TouchableOpacity>
              </View>
            ))}
            
            {exportHistory.length === 0 && (
              <View style={styles.emptyHistory}>
                <WebIcon name="document-text" size={48} color="#9ca3af" />
                <Text style={styles.emptyHistoryText}>No exports generated yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Generate your first export to see it here
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  quickExportCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
  cardSubtitle: {
    fontSize: 14,
    color: '#9f1239',
    marginBottom: 16,
  },
  periodSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    backgroundColor: 'white',
  },
  periodButtonActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  customDateSection: {
    marginBottom: 20,
  },
  dateInputs: {
    gap: 8,
  },
  dateInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f9a8d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#831843',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#be185d',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    backgroundColor: 'white',
  },
  frequencyButtonActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    backgroundColor: 'white',
  },
  formatButtonActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9f1239',
  },
  formatButtonTextActive: {
    color: 'white',
  },
  recipientsSection: {
    marginBottom: 20,
  },
  recipientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  recipientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  recipientEmail: {
    fontSize: 14,
    color: '#831843',
  },
  removeButton: {
    padding: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
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
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 14,
    color: '#9f1239',
  },
  downloadButton: {
    padding: 8,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#831843',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9f1239',
    textAlign: 'center',
  },
});