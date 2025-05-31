import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RotationTestingToolsProps {
  enabled: boolean;
}

export default function RotationTestingTools({ enabled }: RotationTestingToolsProps) {
  const { colors, theme } = useTheme();
  const [testing, setTesting] = useState(false);

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
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    testButtonText: {
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

  const handleTestRotation = async () => {
    setTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Test Complete', 'Rotation test completed successfully. Preview results would show here.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rotation Testing</Text>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestRotation}
            disabled={!enabled || testing}
          >
            {testing ? (
              <LoadingSpinner size="small" color="#ffffff" />
            ) : (
              <WebIcon name="play" size={20} color="#ffffff" />
            )}
            <Text style={styles.testButtonText}>
              {testing ? 'Testing...' : 'Test Current Strategy'}
            </Text>
          </TouchableOpacity>
          
          {!enabled && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>Enable rotation to test strategies</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}