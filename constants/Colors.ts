/**
 * Pink-themed color system for Family Compass
 * Includes comprehensive light and dark mode palettes
 */

// Light mode colors (existing pink theme)
const lightColors = {
  // Background colors
  background: '#fdf2f8',
  surface: '#ffffff',
  
  // Primary pink colors
  primary: '#be185d',
  primaryLight: '#f9a8d4',
  primaryDark: '#831843',
  
  // Text colors
  text: '#831843',
  textSecondary: '#9f1239',
  textMuted: '#6b7280',
  
  // Accent colors
  accent: '#fbcfe8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // UI elements
  border: '#f9a8d4',
  divider: '#fbcfe8',
  
  // Tab bar
  tabIconDefault: '#9f1239',
  tabIconSelected: '#be185d',
  tabBarBackground: '#ffffff',
  
  // Cards and surfaces
  cardBackground: '#ffffff',
  cardShadow: 'rgba(190, 24, 93, 0.08)',
};

// Dark mode colors (new pink-themed dark palette)
const darkColors = {
  // Background colors
  background: '#1a0a0f', // Very dark with pink tint
  surface: '#2d1520', // Dark surface with pink undertone
  
  // Primary pink colors
  primary: '#f9a8d4', // Lighter pink for dark mode
  primaryLight: '#fbcfe8',
  primaryDark: '#be185d',
  
  // Text colors
  text: '#fbcfe8', // Light pink text
  textSecondary: '#f9a8d4',
  textMuted: '#9f7086',
  
  // Accent colors
  accent: '#be185d',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#60a5fa',
  
  // UI elements
  border: '#4a1f35',
  divider: '#3d1a2b',
  
  // Tab bar
  tabIconDefault: '#9f7086',
  tabIconSelected: '#f9a8d4',
  tabBarBackground: '#2d1520',
  
  // Cards and surfaces
  cardBackground: '#2d1520',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

// Helper function to get colors based on theme
export const getThemeColors = (isDark: boolean) => {
  return isDark ? darkColors : lightColors;
};

// Common colors that don't change with theme
export const CommonColors = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  
  // Status colors (same in both themes)
  online: '#10b981',
  offline: '#ef4444',
  away: '#f59e0b',
  
  // Difficulty colors
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};
