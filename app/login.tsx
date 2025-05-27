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
  Image,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Version tracking for updates
console.log("Login Screen version: v4");

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
      // Add a small delay to ensure router is ready
      const timer = setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 100);
      return () => clearTimeout(timer);
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="home" size={48} color="#3b82f6" />
          </View>
          <Text style={styles.appTitle}>Family Clean</Text>
          <Text style={styles.tagline}>Organize chores, earn rewards</Text>
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
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestSignIn}
            disabled={loading}
          >
            <Ionicons name="person-outline" size={20} color="#6b7280" />
            <Text style={styles.guestButtonText}>
              Continue as Guest
            </Text>
          </TouchableOpacity>

          {/* Platform indicator */}
          {isIOS && (
            <Text style={styles.platformNote}>
              iOS: Using demo mode
            </Text>
          )}
        </View>

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  platformNote: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 20,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});