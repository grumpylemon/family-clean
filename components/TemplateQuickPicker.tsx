import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { ChoreTemplate, TemplateRecommendation } from '../types/templates';
import { getTemplates, getTemplateRecommendations, applyTemplate } from '../services/templateService';
import { useFamily } from '../hooks/useZustandHooks';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { UniversalIcon } from './ui/UniversalIcon';
import { Toast } from './ui/Toast';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface TemplateQuickPickerProps {
  visible: boolean;
  onClose: () => void;
  onTemplateApplied?: (templateId: string, choreCount: number) => void;
  mode?: 'quick' | 'full'; // quick = inline picker, full = opens full library
  compact?: boolean; // for smaller display areas
}

export function TemplateQuickPicker({ 
  visible, 
  onClose, 
  onTemplateApplied, 
  mode = 'quick',
  compact = false 
}: TemplateQuickPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { family } = useFamily();
  
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recommended' | 'popular' | 'search'>('recommended');

  const quickCategories = [
    { value: 'all', label: 'All', icon: 'apps' },
    { value: 'daily_routines', label: 'Daily', icon: 'sunny' },
    { value: 'weekly_maintenance', label: 'Weekly', icon: 'calendar' },
    { value: 'family_size', label: 'Family', icon: 'people' }
  ];

  const loadQuickTemplates = useCallback(async () => {
    if (!family?.id) return;
    
    setLoading(true);
    try {
      // Load recommendations and popular templates in parallel
      const [familyRecommendations, popularTemplates] = await Promise.all([
        getTemplateRecommendations(family.id, 3),
        getTemplates({ 
          isOfficial: true,
          categories: selectedCategory !== 'all' ? [selectedCategory as any] : undefined
        })
      ]);
      
      setRecommendations(familyRecommendations);
      setTemplates(popularTemplates.slice(0, compact ? 4 : 8));
    } catch (error) {
      console.error('Error loading quick templates:', error);
      Toast.show('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [family?.id, selectedCategory, compact]);

  const searchTemplates = useCallback(async () => {
    if (!family?.id || !searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = await getTemplates({
        isOfficial: true,
        searchQuery: searchQuery.trim()
      });
      
      setTemplates(searchResults.slice(0, compact ? 4 : 12));
    } catch (error) {
      console.error('Error searching templates:', error);
      Toast.show('Failed to search templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [family?.id, searchQuery, compact]);

  useEffect(() => {
    if (visible && family) {
      if (activeTab === 'search' && searchQuery.trim()) {
        searchTemplates();
      } else {
        loadQuickTemplates();
      }
    }
  }, [visible, family, activeTab, searchQuery, loadQuickTemplates, searchTemplates]);

  const handleApplyTemplate = async (template: ChoreTemplate) => {
    if (!family?.id) {
      Toast.show('No family selected', 'error');
      return;
    }

    // Quick confirmation for inline picker
    const confirmMessage = `Apply "${template.name}" template?\n\nThis will create ${template.chores.length} new chores.`;
    
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      Alert.alert(
        'Apply Template',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', onPress: () => { confirmed = true; proceedWithApplication(template); } }
        ]
      );
      return;
    }

    if (confirmed) {
      await proceedWithApplication(template);
    }
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

  const renderTemplateCard = (template: ChoreTemplate, isRecommended = false, recommendation?: TemplateRecommendation) => (
    <TouchableOpacity
      key={template.id}
      style={[
        styles.templateCard,
        compact && styles.templateCardCompact,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}
      onPress={() => handleApplyTemplate(template)}
      disabled={applying === template.id}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <UniversalIcon 
            name={getCategoryIcon(template.category)} 
            size={compact ? 16 : 20} 
            color={colors.primary} 
          />
          <Text style={[
            styles.templateTitle, 
            compact && styles.templateTitleCompact,
            { color: colors.text }
          ]}>
            {template.name}
          </Text>
          {isRecommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.recommendedBadgeText, { color: colors.background }]}>
                {Math.round(recommendation?.score || 0)}%
              </Text>
            </View>
          )}
        </View>
        {!compact && (
          <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
            {template.description}
          </Text>
        )}
      </View>

      <View style={styles.templateStats}>
        <View style={styles.statItem}>
          <UniversalIcon name="checkmark-circle" size={compact ? 12 : 16} color={colors.textSecondary} />
          <Text style={[styles.statText, compact && styles.statTextCompact, { color: colors.textSecondary }]}>
            {template.chores.length} chores
          </Text>
        </View>
        <View style={styles.statItem}>
          <UniversalIcon name="time" size={compact ? 12 : 16} color={colors.textSecondary} />
          <Text style={[styles.statText, compact && styles.statTextCompact, { color: colors.textSecondary }]}>
            {formatDuration(template.totalEstimatedTime)}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(template.difficulty) + '20' }]}>
          <Text style={[
            styles.difficultyText, 
            compact && styles.difficultyTextCompact,
            { color: getDifficultyColor(template.difficulty) }
          ]}>
            {template.difficulty}
          </Text>
        </View>
      </View>

      <View style={styles.templateAction}>
        {applying === template.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.applyButtonText, { color: colors.primary }]}>
            Apply Template
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.text;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={compact ? "formSheet" : "pageSheet"}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <UniversalIcon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {compact ? 'Quick Templates' : 'Template Quick Picker'}
          </Text>
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
              activeTab === 'popular' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('popular')}
          >
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'popular' ? colors.background : colors.text }
            ]}>
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'search' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'search' ? colors.background : colors.text }
            ]}>
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar - only show in search tab */}
        {activeTab === 'search' && (
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { borderColor: colors.border }]}>
              <UniversalIcon name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search templates..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchTemplates}
              />
            </View>
          </View>
        )}

        {/* Quick Category Filters */}
        {!compact && activeTab !== 'search' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
            <View style={styles.categoryRow}>
              {quickCategories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    selectedCategory === category.value && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setSelectedCategory(category.value)}
                >
                  <UniversalIcon 
                    name={category.icon} 
                    size={16} 
                    color={selectedCategory === category.value ? colors.background : colors.text} 
                  />
                  <Text style={[
                    styles.categoryChipText,
                    { color: selectedCategory === category.value ? colors.background : colors.text }
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading templates..." />
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'recommended' && recommendations.length > 0 ? (
              <View style={styles.templatesSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Perfect for Your Family
                </Text>
                <View style={[styles.templatesGrid, compact && styles.templatesGridCompact]}>
                  {recommendations.map((rec) => renderTemplateCard(rec.template, true, rec))}
                </View>
              </View>
            ) : null}

            {(activeTab === 'popular' || (activeTab === 'recommended' && recommendations.length === 0)) && (
              <View style={styles.templatesSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {activeTab === 'recommended' ? 'Popular Templates' : 'Most Popular'}
                </Text>
                <View style={[styles.templatesGrid, compact && styles.templatesGridCompact]}>
                  {templates.map((template) => renderTemplateCard(template))}
                </View>
              </View>
            )}

            {activeTab === 'search' && (
              <View style={styles.templatesSection}>
                {searchQuery.trim() ? (
                  templates.length > 0 ? (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Search Results ({templates.length})
                      </Text>
                      <View style={[styles.templatesGrid, compact && styles.templatesGridCompact]}>
                        {templates.map((template) => renderTemplateCard(template))}
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <UniversalIcon name="search" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                        No templates found
                      </Text>
                      <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                        Try different search terms
                      </Text>
                    </View>
                  )
                ) : (
                  <View style={styles.emptyState}>
                    <UniversalIcon name="search" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      Search Templates
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                      Enter keywords to find specific templates
                    </Text>
                  </View>
                )}
              </View>
            )}

            {templates.length === 0 && !loading && activeTab !== 'search' && (
              <View style={styles.emptyState}>
                <UniversalIcon name="library" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No templates available
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                  Try browsing other categories
                </Text>
              </View>
            )}
          </ScrollView>
        )}
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
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    gap: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  templatesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  templatesGrid: {
    gap: 12,
  },
  templatesGridCompact: {
    gap: 8,
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  templateCardCompact: {
    padding: 12,
    borderRadius: 8,
  },
  templateHeader: {
    marginBottom: 12,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  templateTitleCompact: {
    fontSize: 14,
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statTextCompact: {
    fontSize: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  difficultyTextCompact: {
    fontSize: 9,
  },
  templateAction: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});