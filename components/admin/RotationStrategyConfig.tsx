import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { WebIcon } from '../ui/WebIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useFamily } from '../../hooks/useZustandHooks';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';

interface RotationStrategyConfigProps {
  enabled: boolean;
}

type RotationStrategy = 
  | 'round_robin'
  | 'workload_balance'
  | 'skill_based'
  | 'calendar_aware'
  | 'random_fair'
  | 'preference_based'
  | 'mixed_strategy';

interface StrategyInfo {
  id: RotationStrategy;
  name: string;
  description: string;
  icon: string;
  color: string;
  complexity: 'Simple' | 'Moderate' | 'Advanced';
  benefits: string[];
  bestFor: string[];
  requirements: string[];
}

interface MixedStrategyWeights {
  fairness: number;
  preference: number;
  availability: number;
  skill: number;
  workload: number;
}

export default function RotationStrategyConfig({ enabled }: RotationStrategyConfigProps) {
  const { colors, theme } = useTheme();
  const { family } = useFamily();
  
  const [selectedStrategy, setSelectedStrategy] = useState<RotationStrategy>('round_robin');
  const [mixedWeights, setMixedWeights] = useState<MixedStrategyWeights>({
    fairness: 25,
    preference: 20,
    availability: 25,
    skill: 15,
    workload: 15,
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Strategy configurations
  const strategies: StrategyInfo[] = [
    {
      id: 'round_robin',
      name: 'Round Robin',
      description: 'Simple rotation where each member takes turns in order',
      icon: 'refresh',
      color: '#10b981',
      complexity: 'Simple',
      benefits: ['Fair turn distribution', 'Predictable assignments', 'Easy to understand'],
      bestFor: ['New families', 'Simple households', 'Equal capability members'],
      requirements: ['Active family members'],
    },
    {
      id: 'workload_balance',
      name: 'Workload Balance',
      description: 'Distributes chores based on current workload and capacity',
      icon: 'scales',
      color: '#f59e0b',
      complexity: 'Moderate',
      benefits: ['Prevents overload', 'Dynamic adjustment', 'Fairness optimization'],
      bestFor: ['Busy families', 'Varying schedules', 'Different capabilities'],
      requirements: ['Member capacity settings'],
    },
    {
      id: 'skill_based',
      name: 'Skill-Based',
      description: 'Assigns chores based on member skills and certifications',
      icon: 'star',
      color: '#8b5cf6',
      complexity: 'Advanced',
      benefits: ['Quality results', 'Skill development', 'Efficient completion'],
      bestFor: ['Diverse skills', 'Complex chores', 'Training focus'],
      requirements: ['Skill certifications', 'Training system'],
    },
    {
      id: 'calendar_aware',
      name: 'Calendar-Aware',
      description: 'Considers member availability and schedule conflicts',
      icon: 'calendar',
      color: '#06b6d4',
      complexity: 'Advanced',
      benefits: ['No conflicts', 'Optimal timing', 'Realistic assignments'],
      bestFor: ['Busy schedules', 'School/work conflicts', 'Time-sensitive chores'],
      requirements: ['Calendar integration', 'Availability data'],
    },
    {
      id: 'random_fair',
      name: 'Random Fair',
      description: 'Random assignment with fairness constraints',
      icon: 'shuffle',
      color: '#ef4444',
      complexity: 'Simple',
      benefits: ['Unpredictable', 'Fair distribution', 'Prevents gaming'],
      bestFor: ['Avoiding patterns', 'Equal members', 'Fairness focus'],
      requirements: ['Fairness monitoring'],
    },
    {
      id: 'preference_based',
      name: 'Preference-Based',
      description: 'Prioritizes member preferences while maintaining fairness',
      icon: 'heart',
      color: '#ec4899',
      complexity: 'Moderate',
      benefits: ['Higher satisfaction', 'Voluntary participation', 'Reduced conflicts'],
      bestFor: ['Strong preferences', 'Motivation focus', 'Happy families'],
      requirements: ['Member preferences', 'Fairness monitoring'],
    },
    {
      id: 'mixed_strategy',
      name: 'Mixed Strategy',
      description: 'Combines multiple strategies with customizable weights',
      icon: 'options',
      color: '#be185d',
      complexity: 'Advanced',
      benefits: ['Maximum flexibility', 'Customizable balance', 'Adaptive system'],
      bestFor: ['Complex needs', 'Experienced users', 'Optimization focus'],
      requirements: ['All strategy data', 'Weight configuration'],
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    strategyCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    strategyCardSelected: {
      borderColor: colors.primary,
      backgroundColor: theme === 'dark' ? colors.surface : colors.accent,
    },
    strategyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    strategyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    strategyInfo: {
      flex: 1,
    },
    strategyName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    strategyComplexity: {
      fontSize: 12,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    strategyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    benefitsList: {
      marginBottom: 12,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    benefitText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    infoGrid: {
      flexDirection: 'row',
      marginTop: 12,
    },
    infoColumn: {
      flex: 1,
      marginRight: 12,
    },
    infoColumnLast: {
      marginRight: 0,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    infoItem: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 4,
      lineHeight: 18,
    },
    mixedStrategyCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginTop: 16,
      shadowColor: theme === 'dark' ? '#000' : colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    mixedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    weightSlider: {
      marginBottom: 20,
    },
    weightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    weightLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    weightValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    weightTrack: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: 4,
      position: 'relative',
    },
    weightFill: {
      height: 8,
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    weightThumb: {
      position: 'absolute',
      top: -8,
      width: 24,
      height: 24,
      backgroundColor: colors.primary,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    totalWeights: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: getTotalWeightsColor(),
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: 24,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    actionButtonSecondary: {
      backgroundColor: colors.surface,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 8,
    },
    actionButtonTextSecondary: {
      color: colors.text,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '600',
      textAlign: 'center',
    },
    previewToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    previewLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
  });

  function getTotalWeightsColor(): string {
    const total = Object.values(mixedWeights).reduce((sum, weight) => sum + weight, 0);
    if (total === 100) return '#10b981';
    if (total < 100) return '#f59e0b';
    return '#ef4444';
  }

  const totalWeights = Object.values(mixedWeights).reduce((sum, weight) => sum + weight, 0);
  const isValidMixedStrategy = totalWeights === 100;

  const handleStrategySelect = (strategy: RotationStrategy) => {
    if (!enabled) return;
    setSelectedStrategy(strategy);
  };

  const handleWeightChange = (key: keyof MixedStrategyWeights, value: number) => {
    if (!enabled) return;
    setMixedWeights(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value))
    }));
  };

  const handleSaveStrategy = async () => {
    if (!enabled) return;

    if (selectedStrategy === 'mixed_strategy' && !isValidMixedStrategy) {
      Alert.alert(
        'Invalid Configuration',
        'Mixed strategy weights must total exactly 100%. Current total: ' + totalWeights + '%'
      );
      return;
    }

    setSaving(true);
    try {
      // Here you would save the strategy configuration
      // await rotationAdminService.updateStrategy(selectedStrategy, mixedWeights);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Toast.show({
        type: 'success',
        message: 'Strategy configuration saved successfully',
        duration: 3000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        message: 'Failed to save strategy configuration',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewStrategy = () => {
    if (!enabled) return;
    Alert.alert(
      'Strategy Preview',
      'This will simulate the next rotation using your current settings. No actual assignments will be made.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Preview', onPress: () => setShowPreview(true) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Strategy Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rotation Strategy</Text>
          <Text style={styles.sectionDescription}>
            Choose how chores are distributed among family members. Each strategy optimizes for different priorities and family needs.
          </Text>
          
          {/* Preview Mode Toggle */}
          {enabled && (
            <View style={styles.previewToggle}>
              <Text style={styles.previewLabel}>Preview Mode</Text>
              <Switch
                value={previewMode}
                onValueChange={setPreviewMode}
                trackColor={{ false: colors.surface, true: colors.primary }}
                thumbColor={previewMode ? '#ffffff' : colors.textMuted}
              />
            </View>
          )}

          {strategies.map((strategy) => (
            <TouchableOpacity
              key={strategy.id}
              style={[
                styles.strategyCard,
                selectedStrategy === strategy.id && styles.strategyCardSelected,
              ]}
              onPress={() => handleStrategySelect(strategy.id)}
              disabled={!enabled}
            >
              <View style={styles.strategyHeader}>
                <View style={[styles.strategyIcon, { backgroundColor: `${strategy.color}20` }]}>
                  <WebIcon name={strategy.icon} size={24} color={strategy.color} />
                </View>
                <View style={styles.strategyInfo}>
                  <Text style={styles.strategyName}>{strategy.name}</Text>
                  <Text style={[
                    styles.strategyComplexity,
                    {
                      backgroundColor: 
                        strategy.complexity === 'Simple' ? '#10b98120' :
                        strategy.complexity === 'Moderate' ? '#f59e0b20' : '#ef444420',
                      color:
                        strategy.complexity === 'Simple' ? '#10b981' :
                        strategy.complexity === 'Moderate' ? '#f59e0b' : '#ef4444',
                    }
                  ]}>
                    {strategy.complexity}
                  </Text>
                </View>
                {selectedStrategy === strategy.id && (
                  <WebIcon name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </View>

              <Text style={styles.strategyDescription}>{strategy.description}</Text>

              <View style={styles.benefitsList}>
                {strategy.benefits.slice(0, 3).map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <WebIcon name="checkmark" size={14} color={strategy.color} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Best For</Text>
                  {strategy.bestFor.map((item, index) => (
                    <Text key={index} style={styles.infoItem}>• {item}</Text>
                  ))}
                </View>
                <View style={[styles.infoColumn, styles.infoColumnLast]}>
                  <Text style={styles.infoLabel}>Requirements</Text>
                  {strategy.requirements.map((item, index) => (
                    <Text key={index} style={styles.infoItem}>• {item}</Text>
                  ))}
                </View>
              </View>

              {!enabled && (
                <View style={styles.disabledOverlay}>
                  <Text style={styles.disabledText}>
                    Enable rotation system to configure strategies
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Mixed Strategy Configuration */}
        {selectedStrategy === 'mixed_strategy' && enabled && (
          <View style={styles.mixedStrategyCard}>
            <Text style={styles.mixedTitle}>Mixed Strategy Weights</Text>
            
            {Object.entries(mixedWeights).map(([key, value]) => (
              <View key={key} style={styles.weightSlider}>
                <View style={styles.weightHeader}>
                  <Text style={styles.weightLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text style={styles.weightValue}>{value}%</Text>
                </View>
                <View style={styles.weightTrack}>
                  <View 
                    style={[styles.weightFill, { width: `${value}%` }]} 
                  />
                  <View 
                    style={[styles.weightThumb, { left: `${Math.max(0, Math.min(100, value))}%` }]} 
                  />
                </View>
              </View>
            ))}

            <View style={styles.totalWeights}>
              <Text style={styles.totalLabel}>Total Weight</Text>
              <Text style={styles.totalValue}>{totalWeights}%</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {enabled && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handlePreviewStrategy}
            >
              <WebIcon name="eye" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                Preview
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSaveStrategy}
              disabled={saving || (selectedStrategy === 'mixed_strategy' && !isValidMixedStrategy)}
            >
              {saving ? (
                <LoadingSpinner size="small" color="#ffffff" />
              ) : (
                <WebIcon name="save" size={20} color="#ffffff" />
              )}
              <Text style={styles.actionButtonText}>
                {saving ? 'Saving...' : 'Save Strategy'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}