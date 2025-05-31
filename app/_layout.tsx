// Import version logging first thing
import '../constants/Version';

import { initializeFirebase, isMockImplementation } from '../config/firebase';
import { AuthProvider } from '../contexts/AuthContext';
import { FamilyProvider } from '../contexts/FamilyContext';
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ToastProvider } from '../components/ui/Toast';
import { StoreProvider } from '../stores/StoreProvider';
import { MockModeIndicator, EnvironmentInfo } from '../components/MockModeIndicator';
import { notificationService } from '../services/notificationService';
import { initializeSentry } from '../config/sentry';

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
const USE_ZUSTAND_ONLY = true; // Using Zustand exclusively to prevent duplicate context initialization

export default function RootLayout() {
  console.log('=== FAMILY COMPASS STARTUP - ROOTLAYOUT BEGIN ===');
  console.log('Platform.OS:', Platform.OS);
  console.log('__DEV__:', __DEV__);
  console.log('Environment variables check:', {
    EXPO_PUBLIC_USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK,
    NODE_ENV: process.env.NODE_ENV
  });

  const colorScheme = useColorScheme();
  console.log('Color scheme initialized:', colorScheme);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  console.log('Fonts loaded:', loaded);
  
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  console.log('State initialized - firebaseInitialized:', firebaseInitialized, 'isClient:', isClient);

  // Initialize client-side state to prevent hydration mismatch
  useEffect(() => {
    console.log('=== CLIENT INITIALIZATION EFFECT STARTED ===');
    setIsClient(true);
    console.log('Client state set to true');
    
    // Initialize Sentry first (if in production) - wrapped in try/catch for safety
    console.log('Starting Sentry initialization...');
    try {
      initializeSentry()
        .then(() => {
          console.log('Sentry initialization completed successfully');
        })
        .catch(error => {
          console.warn('Failed to initialize Sentry:', error);
          console.warn('Sentry error stack:', error?.stack);
        });
    } catch (error) {
      console.warn('Sentry initialization synchronous error:', error);
      console.warn('Sentry sync error stack:', error?.stack);
    }
    
    // Set up global error handlers for unhandled promises
    if (typeof window !== 'undefined') {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const error = event.reason;
        
        // Handle specific types of errors silently
        if (error && error.name === 'NetworkError') {
          console.warn('Network error occurred (likely from Firebase):', error.message || 'Unknown network error');
          event.preventDefault();
          return;
        }
        
        if (error && error.message && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed') ||
          error.message.includes('auth/network-request-failed')
        )) {
          console.warn('Network request failed, likely temporary:', error.message);
          event.preventDefault();
          return;
        }
        
        // Log other unhandled rejections
        console.error('Unhandled promise rejection:', error);
        event.preventDefault();
      };
      
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  // Initialize Firebase on app start (only on client side)
  useEffect(() => {
    console.log('=== FIREBASE INITIALIZATION EFFECT STARTED ===');
    console.log('isClient status:', isClient);
    if (!isClient) {
      console.log('Skipping Firebase init - not client side yet');
      return;
    }
    
    const initFirebase = async () => {
      console.log('=== FIREBASE ASYNC INITIALIZATION STARTING ===');
      try {
        console.log('About to call initializeFirebase()...');
        // Initialize Firebase - this will handle mock mode detection
        await initializeFirebase();
        console.log('Firebase initialization completed, setting state...');
        setFirebaseInitialized(true);
        console.log('Firebase state set to true');
        
        // Log platform and mock status for debugging
        console.log(`App running on platform: ${Platform.OS}`);
        console.log(`Using mock Firebase: ${isMockImplementation()}`);
        console.log(`Firebase initialization completed successfully`);
        
        // Check for redirect result on web platform
        if (Platform.OS === 'web' && !isMockImplementation()) {
          try {
            // Dynamically import to avoid bundling issues
            const { auth } = await import('../config/firebase');
            const { getRedirectResult } = await import('firebase/auth');
            
            console.log('Checking for authentication redirect result...');
            const redirectResult = await getRedirectResult(auth);
            
            if (redirectResult?.user) {
              console.log('User authenticated via redirect:', redirectResult.user.email);
            }
          } catch (redirectError) {
            console.warn('Error checking redirect result on startup:', redirectError);
            // This is not critical, continue with normal flow
          }
        }
        
        // For iOS, we deliberately use mock implementation due to Expo Go limitations
        if (Platform.OS === 'ios') {
          console.log('iOS detected, using mock Firebase implementation for compatibility');
        }
        
        // Initialize notification service after Firebase is ready
        // We'll initialize this when user is authenticated (in auth slice)
        console.log('App layout initialized, notification service ready for auth');
      } catch (error) {
        console.error('=== FIREBASE INITIALIZATION FAILED ===');
        console.error('Firebase error:', error);
        console.error('Firebase error type:', typeof error);
        console.error('Firebase error stack:', error?.stack);
        console.error('Firebase error message:', error?.message);
        console.error('Firebase error code:', error?.code);
        // Try to initialize notifications anyway for fallback
        console.log('Attempting notification service initialization despite Firebase error');
      }
    };
    
    console.log('About to call initFirebase() function...');
    initFirebase().catch(error => {
      console.error('=== UNHANDLED FIREBASE INIT ERROR ===');
      console.error('Unhandled Firebase init error:', error);
      console.error('Unhandled error stack:', error?.stack);
    });
  }, [isClient]);

  if (!loaded) {
    console.log('Fonts not loaded yet, showing loading state');
    // Async font loading only occurs in development.
    return null;
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    console.log('Not client-side yet, showing loading state');
    return null;
  }

  console.log('=== RENDERING APP CONTENT ===');
  console.log('Fonts loaded:', loaded);
  console.log('Client ready:', isClient);
  console.log('Firebase initialized:', firebaseInitialized);

  // Create the app content with enhanced error protection
  let appContent;
  try {
    console.log('Creating app content components...');
    appContent = (
      <ToastProvider>
        <RootLayoutNav firebaseStatus={firebaseInitialized} />
        <StatusBar style="auto" />
        {/* Mock Mode Indicator - appears when using mock Firebase */}
        <MockModeIndicator position="top" />
        {/* Environment Debug Info - development only */}
        {__DEV__ && <EnvironmentInfo />}
      </ToastProvider>
    );
    console.log('App content created successfully');
  } catch (error) {
    console.error('=== FAILED TO CREATE APP CONTENT ===');
    console.error('App content creation error:', error);
    console.error('Error stack:', error?.stack);
    // Fallback to minimal content
    appContent = (
      <ToastProvider>
        <RootLayoutNav firebaseStatus={firebaseInitialized} />
        <StatusBar style="auto" />
      </ToastProvider>
    );
  }

  // Conditionally wrap with context providers based on feature flag
  let wrappedContent;
  try {
    console.log('Wrapping content with providers...');
    wrappedContent = USE_ZUSTAND_ONLY ? (
      appContent
    ) : (
      <AuthProvider>
        <FamilyProvider>
          {appContent}
        </FamilyProvider>
      </AuthProvider>
    );
    console.log('Content wrapped successfully');
  } catch (error) {
    console.error('=== FAILED TO WRAP CONTENT ===');
    console.error('Content wrapping error:', error);
    console.error('Error stack:', error?.stack);
    wrappedContent = appContent; // Fallback to unwrapped content
  }

  try {
    console.log('=== RETURNING FINAL APP COMPONENT ===');
    return (
      <ErrorBoundary onError={(error, errorInfo) => {
        console.error('=== APP CRASHED IN ERROR BOUNDARY ===');
        console.error('App crashed with error:', error);
        console.error('Error stack:', error.stack);
        console.error('Component stack:', errorInfo.componentStack);
        console.error('==========================================');
      }}>
        <StoreProvider>
          <CustomThemeProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {wrappedContent}
            </ThemeProvider>
          </CustomThemeProvider>
        </StoreProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('=== CRITICAL: FAILED TO RETURN APP COMPONENT ===');
    console.error('Final return error:', error);
    console.error('Error stack:', error?.stack);
    // This should never happen, but provide absolute fallback
    return null;
  }
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
