import { isMockImplementation } from '../config/firebase';
import { useAuth } from '../hooks/useZustandHooks';
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
import { WebIcon } from '../components/ui/WebIcon';
import { useTheme } from '../contexts/ThemeContext';

// Version tracking for updates
console.log("Login Screen version: v4");

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { user, loading, error, signInWithGoogle, signInAsGuest } = useAuth();
  const { colors, theme, isLoading: themeLoading } = useTheme();
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
    console.log('🔍 LOGIN REDIRECT CHECK:', {
      hasUser: !!user,
      userEmail: user?.email,
      userFamilyId: user?.familyId,
      loading,
      isAuthenticated: !!user
    });
    
    if (user && !loading) {
      // Add a small delay to ensure router is ready
      console.log("✅ User is logged in, redirecting to dashboard...", {
        uid: user.uid,
        email: user.email,
        familyId: user.familyId
      });
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

  // Show loading while theme is initializing
  if (themeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdf2f8' }}>
        <ActivityIndicator size="large" color="#be185d" />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingContainer: {
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textMuted,
      marginTop: 12,
    },
    content: {
      flex: 1,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: width * 0.4,
      height: width * 0.4,
      maxWidth: 160,
      maxHeight: 160,
      marginBottom: 24,
    },
    appTitle: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    buttonsContainer: {
      width: '100%',
      gap: 16,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 28,
      gap: 12,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    googleButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    googleButtonText: {
      color: '#ffffff',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginVertical: 8,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      fontSize: 14,
      color: colors.textMuted,
      marginHorizontal: 16,
    },
    guestButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primaryLight,
    },
    guestButtonText: {
      color: colors.primary,
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      width: '100%',
    },
    errorText: {
      color: '#dc2626',
      fontSize: 14,
      textAlign: 'center',
    },
    mockBadge: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 20,
      backgroundColor: colors.warning,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    mockBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    versionText: {
      position: 'absolute',
      bottom: 20,
      fontSize: 12,
      color: colors.textMuted,
    },
    iconBackground: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    googleIcon: {
      width: 20,
      height: 20,
    },
    platformNote: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
    },
    refreshButton: {
      marginTop: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'center',
    },
    refreshButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            <WebIcon name="home" size={50} color={colors.primary} />
          </View>
          <Text style={styles.appTitle}>Family Compass</Text>
          <Text style={styles.tagline}>Guide your family to success</Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <WebIcon name="logo-google" size={20} color="#ffffff" />
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={handleGuestSignIn}
            disabled={loading}
          >
            <WebIcon name="person-outline" size={20} color={colors.primary} />
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
