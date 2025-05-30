// Mock Mode Indicator - Shows when app is running in mock mode
// Provides clear visual feedback to users and developers

import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { isMockImplementation, getMockModeReason } from '../config/firebase';

interface MockModeIndicatorProps {
  position?: 'top' | 'bottom';
  visible?: boolean;
}

export function MockModeIndicator({ 
  position = 'top', 
  visible = true 
}: MockModeIndicatorProps) {
  const isUsingMock = isMockImplementation();
  
  // Only show if in mock mode and visibility is enabled
  if (!isUsingMock || !visible) {
    return null;
  }

  const positionStyle = position === 'top' ? styles.top : styles.bottom;

  return (
    <View style={[styles.container, positionStyle]}>
      <View style={styles.banner}>
        <Text style={styles.icon}>🧪</Text>
        <Text style={styles.text}>MOCK MODE</Text>
        <Text style={styles.subtext}>Development/Testing Data</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'none', // Allow touches to pass through
  },
  top: {
    top: Platform.OS === 'web' ? 0 : 44, // Account for status bar on mobile
  },
  bottom: {
    bottom: Platform.OS === 'web' ? 0 : 20,
  },
  banner: {
    backgroundColor: '#ff6b35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  subtext: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
});

// Environment Information Component - for debugging
export function EnvironmentInfo() {
  const isUsingMock = isMockImplementation();
  const mockReason = getMockModeReason();
  
  if (Platform.OS !== 'web' || !__DEV__) {
    return null; // Only show in web development
  }
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const nodeEnv = process.env.NODE_ENV;
  const useMockEnv = process.env.EXPO_PUBLIC_USE_MOCK;
  
  return (
    <View style={envStyles.container}>
      <Text style={envStyles.title}>🔧 Environment Debug v2.119</Text>
      <Text style={envStyles.item}>Mock Mode: {isUsingMock ? '🧪 YES' : '🔥 NO'}</Text>
      <Text style={envStyles.reason}>Reason: {mockReason}</Text>
      <Text style={envStyles.item}>Hostname: {hostname}</Text>
      <Text style={envStyles.item}>NODE_ENV: {nodeEnv}</Text>
      <Text style={envStyles.item}>USE_MOCK: {useMockEnv}</Text>
      <Text style={envStyles.item}>Platform: {Platform.OS}</Text>
      <Text style={envStyles.item}>DEV: {__DEV__ ? 'true' : 'false'}</Text>
    </View>
  );
}

const envStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    zIndex: 999,
    maxWidth: 250,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  item: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    marginBottom: 2,
  },
  reason: {
    color: '#ffd700', // Gold color for reason
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    marginBottom: 4,
    fontWeight: '600',
  },
});