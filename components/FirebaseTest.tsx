import { auth } from '@/config/firebase';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

type AuthState = {
  initialized: boolean;
  platform: string;
  authAvailable: boolean;
  currentUser: boolean;
};

export function FirebaseTest() {
  const [status, setStatus] = useState<string>('Checking Firebase configuration...');
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    initialized: false,
    platform: Platform.OS,
    authAvailable: false,
    currentUser: false
  });

  useEffect(() => {
    try {
      // Check if auth is available
      setAuthState({
        initialized: true,
        platform: Platform.OS,
        authAvailable: !!auth,
        currentUser: !!auth.currentUser
      });
      
      setStatus(`Firebase ${auth === mockAuth ? '(mock) ' : ''}initialized on ${Platform.OS}`);
    } catch (err) {
      setError(`❌ Firebase Error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Firebase test error:', err);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Firebase Configuration Test</ThemedText>
      {status && <ThemedText style={styles.statusText}>✅ {status}</ThemedText>}
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      <ThemedText>Platform: {authState.platform}</ThemedText>
      <ThemedText>Auth Available: {authState.authAvailable ? 'Yes' : 'No'}</ThemedText>
    </View>
  );
}

// Reference to mockAuth for comparison
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: null) => void) => {
    callback(null);
    return () => {};
  },
  signInWithPopup: async () => Promise.resolve(null),
  signOut: async () => Promise.resolve(),
  signInAnonymously: async () => Promise.resolve(null)
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusText: {
    marginBottom: 8,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 8,
  },
}); 