import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  showPercentage?: boolean;
  colors?: {
    background: string;
    progress: string[];
  };
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 60,
  strokeWidth = 6,
  progress,
  showPercentage = true,
  colors = {
    background: '#f9a8d4',
    progress: ['#ef4444', '#f59e0b', '#10b981'] // Red to Yellow to Green
  }
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);
  
  // Calculate color based on progress (speedometer style)
  const getProgressColor = (progress: number): string => {
    if (progress < 0.5) {
      // Red to Yellow (0% to 50%)
      return colors.progress[0]; // Red for low progress
    } else if (progress < 0.8) {
      // Yellow (50% to 80%)
      return colors.progress[1]; // Yellow for medium progress
    } else {
      // Green (80% to 100%)
      return colors.progress[2]; // Green for high progress
    }
  };

  const progressColor = getProgressColor(progress);
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.background}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {showPercentage && (
        <View style={styles.textContainer}>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});