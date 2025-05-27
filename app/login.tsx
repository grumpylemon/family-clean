import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { isMockImplementation } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Platform, 
  StyleSheet, 
  TouchableOpacity, 
  View,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Version tracking for updates
console.log("Login Screen version: v3");

const { width, height } = Dimensions.get('window');

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
      router.replace('/(tabs)/dashboard');
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
      console.log("Attempting guest sign in");
      await signInAsGuest();
    } catch (err) {
      console.error('Guest sign in error:', err);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </ThemedView>
    );
  }

  return (
    <LinearGradient
      colors={['#4285F4', '#3367D6']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="home" size={60} color="#4285F4" />
          </View>
          <ThemedText style={styles.appTitle}>Family Clean</ThemedText>
          <ThemedText style={styles.tagline}>Organize chores, earn rewards</ThemedText>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Image 
              source={{ uri: 'https://www.google.com/favicon.ico' }} 
              style={styles.googleIcon}
            />
            <ThemedText style={styles.googleButtonText}>
              Continue with Google
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestSignIn}
            disabled={loading}
          >
            <Ionicons name="person-outline" size={20} color="#4285F4" />
            <ThemedText style={styles.guestButtonText}>
              Continue as Guest
            </ThemedText>
          </TouchableOpacity>

          {/* Platform indicator */}
          {isIOS && (
            <ThemedText style={styles.platformNote}>
              iOS: Using demo mode
            </ThemedText>
          )}
        </View>

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 12,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  platformNote: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  errorText: {
    color: '#EA4335',
    textAlign: 'center',
    fontSize: 14,
  },
});