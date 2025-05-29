import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateLevel } from '@/services/gamification';

interface XPProgressBarProps {
  currentXP: number;
  showLevel?: boolean;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP = 0,
  showLevel = true,
  showProgress = true,
  size = 'medium',
  style
}) => {
  const { level, title, xpToNext } = calculateLevel(currentXP);
  
  // Calculate progress percentage for current level
  const levelConfigs = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 100 },
    { level: 3, xpRequired: 250 },
    { level: 4, xpRequired: 500 },
    { level: 5, xpRequired: 850 },
    { level: 6, xpRequired: 1300 },
    { level: 7, xpRequired: 1850 },
    { level: 8, xpRequired: 2500 },
    { level: 9, xpRequired: 3250 },
    { level: 10, xpRequired: 4100 },
  ];
  
  const currentLevelConfig = levelConfigs.find(config => config.level === level);
  const nextLevelConfig = levelConfigs.find(config => config.level === level + 1);
  
  let progressPercentage = 1; // Default to 100% if max level
  
  if (nextLevelConfig && currentLevelConfig) {
    const xpInCurrentLevel = currentXP - currentLevelConfig.xpRequired;
    const xpNeededForLevel = nextLevelConfig.xpRequired - currentLevelConfig.xpRequired;
    progressPercentage = Math.min(xpInCurrentLevel / xpNeededForLevel, 1);
  }

  const sizeStyles = {
    small: {
      height: 6,
      borderRadius: 3,
      fontSize: 12,
      spacing: 4
    },
    medium: {
      height: 8,
      borderRadius: 4,
      fontSize: 14,
      spacing: 6
    },
    large: {
      height: 12,
      borderRadius: 6,
      fontSize: 16,
      spacing: 8
    }
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, style]}>
      {showLevel && (
        <View style={[styles.levelInfo, { marginBottom: currentSize.spacing }]}>
          <Text style={[styles.levelText, { fontSize: currentSize.fontSize }]}>
            Level {level}
          </Text>
          <Text style={[styles.titleText, { fontSize: currentSize.fontSize - 2 }]}>
            {title}
          </Text>
        </View>
      )}
      
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { 
            height: currentSize.height, 
            borderRadius: currentSize.borderRadius 
          }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage * 100}%`,
                  height: currentSize.height,
                  borderRadius: currentSize.borderRadius
                }
              ]} 
            />
          </View>
          
          {level < 10 && (
            <Text style={[styles.xpText, { 
              fontSize: currentSize.fontSize - 2,
              marginTop: currentSize.spacing / 2
            }]}>
              {Math.round(xpToNext)} XP to next level
            </Text>
          )}
          
          {level >= 10 && (
            <Text style={[styles.maxLevelText, { 
              fontSize: currentSize.fontSize - 2,
              marginTop: currentSize.spacing / 2
            }]}>
              Maximum level reached! 🎉
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontWeight: '700',
    color: '#831843', // Pink theme text
  },
  titleText: {
    fontWeight: '600',
    color: '#9f1239', // Secondary pink
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    backgroundColor: '#fbcfe8', // Light pink background
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#be185d', // Primary pink
    borderRadius: 4,
  },
  xpText: {
    color: '#831843',
    fontWeight: '500',
    textAlign: 'center',
  },
  maxLevelText: {
    color: '#10b981', // Success green
    fontWeight: '600',
    textAlign: 'center',
  },
});