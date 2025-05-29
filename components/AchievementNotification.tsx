import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Achievement } from '@/types';

interface AchievementNotificationProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const scaleValue = new Animated.Value(0);
  const sparkleOpacity = new Animated.Value(0);

  useEffect(() => {
    if (visible && achievement) {
      // Start entrance animation
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleValue.setValue(0);
      sparkleOpacity.setValue(0);
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { transform: [{ scale: scaleValue }] }]}>
          {/* Sparkle effects */}
          <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>⭐</Text>
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle3, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>🌟</Text>
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle4, { opacity: sparkleOpacity }]}>
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>

          {/* Main content */}
          <View style={styles.header}>
            <Text style={styles.celebrationText}>🏆</Text>
            <Text style={styles.title}>Achievement Unlocked!</Text>
          </View>

          <View style={styles.achievementCard}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            
            <View style={styles.xpReward}>
              <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Awesome! 🎉</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fdf2f8',
    borderRadius: 24,
    padding: 24,
    width: width * 0.9,
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 10,
    left: 20,
  },
  sparkle2: {
    top: 20,
    right: 30,
  },
  sparkle3: {
    bottom: 30,
    left: 30,
  },
  sparkle4: {
    bottom: 20,
    right: 20,
  },
  sparkleText: {
    fontSize: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    textAlign: 'center',
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#9f1239',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  xpReward: {
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    backgroundColor: '#be185d',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
});