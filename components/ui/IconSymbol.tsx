// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, Text, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

// Common icon mappings for web fallback
const WEB_ICON_FALLBACKS: { [key: string]: string } = {
  'house.fill': '🏠',
  'paperplane.fill': '📧',
  'chevron.left.forwardslash.chevron.right': '💻',
  'chevron.right': '▶',
  'home': '🏠',
  'list': '📋',
  'heart': '💖',
  'gift': '🎁',
  'trophy': '🏆',
  'settings': '⚙️',
  'person': '👤',
  'people': '👥',
  'add-circle': '➕',
  'checkmark': '✅',
  'close': '✖',
  'search': '🔍',
  'notifications': '🔔',
  'calendar': '📅'
};

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 * Falls back to Unicode emojis on web if vector icons fail to load.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Web fallback with error handling
  if (Platform.OS === 'web') {
    try {
      return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
    } catch (error) {
      // Fallback to emoji if MaterialIcons fails
      const fallbackEmoji = WEB_ICON_FALLBACKS[name] || WEB_ICON_FALLBACKS[MAPPING[name]] || '⚫';
      return (
        <Text style={[
          {
            fontSize: size * 0.8,
            color: color,
            textAlign: 'center',
            lineHeight: size,
            width: size,
            height: size,
          },
          style
        ]}>
          {fallbackEmoji}
        </Text>
      );
    }
  }
  
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
