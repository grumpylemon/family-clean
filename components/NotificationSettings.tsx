import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { WebIcon } from './ui/WebIcon';
import { NotificationSettings as NotificationSettingsType } from '@/types';
import { useAuth } from '@/hooks/useZustandHooks';

// Conditionally import notification service only on mobile platforms
let notificationService: any = null;
if (Platform.OS !== 'web') {
  try {
    notificationService = require('@/services/notificationService').notificationService;
  } catch (error) {
    console.log('Notification service not available on this platform');
  }
}

const DEFAULT_SETTINGS: NotificationSettingsType = {
  enabled: true,
  types: {
    choreAvailable: true,
    achievementUnlocked: true,
    adminApprovalNeeded: true,
    takeoverCompleted: true,
    dailySummary: true,
  },
  quietHours: {
    enabled: true,
    startTime: '21:00',
    endTime: '07:00',
  },
  sound: true,
  vibration: true,
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsType>(
    user?.notificationSettings || DEFAULT_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings(user.notificationSettings);
    }
  }, [user?.notificationSettings]);

  const updateSetting = async (
    path: string[],
    value: boolean | string
  ): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newSettings = { ...settings };
      let current: any = newSettings;
      
      // Navigate to the nested property
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      setSettings(newSettings);
      if (notificationService) {
        await notificationService.updateNotificationSettings(user.uid, newSettings);
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<void> => {
    try {
      if (notificationService) {
        const permission = await notificationService.requestPermissions();
        
        if (permission === 'granted') {
          await notificationService.initialize(user?.uid || '');
          Alert.alert('Success', 'Notifications enabled successfully!');
        } else if (permission === 'denied') {
          Alert.alert(
            'Permission Denied',
            'To enable notifications, please go to Settings > Notifications and allow notifications for Family Compass.'
          );
        }
      } else {
        Alert.alert(
          'Notifications Not Available',
          'Push notifications are only available on mobile devices.'
        );
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to enable notifications');
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    disabled = false,
    icon,
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    icon?: string;
  }) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingInfo}>
        {icon && (
          <View style={styles.settingIcon}>
            <WebIcon name={icon} size={20} color="#be185d" />
          </View>
        )}
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
        trackColor={{ false: '#fbcfe8', true: '#f9a8d4' }}
        thumbColor={value ? '#be185d' : '#ffffff'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Customize when and how you receive notifications
        </Text>
      </View>

      {/* Master Toggle */}
      <View style={styles.section}>
        <SettingRow
          title="Enable Notifications"
          subtitle="Turn on all push notifications"
          value={settings.enabled}
          onValueChange={(value) => updateSetting(['enabled'], value)}
          icon="notifications"
        />
        
        {!settings.enabled && (
          <TouchableOpacity style={styles.enableButton} onPress={requestPermissions}>
            <WebIcon name="rocket" size={20} color="white" />
            <Text style={styles.enableButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <SettingRow
          title="Chore Available"
          subtitle="When chores become available for takeover"
          value={settings.types.choreAvailable}
          onValueChange={(value) => updateSetting(['types', 'choreAvailable'], value)}
          disabled={!settings.enabled}
          icon="hand-right"
        />
        
        <SettingRow
          title="Achievement Unlocked"
          subtitle="When you or family members earn achievements"
          value={settings.types.achievementUnlocked}
          onValueChange={(value) => updateSetting(['types', 'achievementUnlocked'], value)}
          disabled={!settings.enabled}
          icon="trophy"
        />
        
        <SettingRow
          title="Admin Approval Needed"
          subtitle="When high-value takeovers need approval"
          value={settings.types.adminApprovalNeeded}
          onValueChange={(value) => updateSetting(['types', 'adminApprovalNeeded'], value)}
          disabled={!settings.enabled}
          icon="shield-checkmark"
        />
        
        <SettingRow
          title="Takeover Completed"
          subtitle="When someone completes your chore"
          value={settings.types.takeoverCompleted}
          onValueChange={(value) => updateSetting(['types', 'takeoverCompleted'], value)}
          disabled={!settings.enabled}
          icon="checkmark-circle"
        />
        
        <SettingRow
          title="Daily Summary"
          subtitle="End-of-day collaboration summary"
          value={settings.types.dailySummary}
          onValueChange={(value) => updateSetting(['types', 'dailySummary'], value)}
          disabled={!settings.enabled}
          icon="calendar"
        />
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        
        <SettingRow
          title="Enable Quiet Hours"
          subtitle="Pause notifications during specified hours"
          value={settings.quietHours.enabled}
          onValueChange={(value) => updateSetting(['quietHours', 'enabled'], value)}
          disabled={!settings.enabled}
          icon="moon"
        />
        
        {settings.quietHours.enabled && (
          <View style={styles.quietHoursInfo}>
            <View style={styles.timeRange}>
              <Text style={styles.timeLabel}>From:</Text>
              <Text style={styles.timeValue}>
                {formatTime(settings.quietHours.startTime)}
              </Text>
            </View>
            <View style={styles.timeRange}>
              <Text style={styles.timeLabel}>To:</Text>
              <Text style={styles.timeValue}>
                {formatTime(settings.quietHours.endTime)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Sound & Vibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        
        <SettingRow
          title="Sound"
          subtitle="Play sound with notifications"
          value={settings.sound}
          onValueChange={(value) => updateSetting(['sound'], value)}
          disabled={!settings.enabled}
          icon="volume-high"
        />
        
        {Platform.OS === 'android' && (
          <SettingRow
            title="Vibration"
            subtitle="Vibrate with notifications"
            value={settings.vibration}
            onValueChange={(value) => updateSetting(['vibration'], value)}
            disabled={!settings.enabled}
            icon="phone-portrait"
          />
        )}
      </View>

      {/* Test Notification */}
      {Platform.OS !== 'web' && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.testButton, !settings.enabled && styles.testButtonDisabled]}
            onPress={() => {
              if (notificationService) {
                Alert.alert('Test Notification', 'Test notification sent!');
              } else {
                Alert.alert('Not Available', 'Notifications are only available on mobile devices.');
              }
            }}
            disabled={!settings.enabled}
          >
            <WebIcon name="flask" size={20} color={settings.enabled ? '#be185d' : '#9ca3af'} />
            <Text style={[styles.testButtonText, !settings.enabled && styles.disabledText]}>
              Send Test Notification
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Web Platform Notice */}
      {Platform.OS === 'web' && (
        <View style={styles.section}>
          <View style={styles.webNotice}>
            <WebIcon name="information-circle" size={24} color="#f59e0b" />
            <Text style={styles.webNoticeText}>
              Push notifications are currently only available on mobile devices. 
              Web notification support is coming soon!
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9f1239',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fbcfe8',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#9f1239',
  },
  disabledText: {
    color: '#9ca3af',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#be185d',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quietHoursInfo: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  timeRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#9f1239',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#be185d',
    gap: 8,
  },
  testButtonDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#be185d',
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  webNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});