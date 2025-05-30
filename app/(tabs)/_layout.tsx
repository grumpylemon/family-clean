import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { WebIcon } from '../../components/ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';

// Version tracking for updates
console.log("Tabs Layout version: v3.1 - Dark Mode Support");

export default function TabLayout() {
  const { user } = useAuth();
  const { colors, theme, isLoading: themeLoading } = useTheme();

  // Show nothing while theme is loading to prevent style errors
  if (themeLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.divider,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 60,
          shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: theme === 'dark' ? 0.3 : 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          title: 'Chores',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="heart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="gift" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="trophy" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaders"
        options={{
          title: 'Leaders',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="podium" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <WebIcon name="settings" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null, // Hide this tab - admin moved to Settings
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide this tab - family management moved to admin
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
  );
}
