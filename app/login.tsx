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
  // Get mock status immediately and synchronously
  const [isMock, setIsMock] = useState(isMockImplementation());
  
  // Check platform and mock status
  useEffect(() => {
    setIsIOS(Platform.OS === 'ios');
    // Re-check mock status in case it changed during initialization
    setIsMock(isMockImplementation());
    
    console.log("🔍 LOGIN SCREEN DEBUG:");
  console.log("  Platform:", Platform.OS);
  console.log("  Mock:", isMockImplementation());
  console.log("  User:", user?.email || 'No user');
  console.log("  Loading:", loading);
  }, []);
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !loading) {
      // Add a small delay to ensure router is ready
      console.log("User is logged in, redirecting to dashboard...");
      const timer = setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#be185d" />
          <Text style={styles.loadingText}>
            {isMock ? "Setting up demo mode..." : "Connecting to Family Compass..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="home" size={50} color="#ffffff" />
          </View>
          <Text style={styles.appTitle}>Family Compass</Text>
          <Text style={styles.tagline}>Guide your family to success</Text>
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

          {/* Platform indicator - only show if actually using mock */}
          {isMock && (
            <Text style={styles.platformNote}>
              Demo mode active
            </Text>
          )}
        </View>

        {/* Error display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            {isMock && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => {
                  // Try guest sign in as fallback
                  handleGuestSignIn();
                }}
              >
                <Text style={styles.refreshButtonText}>
                  Try Demo Mode
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#be185d',
    fontWeight: '500',
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
    backgroundColor: '#f9a8d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#be185d',
    fontWeight: '500',
    textAlign: 'center',
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
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#831843',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fce7f3',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guestButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#be185d',
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
  refreshButton: {
    backgroundColor: '#be185d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  refreshButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});