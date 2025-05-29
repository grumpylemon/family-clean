import React from 'react';
import { Platform, Text, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface UniversalIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle | ViewStyle>;
}

// Comprehensive emoji fallbacks for web when vector icons fail to load
const EMOJI_FALLBACKS: { [key: string]: string } = {
  // Navigation & UI
  'home': '🏠',
  'house': '🏠',
  'menu': '☰',
  'list': '📋',
  'grid': '⊞',
  'search': '🔍',
  'filter': '🔽',
  'settings': '⚙️',
  'chevron-forward': '▶',
  'chevron-back': '◀',
  'chevron-up': '▲',
  'chevron-down': '▼',
  'arrow-forward': '→',
  'arrow-back': '←',
  'arrow-up': '↑',
  'arrow-down': '↓',
  
  // Actions
  'add': '➕',
  'add-circle': '➕',
  'remove': '➖',
  'remove-circle': '➖',
  'close': '✖',
  'close-circle': '❌',
  'checkmark': '✅',
  'checkmark-circle': '✅',
  'log-out-outline': '👋',
  'log-out': '👋',
  'edit': '✏️',
  'create': '✏️',
  'save': '💾',
  'download': '⬇️',
  'upload': '⬆️',
  'share': '📤',
  'copy': '📋',
  'refresh': '🔄',
  'sync': '🔄',
  'reload': '🔄',
  
  // People & Social
  'person': '👤',
  'people': '👥',
  'person-add': '👤➕',
  'person-remove': '👤➖',
  'contact': '👤',
  'account': '👤',
  'profile': '👤',
  
  // Communication
  'mail': '✉️',
  'email': '✉️',
  'call': '📞',
  'phone': '📞',
  'chat': '💬',
  'chatbubble': '💬',
  'notifications': '🔔',
  'notifications-outline': '🔔',
  'alert': '⚠️',
  'warning': '⚠️',
  'information': 'ℹ️',
  'help': '❓',
  'help-circle': '❓',
  
  // Media & Files
  'camera': '📷',
  'image': '🖼️',
  'images': '🖼️',
  'document': '📄',
  'documents': '📄',
  'folder': '📁',
  'folder-open': '📂',
  'file': '📄',
  'attach': '📎',
  'link': '🔗',
  
  // Time & Calendar
  'calendar': '📅',
  'calendar-outline': '📅',
  'time': '⏰',
  'clock': '🕐',
  'timer': '⏱️',
  'stopwatch': '⏱️',
  'alarm': '⏰',
  'today': '📅',
  
  // Entertainment & Rewards
  'heart': '💖',
  'heart-outline': '🤍',
  'star': '⭐',
  'star-outline': '☆',
  'trophy': '🏆',
  'medal': '🏅',
  'gift': '🎁',
  'ribbon': '🎀',
  'diamond': '💎',
  'sparkles': '✨',
  
  // Technology
  'wifi': '📶',
  'bluetooth': '📘',
  'battery': '🔋',
  'power': '⚡',
  'flash': '⚡',
  'flashlight': '🔦',
  'bulb': '💡',
  'desktop': '🖥️',
  'laptop': '💻',
  'phone-portrait': '📱',
  'tablet': '📱',
  
  // Security & Privacy
  'lock': '🔒',
  'unlock': '🔓',
  'key': '🔑',
  'shield': '🛡️',
  'shield-checkmark': '🛡️',
  'eye': '👁️',
  'eye-off': '🙈',
  'fingerprint': '👆',
  
  // Status & Indicators
  'radio-button-on': '🔘',
  'radio-button-off': '⚪',
  'checkbox': '☑️',
  'checkbox-outline': '☐',
  'checkmark-done-outline': '✅',
  'toggle': '🔘',
  'ellipsis-horizontal': '⋯',
  'ellipsis-vertical': '⋮',
  'more': '⋯',
  'hand-right': '👉',
  'lock-closed': '🔒',
  'information-circle-outline': 'ℹ️',
  'person-outline': '👤',
  'calendar-outline': '📅',
  
  // Transportation & Location
  'location': '📍',
  'pin': '📍',
  'map': '🗺️',
  'navigate': '🧭',
  'compass': '🧭',
  'car': '🚗',
  'bus': '🚌',
  'train': '🚊',
  'airplane': '✈️',
  'walk': '🚶',
  'bicycle': '🚴',
  
  // Weather & Nature
  'sunny': '☀️',
  'moon': '🌙',
  'cloud': '☁️',
  'cloudy': '☁️',
  'rain': '🌧️',
  'rainy': '🌧️',
  'snow': '❄️',
  'thunderstorm': '⛈️',
  'wind': '💨',
  'rainbow': '🌈',
  'umbrella': '☂️',
  'thermometer': '🌡️',
  
  // Business & Finance
  'business': '🏢',
  'storefront': '🏪',
  'card': '💳',
  'wallet': '👛',
  'cash': '💰',
  'calculator': '🧮',
  'receipt': '🧾',
  'trending-up': '📈',
  'trending-down': '📉',
  'stats': '📊',
  'analytics': '📊',
  
  // Gaming & Fun
  'game-controller': '🎮',
  'dice': '🎲',
  'puzzle': '🧩',
  'balloon': '🎈',
  'party': '🎉',
  'celebration': '🎊',
  'confetti': '🎊',
  'fireworks': '🎆',
  
  // Tools & Objects
  'hammer': '🔨',
  'wrench': '🔧',
  'screwdriver': '🪛',
  'gear': '⚙️',
  'cog': '⚙️',
  'tool': '🔧',
  'brush': '🖌️',
  'paint': '🎨',
  'scissors': '✂️',
  'magnet': '🧲',
  
  // Default fallback
  'default': '⚫'
};

/**
 * Universal icon component that works reliably across all platforms
 * Uses Ionicons on native platforms and falls back to emoji on web if icons fail to load
 */
export const UniversalIcon: React.FC<UniversalIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style 
}) => {
  // On web, use emoji fallback system for reliability
  if (Platform.OS === 'web') {
    try {
      // First try to render the Ionicon
      return <Ionicons name={name as any} size={size} color={color} style={style} />;
    } catch (error) {
      // Fallback to emoji if Ionicons fails to load
      const emoji = EMOJI_FALLBACKS[name] || EMOJI_FALLBACKS['default'];
      return (
        <Text 
          style={[
            {
              fontSize: size * 0.8,
              color: color,
              textAlign: 'center',
              lineHeight: size,
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            style
          ]}
        >
          {emoji}
        </Text>
      );
    }
  }
  
  // On native platforms, use Ionicons directly
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
};

export default UniversalIcon;