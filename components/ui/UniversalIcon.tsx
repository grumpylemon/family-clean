import React, { useState, useEffect } from 'react';
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
 * Checks if Ionicons font is properly loaded by testing if it renders correctly
 */
function checkIoniconsAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      resolve(true);
      return;
    }

    // Check if font is loaded by creating a test element
    const testElement = document.createElement('div');
    testElement.style.fontFamily = 'Ionicons';
    testElement.style.fontSize = '24px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.innerHTML = '&#xf11c;'; // test character
    
    document.body.appendChild(testElement);
    
    // Check if font loaded by measuring width
    const fallbackWidth = testElement.offsetWidth;
    
    // Wait for fonts to potentially load
    setTimeout(() => {
      const loadedWidth = testElement.offsetWidth;
      document.body.removeChild(testElement);
      
      // If width changed, font is likely loaded
      resolve(loadedWidth !== fallbackWidth);
    }, 100);
  });
}

/**
 * Universal icon component that works reliably across all platforms
 * Uses proper font loading detection on web and falls back to emoji when icons fail to load
 */
export const UniversalIcon: React.FC<UniversalIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style 
}) => {
  const [useEmoji, setUseEmoji] = useState(false);
  const [isChecking, setIsChecking] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      checkIoniconsAvailable().then((available) => {
        setUseEmoji(!available);
        setIsChecking(false);
      });
    }
  }, []);

  // On native platforms, always use Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }

  // On web, while checking or if should use emoji
  if (isChecking || useEmoji) {
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

  // On web with fonts available, use Ionicons
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
};

export default UniversalIcon;