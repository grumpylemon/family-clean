import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';

interface RotationAnalyticsProps {
  enabled: boolean;
}

export default function RotationAnalytics({ enabled }: RotationAnalyticsProps) {
  const { colors, theme } = useTheme();

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
    placeholder: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rotation Analytics</Text>
          <Text style={styles.placeholder}>
            Advanced analytics and performance metrics will be available in the next update.
          </Text>
          
          {!enabled && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>Enable rotation to view analytics</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}