import React from 'react';
import { Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebIconProps {
  name: string;
  size?: number;
  color?: string;
}

// Unicode fallbacks for web when icons don't load
const unicodeIcons: { [key: string]: string } = {
  home: '🏠',
  list: '📋',
  heart: '💖',
  gift: '🎁',
  trophy: '🏆',
  podium: '🥇',
  settings: '⚙️',
  'chevron-forward': '▶',
  'chevron-back': '◀',
  'add-circle': '➕',
  checkmark: '✅',
  close: '✖',
  star: '⭐',
  'star-outline': '☆',
  person: '👤',
  people: '👥',
  calendar: '📅',
  time: '⏰',
  notifications: '🔔',
  search: '🔍',
  filter: '🔽',
  'ellipsis-vertical': '⋮',
  trash: '🗑️',
  edit: '✏️',
  save: '💾',
  refresh: '🔄',
  download: '⬇️',
  upload: '⬆️',
  share: '📤',
  copy: '📋',
  link: '🔗',
  camera: '📷',
  image: '🖼️',
  document: '📄',
  folder: '📁',
  mail: '✉️',
  phone: '📞',
  location: '📍',
  map: '🗺️',
  car: '🚗',
  airplane: '✈️',
  wifi: '📶',
  bluetooth: '📘',
  battery: '🔋',
  power: '⚡',
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  shield: '🛡️',
  'shield-checkmark': '🛡️',
  warning: '⚠️',
  information: 'ℹ️',
  help: '❓',
  'help-circle': '❓',
  'information-circle': 'ℹ️',
  'warning-outline': '⚠️',
  'checkmark-circle': '✅',
  'close-circle': '❌',
  'notifications-outline': '🔔',
  'language-outline': '🌐',
  'lock-closed-outline': '🔒',
  'add-outline': '➕',
  'remove-outline': '➖',
  play: '▶️',
  pause: '⏸️',
  stop: '⏹️',
  'play-circle': '▶️',
  'pause-circle': '⏸️',
  'stop-circle': '⏹️',
  'volume-high': '🔊',
  'volume-low': '🔉',
  'volume-mute': '🔇',
  'musical-notes': '🎵',
  headset: '🎧',
  microphone: '🎤',
  videocam: '📹',
  'videocam-off': '🚫',
  'mic-off': '🔇',
  flashlight: '🔦',
  sunny: '☀️',
  moon: '🌙',
  cloudy: '☁️',
  rainy: '🌧️',
  snow: '❄️',
  thermometer: '🌡️',
  umbrella: '☂️',
  rainbow: '🌈'
};

export const WebIcon: React.FC<WebIconProps> = ({ name, size = 24, color = '#000' }) => {
  // Try to render the Ionicon first
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} />;
  }

  // For web, try Ionicons first, but have fallback
  try {
    return <Ionicons name={name as any} size={size} color={color} />;
  } catch (error) {
    // Fallback to Unicode emoji if Ionicons fails
    const unicode = unicodeIcons[name] || '⚫';
    return (
      <Text style={{ 
        fontSize: size * 0.8, 
        color: color,
        textAlign: 'center',
        lineHeight: size,
        width: size,
        height: size,
      }}>
        {unicode}
      </Text>
    );
  }
};

export default WebIcon;