import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { ChoreTemplate, TemplateSearchFilter, TemplateRecommendation } from '../types/templates';
import { getTemplates, getTemplateRecommendations, applyTemplate } from '../services/templateService';
import { useFamily } from '../hooks/useZustandHooks';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Toast } from './ui/Toast';
import { UniversalIcon } from './ui/UniversalIcon';

interface TemplateLibraryProps {
  visible: boolean;
  onClose: () => void;
  onTemplateApplied?: (templateId: string, choreCount: number) => void;
}

export function TemplateLibrary({ visible, onClose, onTemplateApplied }: TemplateLibraryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { family } = useFamily();
  
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'recommended'>('recommended');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'daily_routines', label: 'Daily Routines' },
    { value: 'weekly_maintenance', label: 'Weekly Maintenance' },
    { value: 'seasonal_tasks', label: 'Seasonal Tasks' },
    { value: 'family_size', label: 'Family Size Specific' },
    { value: 'lifestyle', label: 'Lifestyle' }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const loadTemplatesAndRecommendations = useCallback(async () => {
    if (!family?.id) return;
    
    setLoading(true);
    try {
      // Load both templates and recommendations in parallel
      const [allTemplates, familyRecommendations] = await Promise.all([
        getTemplates({ isOfficial: true }),
        getTemplateRecommendations(family.id, 5)
      ]);
      
      setTemplates(allTemplates);
      setRecommendations(familyRecommendations);
    } catch (error) {
      console.error('Error loading templates:', error);
      Toast.show('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [family?.id]);

  const applyFilters = useCallback(async () => {
    if (!family?.id || loading) return;

    const filter: TemplateSearchFilter = {
      isOfficial: true
    };

    if (searchQuery.trim()) {
      filter.searchQuery = searchQuery.trim();
    }

    if (selectedCategory !== 'all') {
      filter.categories = [selectedCategory as any];
    }

    if (selectedDifficulty !== 'all') {
      filter.difficulty = [selectedDifficulty as any];
    }

    try {
      const filteredTemplates = await getTemplates(filter);
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error('Error filtering templates:', error);
    }
  }, [family?.id, searchQuery, selectedCategory, selectedDifficulty, loading]);

  useEffect(() => {
    if (visible && family) {
      loadTemplatesAndRecommendations();
    }
  }, [visible, family, loadTemplatesAndRecommendations]);

  useEffect(() => {
    if (visible) {
      applyFilters();
    }
  }, [searchQuery, selectedCategory, selectedDifficulty, visible, applyFilters]);

  const handleApplyTemplate = async (template: ChoreTemplate) => {
    if (!family?.id) {
      Toast.show('No family selected', 'error');
      return;
    }

    // Confirm application
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Apply "${template.name}" template?\n\nThis will create ${template.chores.length} new chores for your family.`
      );
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Apply Template',
        `Apply "${template.name}" template?\n\nThis will create ${template.chores.length} new chores for your family.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', onPress: () => proceedWithApplication(template) }
        ]
      );
      return;
    }

    await proceedWithApplication(template);
  };

  const proceedWithApplication = async (template: ChoreTemplate) => {
    if (!family?.id) return;

    setApplying(template.id);
    try {
      const result = await applyTemplate(template.id, family.id);
      
      if (result.success) {
        Toast.show(
          `Successfully applied "${template.name}"! Created ${result.summary.choresCreated} chores.`,
          'success'
        );
        onTemplateApplied?.(template.id, result.summary.choresCreated);
        onClose();
      } else {
        Toast.show(
          result.errors?.join(', ') || 'Failed to apply template',
          'error'
        );
      }
    } catch (error) {
      console.error('Error applying template:', error);
      Toast.show('Failed to apply template', 'error');
    } finally {
      setApplying(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.text;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily_routines': return 'sunny';
      case 'weekly_maintenance': return 'calendar';
      case 'seasonal_tasks': return 'leaf';
      case 'family_size': return 'people';
      case 'lifestyle': return 'heart';
      default: return 'list';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderTemplateCard = (template: ChoreTemplate, isRecommended = false, recommendation?: TemplateRecommendation) => (
    <View key={template.id} style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <UniversalIcon 
            name={getCategoryIcon(template.category)} 
            size={20} 
            color={colors.primary} 
          />
          <Text style={[styles.templateTitle, { color: colors.text }]}>{template.name}</Text>
          {isRecommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.recommendedBadgeText, { color: colors.background }]}>
                {Math.round(recommendation?.score || 0)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
          {template.description}
        </Text>
      </View>

      <View style={styles.templateStats}>
        <View style={styles.statItem}>
          <UniversalIcon name="checkmark-circle" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {template.chores.length} chores
          </Text>
        </View>
        <View style={styles.statItem}>
          <UniversalIcon name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {formatDuration(template.totalEstimatedTime)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <UniversalIcon name="people" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {template.targetFamilySize[0]}-{template.targetFamilySize[1]} members
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(template.difficulty) + '20' }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(template.difficulty) }]}>
            {template.difficulty}
          </Text>
        </View>
      </View>

      {isRecommended && recommendation?.reasons && (
        <View style={styles.recommendationReasons}>
          <Text style={[styles.reasonsTitle, { color: colors.textSecondary }]}>Why recommended:</Text>
          {recommendation.reasons.slice(0, 2).map((reason, index) => (
            <Text key={index} style={[styles.reasonText, { color: colors.textSecondary }]}>
              • {reason}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.templateActions}>
        <TouchableOpacity
          style={[styles.detailsButton, { borderColor: colors.border }]}
          onPress={() => setShowDetails(template.id)}
        >
          <Text style={[styles.detailsButtonText, { color: colors.text }]}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.applyButton, 
            { backgroundColor: colors.primary },
            applying === template.id && styles.applyingButton
          ]}
          onPress={() => handleApplyTemplate(template)}
          disabled={applying === template.id}
        >
          {applying === template.id ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.applyButtonText, { color: colors.background }]}>
              Apply Template
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTemplateDetails = () => {
    const template = templates.find(t => t.id === showDetails);
    if (!template) return null;

    return (
      <Modal
        visible={!!showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(null)}
      >
        <SafeAreaView style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.detailsHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(null)}
            >
              <UniversalIcon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>{template.name}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.detailsDescription, { color: colors.text }]}>
              {template.description}
            </Text>

            {template.setupInstructions && (
              <View style={styles.instructionsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Setup Instructions</Text>
                <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                  {template.setupInstructions}
                </Text>
              </View>
            )}

            <View style={styles.choresSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Included Chores ({template.chores.length})
              </Text>
              {template.chores.map((chore, index) => (
                <View key={index} style={[styles.choreItem, { borderColor: colors.border }]}>
                  <View style={styles.choreHeader}>
                    <Text style={[styles.choreTitle, { color: colors.text }]}>{chore.title}</Text>
                    <View style={styles.choreMetrics}>
                      <Text style={[styles.chorePoints, { color: colors.primary }]}>
                        {chore.basePoints} pts
                      </Text>
                      <View style={[styles.choreDifficulty, { backgroundColor: getDifficultyColor(chore.difficulty) + '20' }]}>
                        <Text style={[styles.choreDifficultyText, { color: getDifficultyColor(chore.difficulty) }]}>
                          {chore.difficulty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.choreDescription, { color: colors.textSecondary }]}>
                    {chore.description}
                  </Text>
                  {chore.estimatedDuration && (
                    <Text style={[styles.choreDuration, { color: colors.textSecondary }]}>
                      Est. {formatDuration(chore.estimatedDuration)}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {template.customizationTips && template.customizationTips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Customization Tips</Text>
                {template.customizationTips.map((tip, index) => (
                  <Text key={index} style={[styles.tipText, { color: colors.textSecondary }]}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={[styles.detailsFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowDetails(null);
                handleApplyTemplate(template);
              }}
              disabled={applying === template.id}
            >
              {applying === template.id ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.applyButtonText, { color: colors.background }]}>
                  Apply This Template
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <UniversalIcon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Template Library</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'recommended' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('recommended')}
          >
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'recommended' ? colors.background : colors.text }
            ]}>
              Recommended
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'browse' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'browse' ? colors.background : colors.text }
            ]}>
              Browse All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        {activeTab === 'browse' && (
          <View style={styles.filtersSection}>
            <View style={[styles.searchContainer, { borderColor: colors.border }]}>
              <UniversalIcon name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search templates..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
              <View style={styles.filterRow}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      selectedCategory === category.value && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setSelectedCategory(category.value)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedCategory === category.value ? colors.background : colors.text }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
              <View style={styles.filterRow}>
                {difficulties.map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty.value}
                    style={[
                      styles.filterChip,
                      { borderColor: colors.border },
                      selectedDifficulty === difficulty.value && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setSelectedDifficulty(difficulty.value)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedDifficulty === difficulty.value ? colors.background : colors.text }
                    ]}>
                      {difficulty.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading templates..." />
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'recommended' ? (
              <View style={styles.recommendedSection}>
                {recommendations.length > 0 ? (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
                        Perfect for Your Family
                      </Text>
                      <Text style={[styles.sectionSubtext, { color: colors.textSecondary }]}>
                        Based on your family size and preferences
                      </Text>
                    </View>
                    {recommendations.map((rec) => renderTemplateCard(rec.template, true, rec))}
                  </>
                ) : (
                  <View style={styles.emptyState}>
                    <UniversalIcon name="sparkles" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      No recommendations available yet
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                      Browse all templates to find what works for your family
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.templatesGrid}>
                {templates.length > 0 ? (
                  templates.map((template) => renderTemplateCard(template))
                ) : (
                  <View style={styles.emptyState}>
                    <UniversalIcon name="search" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      No templates found
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                      Try adjusting your search or filters
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {renderTemplateDetails()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  recommendedSection: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 16,
  },
  templatesGrid: {
    padding: 20,
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  templateHeader: {
    marginBottom: 12,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationReasons: {
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 16,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyingButton: {
    opacity: 0.7,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Template Details Modal Styles
  detailsContainer: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  detailsDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  instructionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  choresSection: {
    marginBottom: 24,
  },
  choreItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  choreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  choreMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chorePoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  choreDifficulty: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  choreDifficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  choreDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  choreDuration: {
    fontSize: 12,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  detailsFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
});