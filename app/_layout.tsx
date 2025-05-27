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
// We've moved the Firebase import into the explicit initialization

// Version tracking for updates
console.log("App Layout version: v5");

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // Initialize Firebase on app start
  useEffect(() => {
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
      } catch (error) {
        console.error('Firebase initialization failed:', error);
      }
    };
    
    initFirebase();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <FamilyProvider>
          <RootLayoutNav firebaseStatus={firebaseInitialized} />
        </FamilyProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
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
