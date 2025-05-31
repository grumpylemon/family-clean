import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';

interface ScheduleIntelligencePanelProps {
  enabled: boolean;
}

export default function ScheduleIntelligencePanel({ enabled }: ScheduleIntelligencePanelProps) {
  const { colors, theme } = useTheme();
  
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [conflictSensitivity, setConflictSensitivity] = useState(70);
  const [bufferTime, setBufferTime] = useState(30);
  const [saving, setSaving] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    card: {
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
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Calendar Integration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calendar Integration</Text>
          
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Google Calendar Sync</Text>
              <Text style={styles.settingDescription}>
                Connect with Google Calendar for availability checking
              </Text>
            </View>
            <Switch
              value={calendarEnabled}
              onValueChange={setCalendarEnabled}
              disabled={!enabled}
              trackColor={{ false: colors.surface, true: colors.primary }}
              thumbColor={calendarEnabled ? '#ffffff' : colors.textMuted}
            />
          </View>
          
          {!enabled && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>Enable rotation to configure schedule intelligence</Text>
            </View>
          )}
        </View>

        {/* Placeholder for additional schedule settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming Soon</Text>
          <Text style={styles.settingDescription}>
            Advanced schedule intelligence features will be available in the next update.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}