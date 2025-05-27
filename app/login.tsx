import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { isMockImplementation } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity } from 'react-native';

// Version tracking for updates
console.log("Login Screen version: v2");

export default function LoginScreen() {
  const { user, loading, error, signInWithGoogle, signInAsGuest } = useAuth();
  const [isIOS, setIsIOS] = useState(false);
  const [isMock, setIsMock] = useState(false);
  
  // Check platform and mock status
  useEffect(() => {
    setIsIOS(Platform.OS === 'ios');
    setIsMock(isMockImplementation());
    
    if (isIOS) {
      console.log("Login on iOS, using mock implementation");
    }
  }, []);
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      console.log(`Attempting Google sign in on ${Platform.OS}`);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error in component:', err);
    }
  };

  // Handle guest sign in
  const handleGuestSignIn = async () => {
    try {
      console.log('Attempting guest sign in');
      await signInAsGuest();
    } catch (err) {
      console.error('Guest sign in error in component:', err);
    }
  };

  // If we're already loading the auth state, show a loading indicator
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#A1CEDC" />
        <ThemedText style={styles.loadingText}>Checking login status...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Family Clean</ThemedText>
      <ThemedText style={styles.subtitle}>
        Organize chores and keep your family in sync!
      </ThemedText>
      
      {isIOS && (
        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Running on iOS with mock data
          </ThemedText>
        </ThemedView>
      )}
      
      {error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          Sign in with Google {isIOS ? '(Mock)' : ''}
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.buttonSecondary} 
        onPress={handleGuestSignIn}
        disabled={loading}
      >
        <ThemedText style={styles.buttonTextSecondary}>
          Continue as Guest
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4285F4',
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
  }
}); 