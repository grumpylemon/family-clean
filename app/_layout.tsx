// Import version logging first thing
import '../constants/Version';

import { initializeFirebase, isMockImplementation } from '@/config/firebase';
import { AuthProvider } from '@/contexts/AuthContext';
import { FamilyProvider } from '@/contexts/FamilyContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { StoreProvider } from '@/stores/StoreProvider';
import { MockModeIndicator, EnvironmentInfo } from '@/components/MockModeIndicator';
import { notificationService } from '@/services/notificationService';

// Inline polyfill to ensure it runs before any module evaluation
if (typeof window !== 'undefined') {
  (function() {
    const importMetaPolyfill = {
      url: window.location?.href || 'http://localhost:8081',
      env: {
        MODE: 'production',
        DEV: false,
        PROD: true,
        SSR: false
      }
    };
    
    if (!window.import) {
      Object.defineProperty(window, 'import', {
        value: { meta: importMetaPolyfill },
        writable: false,
        configurable: true
      });
    }
    
    if (typeof globalThis !== 'undefined' && !globalThis.import) {
      globalThis.import = window.import;
    }
  })();
}
// We've moved the Firebase import into the explicit initialization

// Version tracking for updates
console.log("App Layout version: v6 - Zustand Integration");

// Feature flag to test Zustand migration
const USE_ZUSTAND_ONLY = false; // Set to true to use Zustand exclusively

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Firebase on app start (only on client side)
  useEffect(() => {
    if (!isClient) return;
    
    const initFirebase = async () => {
      try {
        // Initialize Firebase - this will handle mock mode detection
        await initializeFirebase();
        setFirebaseInitialized(true);
        
        // Log platform and mock status for debugging
        console.log(`App running on platform: ${Platform.OS}`);
        console.log(`Using mock Firebase: ${isMockImplementation()}`);
        console.log(`Firebase initialization completed successfully`);
        
        // For iOS, we deliberately use mock implementation due to Expo Go limitations
        if (Platform.OS === 'ios') {
          console.log('iOS detected, using mock Firebase implementation for compatibility');
        }
        
        // Initialize notification service after Firebase is ready
        // We'll initialize this when user is authenticated (in auth slice)
        console.log('App layout initialized, notification service ready for auth');
      } catch (error) {
        console.error('Firebase initialization failed:', error);
        // Try to initialize notifications anyway for fallback
        console.log('Attempting notification service initialization despite Firebase error');
      }
    };
    
    initFirebase();
  }, [isClient]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return null;
  }

  // Create the app content
  const appContent = (
    <ToastProvider>
      <RootLayoutNav firebaseStatus={firebaseInitialized} />
      <StatusBar style="auto" />
      {/* Mock Mode Indicator - appears when using mock Firebase */}
      <MockModeIndicator position="top" />
      {/* Environment Debug Info - development only */}
      {__DEV__ && <EnvironmentInfo />}
    </ToastProvider>
  );

  // Conditionally wrap with context providers based on feature flag
  const wrappedContent = USE_ZUSTAND_ONLY ? (
    appContent
  ) : (
    <AuthProvider>
      <FamilyProvider>
        {appContent}
      </FamilyProvider>
    </AuthProvider>
  );

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('App crashed with error:', error);
      console.error('Error stack:', error.stack);
      console.error('Component stack:', errorInfo.componentStack);
    }}>
      <StoreProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {wrappedContent}
        </ThemeProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav({ firebaseStatus }: { firebaseStatus: boolean }) {
  const colorScheme = useColorScheme();

  // Log Firebase status again when the navigation component mounts
  useEffect(() => {
    console.log(`Navigation component mounted, Firebase initialized: ${firebaseStatus}`);
  }, [firebaseStatus]);

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
