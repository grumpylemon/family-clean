import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useFamily , useAuth } from '../hooks/useZustandHooks';
import { router } from 'expo-router';

interface FamilySetupProps {
  onComplete?: () => void;
}

export function FamilySetup({ onComplete }: FamilySetupProps) {
  const { createNewFamily, joinFamily, error, refreshFamily } = useFamily();
  const { logout } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;

    setLoading(true);
    try {
      const success = await createNewFamily(familyName.trim());
      if (success) {
        // If onComplete is provided, call it
        if (onComplete) {
          onComplete();
        } else {
          // Otherwise, navigate to dashboard to ensure we leave the setup screen
          router.replace('/(tabs)/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) return;

    setLoading(true);
    setLocalError(null);
    try {
      const success = await joinFamily(joinCode.trim().toUpperCase());
      if (success) {
        // If onComplete is provided, call it
        if (onComplete) {
          onComplete();
        } else {
          // Otherwise, navigate to dashboard to ensure we leave the setup screen
          router.replace('/(tabs)/dashboard');
        }
      } else if (error?.includes('already a member')) {
        // If already a member, try to refresh family data
        const refreshed = await refreshFamily();
        if (refreshed) {
          if (onComplete) {
            onComplete();
          } else {
            router.replace('/(tabs)/dashboard');
          }
        } else {
          setLocalError('Unable to load family data. Please try refreshing the page.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const refreshed = await refreshFamily();
      if (refreshed) {
        if (onComplete) {
          onComplete();
        } else {
          router.replace('/(tabs)/dashboard');
        }
      } else {
        setLocalError('Unable to load family data. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Welcome to Family Clean!</ThemedText>
        <ThemedText style={styles.subtitle}>
          Let&apos;s get your family set up
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setMode('create')}
          >
            <ThemedText style={styles.primaryButtonText}>
              Create a New Family
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMode('join')}
          >
            <ThemedText style={styles.secondaryButtonText}>
              Join Existing Family
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <ThemedText style={styles.linkButtonText}>
                Refresh / Already have a family?
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {(error || localError) && (
          <ThemedText style={styles.errorText}>{error || localError}</ThemedText>
        )}

        <TouchableOpacity
          style={[styles.linkButton, { marginTop: 40 }]}
          onPress={logout}
        >
          <ThemedText style={[styles.linkButtonText, { opacity: 0.6 }]}>
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (mode === 'create') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.container}>
          <ThemedText style={styles.title}>Create Your Family</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose a name for your family
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Family name"
            value={familyName}
            onChangeText={setFamilyName}
            autoCapitalize="words"
            placeholderTextColor="#999"
          />

          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleCreateFamily}
              disabled={loading || !familyName.trim()}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Create Family
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setMode('choose')}
              disabled={loading}
            >
              <ThemedText style={styles.linkButtonText}>Back</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  // Join mode
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Join a Family</ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter the family join code
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Enter code (e.g., ABC123)"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          placeholderTextColor="#999"
          maxLength={6}
        />

        {(error || localError) && (
          <ThemedText style={styles.errorText}>{error || localError}</ThemedText>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleJoinFamily}
            disabled={loading || !joinCode.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                Join Family
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setMode('choose')}
            disabled={loading}
          >
            <ThemedText style={styles.linkButtonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
    backgroundColor: 'white',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkButtonText: {
    color: '#4285F4',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
});