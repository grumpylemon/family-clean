import { useAuth } from '@/hooks/useZustandHooks';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function AuthStatus() {
  const { user, logout } = useAuth();
  
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Not logged in</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Authentication Status</ThemedText>
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.label}>User:</ThemedText>
        <ThemedText style={styles.value}>
          {user.displayName || user.email || 'Anonymous User'}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.label}>ID:</ThemedText>
        <ThemedText style={styles.value}>{user.uid}</ThemedText>
      </ThemedView>
      
      {user.email && (
        <ThemedView style={styles.infoContainer}>
          <ThemedText style={styles.label}>Email:</ThemedText>
          <ThemedText style={styles.value}>{user.email}</ThemedText>
        </ThemedView>
      )}
      
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    marginVertical: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 60,
  },
  value: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 