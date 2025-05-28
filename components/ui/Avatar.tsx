import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  photoURL?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  showStatus?: boolean;
  isActive?: boolean;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  photoURL,
  name = '',
  size = 40,
  style,
  showStatus = false,
  isActive = true,
  isOnline = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderContent = () => {
    if (photoURL && !imageError) {
      return (
        <Image
          source={{ uri: photoURL }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          onError={() => setImageError(true)}
        />
      );
    }

    // Fallback to initials
    const initials = getInitials(name);
    const fontSize = size * 0.4;

    return (
      <View
        style={[
          styles.initialsContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
    );
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      {renderContent()}
      
      {showStatus && (
        <View
          style={[
            styles.statusDot,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              right: -2,
              bottom: -2,
              backgroundColor: isActive ? (isOnline ? '#10b981' : '#f59e0b') : '#ef4444',
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f9a8d4',
  },
  initialsContainer: {
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#831843',
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

// Group Avatar Component for displaying multiple avatars
interface AvatarGroupProps {
  users: Array<{
    uid: string;
    name: string;
    photoURL?: string | null;
    isActive?: boolean;
  }>;
  maxDisplay?: number;
  size?: number;
  spacing?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  maxDisplay = 3,
  size = 32,
  spacing = -8,
}) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = Math.max(0, users.length - maxDisplay);

  return (
    <View style={styles.groupContainer}>
      {displayUsers.map((user, index) => (
        <View
          key={user.uid}
          style={[
            styles.groupAvatar,
            {
              marginLeft: index === 0 ? 0 : spacing,
              zIndex: displayUsers.length - index,
            },
          ]}
        >
          <Avatar
            photoURL={user.photoURL}
            name={user.name}
            size={size}
            isActive={user.isActive}
          />
        </View>
      ))}
      
      {remainingCount > 0 && (
        <View
          style={[
            styles.groupAvatar,
            styles.remainingCount,
            {
              marginLeft: spacing,
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text style={styles.remainingText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

const groupStyles = StyleSheet.create({
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 999,
    overflow: 'hidden',
  },
  remainingCount: {
    backgroundColor: '#be185d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});