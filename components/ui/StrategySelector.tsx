import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { WebIcon } from './WebIcon';
import { useTheme } from '../../contexts/ThemeContext';

export type RotationStrategy = 
  | 'round_robin'
  | 'workload_balance'
  | 'skill_based'
  | 'calendar_aware'
  | 'random_fair'
  | 'preference_based'
  | 'mixed_strategy';

interface StrategyOption {
  id: RotationStrategy;
  name: string;
  description: string;
  icon: string;
  color: string;
  complexity: 'Simple' | 'Moderate' | 'Advanced';
}

interface StrategySelectorProps {
  selectedStrategy: RotationStrategy;
  onSelect: (strategy: RotationStrategy) => void;
  disabled?: boolean;
  compact?: boolean;
}

const strategies: StrategyOption[] = [
  {
    id: 'round_robin',
    name: 'Round Robin',
    description: 'Simple rotation where each member takes turns',
    icon: 'refresh',
    color: '#10b981',
    complexity: 'Simple',
  },
  {
    id: 'workload_balance',
    name: 'Workload Balance',
    description: 'Distributes based on current workload and capacity',
    icon: 'scales',
    color: '#f59e0b',
    complexity: 'Moderate',
  },
  {
    id: 'skill_based',
    name: 'Skill-Based',
    description: 'Assigns based on member skills and certifications',
    icon: 'star',
    color: '#8b5cf6',
    complexity: 'Advanced',
  },
  {
    id: 'calendar_aware',
    name: 'Calendar-Aware',
    description: 'Considers availability and schedule conflicts',
    icon: 'calendar',
    color: '#06b6d4',
    complexity: 'Advanced',
  },
  {
    id: 'random_fair',
    name: 'Random Fair',
    description: 'Random assignment with fairness constraints',
    icon: 'shuffle',
    color: '#ef4444',
    complexity: 'Simple',
  },
  {
    id: 'preference_based',
    name: 'Preference-Based',
    description: 'Prioritizes member preferences while maintaining fairness',
    icon: 'heart',
    color: '#ec4899',
    complexity: 'Moderate',
  },
  {
    id: 'mixed_strategy',
    name: 'Mixed Strategy',
    description: 'Combines multiple strategies with custom weights',
    icon: 'options',
    color: '#be185d',
    complexity: 'Advanced',
  },
];

export default function StrategySelector({ 
  selectedStrategy, 
  onSelect, 
  disabled = false,
  compact = false 
}: StrategySelectorProps) {
  const { colors, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: compact ? 8 : 12,
    },
    strategyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: compact ? 12 : 16,
      padding: compact ? 12 : 16,
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    strategyOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: theme === 'dark' ? colors.surface : colors.accent,
    },
    strategyIcon: {
      width: compact ? 40 : 48,
      height: compact ? 40 : 48,
      borderRadius: compact ? 20 : 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    strategyContent: {
      flex: 1,
    },
    strategyName: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: compact ? 2 : 4,
    },
    strategyDescription: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      lineHeight: compact ? 16 : 20,
    },
    complexityBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: compact ? 4 : 6,
    },
    complexityText: {
      fontSize: 10,
      fontWeight: '600',
    },
    selectedIndicator: {
      marginLeft: 8,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: compact ? 12 : 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return { bg: '#10b98120', text: '#10b981' };
      case 'Moderate': return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'Advanced': return { bg: '#ef444420', text: '#ef4444' };
      default: return { bg: colors.surface, text: colors.textSecondary };
    }
  };

  return (
    <View style={styles.container}>
      {strategies.map((strategy) => {
        const isSelected = selectedStrategy === strategy.id;
        const complexityColors = getComplexityColor(strategy.complexity);
        
        return (
          <TouchableOpacity
            key={strategy.id}
            style={[
              styles.strategyOption,
              isSelected && styles.strategyOptionSelected,
            ]}
            onPress={() => onSelect(strategy.id)}
            disabled={disabled}
          >
            <View style={[
              styles.strategyIcon,
              { backgroundColor: `${strategy.color}20` }
            ]}>
              <WebIcon 
                name={strategy.icon} 
                size={compact ? 20 : 24} 
                color={strategy.color} 
              />
            </View>
            
            <View style={styles.strategyContent}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
              {!compact && (
                <Text style={styles.strategyDescription}>
                  {strategy.description}
                </Text>
              )}
              <View style={[
                styles.complexityBadge,
                { backgroundColor: complexityColors.bg }
              ]}>
                <Text style={[
                  styles.complexityText,
                  { color: complexityColors.text }
                ]}>
                  {strategy.complexity}
                </Text>
              </View>
            </View>
            
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <WebIcon 
                  name="checkmark-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
            )}
            
            {disabled && (
              <View style={styles.disabledOverlay}>
                <Text style={styles.disabledText}>DISABLED</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}