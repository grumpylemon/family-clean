import React, { useState, useEffect } from 'react';
import { Platform, Text, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebIconProps {
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
  'create-outline': '✏️',
  'home-outline': '🏠',
  'trash-outline': '🗑️',
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
  'people-outline': '👥',
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
  'gift-outline': '🎁',
  'ribbon': '🎀',
  'diamond': '💎',
  'sparkles': '✨',
  'storefront': '🏪',
  'storefront-outline': '🏪',
  'apps-outline': '⊞',
  'crown-outline': '👑',
  'happy-outline': '😊',
  'cash-outline': '💰',
  'phone-portrait-outline': '📱',
  'language-outline': '🌐',
  'rocket': '🚀',
  'flask': '🧪',
  'square-outline': '⬜',
  'checkmark-done-circle': '✅',
  
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
  'server': '🖥️',
  
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
  'lock-closed-outline': '🔒',
  'list-outline': '📋',
  'information-circle-outline': 'ℹ️',
  'person-outline': '👤',
  'person-circle-outline': '👤',
  'settings-outline': '⚙️',
  'shield-outline': '🛡️',
  'code-outline': '💻',
  
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
  
  // Admin Panel Icons  
  'list-circle': '📋',
  
  // Additional icons for admin components
  'volume-mute': '🔇',
  'notifications-off': '🔕',
  'moon-outline': '🌙',
  'sunny-outline': '☀️',
  'contrast': '⚫',
  'vibration': '📳',
  
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
 * Web-optimized icon component that reliably falls back to emoji when vector icons fail
 * Due to font loading issues, we always use emoji on web for maximum reliability
 */
export const WebIcon: React.FC<WebIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style 
}) => {
  // Always use emoji on web to avoid font loading issues
  const emoji = EMOJI_FALLBACKS[name] || EMOJI_FALLBACKS['default'];
  
  // On native platforms, try to use Ionicons first
  if (Platform.OS !== 'web') {
    try {
      return <Ionicons name={name as any} size={size} color={color} style={style} />;
    } catch (error) {
      console.warn(`Icon "${name}" failed to render, using emoji fallback`);
    }
  }

  // Use emoji fallback
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
};

export default WebIcon;