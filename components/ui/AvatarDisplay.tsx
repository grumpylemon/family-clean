import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { UserAvatar } from '../../types';
import { avatarService } from '../../services/avatarService';
import { useColorScheme } from '../../hooks/useColorScheme';

interface AvatarDisplayProps {
  avatar?: UserAvatar | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
  fallbackInitials?: string;
  onError?: () => void;
}

const SIZES = {
  small: 32,
  medium: 40,
  large: 64,
  xlarge: 96
};

export function AvatarDisplay({
  avatar,
  size = 'medium',
  style,
  showBorder = true,
  borderColor,
  fallbackInitials,
  onError
}: AvatarDisplayProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const avatarSize = SIZES[size];
  const avatarUrl = avatarService.getAvatarUrl(avatar);
  
  const styles = createStyles(isDark, avatarSize, showBorder, borderColor);

  const handleImageError = () => {
    onError?.();
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: avatarUrl }}
        style={styles.image}
        onError={handleImageError}
        accessibilityRole="image"
        accessibilityLabel="User avatar"
      />
      {fallbackInitials && (
        <View style={styles.initialsOverlay}>
          <Text style={styles.initialsText}>{fallbackInitials}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (
  isDark: boolean,
  size: number,
  showBorder: boolean,
  borderColor?: string
) => StyleSheet.create({
  container: {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    ...(showBorder && {
      borderWidth: 2,
      borderColor: borderColor || (isDark ? '#f9a8d4' : '#be185d'),
    }),
    shadowColor: isDark ? '#000000' : '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: size / 2,
  },
  initialsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
  },
  initialsText: {
    fontSize: size * 0.4,
    fontWeight: '700',
    color: isDark ? '#f9a8d4' : '#be185d',
    textAlign: 'center',
  },
});