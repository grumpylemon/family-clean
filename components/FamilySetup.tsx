import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useFamily , useAuth } from '../hooks/useZustandHooks';
import { router } from 'expo-router';
import { TemplateQuickPicker } from './TemplateQuickPicker';
import { getTemplateRecommendations } from '../services/templateService';
import { TemplateRecommendation } from '../types/templates';
import { Toast } from './ui/Toast';

interface FamilySetupProps {
  onComplete?: () => void;
}

export function FamilySetup({ onComplete }: FamilySetupProps) {
  const { createNewFamily, joinFamily, error, refreshFamily, family } = useFamily();
  const { logout } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create' | 'join' | 'templates'>('choose');
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showTemplateRecommendations, setShowTemplateRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [newFamilyId, setNewFamilyId] = useState<string | null>(null);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;

    setLoading(true);
    try {
      const success = await createNewFamily(familyName.trim());
      if (success) {
        console.log('[FamilySetup] Family created successfully');
        
        // Add a small delay to ensure state propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Store the new family ID for template recommendations
        if (family?.id) {
          setNewFamilyId(family.id);
          
          // Show template recommendations step
          setMode('templates');
          await loadTemplateRecommendations(family.id);
        } else {
          // Fallback to immediate completion
          completeSetup();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateRecommendations = async (familyId: string) => {
    setLoadingRecommendations(true);
    try {
      const recs = await getTemplateRecommendations(familyId, 5);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading template recommendations:', error);
      // Don't show error toast - this is optional functionality
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const completeSetup = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleTemplateApplied = (templateId: string, choreCount: number) => {
    Toast.show(`Successfully created ${choreCount} chores from template!`, 'success');
    // Continue to next template or complete setup
  };

  const skipTemplates = () => {
    completeSetup();
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) return;

    setLoading(true);
    setLocalError(null);
    try {
      const success = await joinFamily(joinCode.trim().toUpperCase());
      if (success) {
        // For joined families, go straight to completion (don't offer templates)
        completeSetup();
      } else if (error?.includes('already a member')) {
        // If already a member, try to refresh family data
        const refreshed = await refreshFamily();
        if (refreshed) {
          completeSetup();
        } else {
          setLocalError('Unable to load family data. Please try refreshing the page.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const refreshed = await refreshFamily();
      if (refreshed) {
        if (onComplete) {
          onComplete();
        } else {
          router.replace('/(tabs)/dashboard');
        }
      } else {
        setLocalError('Unable to load family data. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Welcome to Family Clean!</ThemedText>
        <ThemedText style={styles.subtitle}>
          Let&apos;s get your family set up
        </ThemedText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setMode('create')}
          >
            <ThemedText style={styles.primaryButtonText}>
              Create a New Family
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMode('join')}
          >
            <ThemedText style={styles.secondaryButtonText}>
              Join Existing Family
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <ThemedText style={styles.linkButtonText}>
                Refresh / Already have a family?
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {(error || localError) && (
          <ThemedText style={styles.errorText}>{error || localError}</ThemedText>
        )}

        <TouchableOpacity
          style={[styles.linkButton, { marginTop: 40 }]}
          onPress={logout}
        >
          <ThemedText style={[styles.linkButtonText, { opacity: 0.6 }]}>
            Sign Out
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (mode === 'create') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.container}>
          <ThemedText style={styles.title}>Create Your Family</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose a name for your family
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Family name"
            value={familyName}
            onChangeText={setFamilyName}
            autoCapitalize="words"
            placeholderTextColor="#999"
          />

          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleCreateFamily}
              disabled={loading || !familyName.trim()}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Create Family
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setMode('choose')}
              disabled={loading}
            >
              <ThemedText style={styles.linkButtonText}>Back</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  // Template recommendations mode
  if (mode === 'templates') {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText style={styles.title}>🎉 Family Created!</ThemedText>
          <ThemedText style={styles.subtitle}>
            Let's get you started with some recommended templates
          </ThemedText>

          {loadingRecommendations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4285F4" />
              <ThemedText style={styles.loadingText}>
                Finding perfect templates for your family...
              </ThemedText>
            </View>
          ) : recommendations.length > 0 ? (
            <>
              <ThemedText style={styles.recommendationsTitle}>
                Perfect for Your Family
              </ThemedText>
              <View style={styles.recommendationsContainer}>
                {recommendations.slice(0, 3).map((rec, index) => (
                  <TouchableOpacity
                    key={rec.template.id}
                    style={styles.recommendationCard}
                    onPress={() => setShowTemplateRecommendations(true)}
                  >
                    <View style={styles.recommendationHeader}>
                      <ThemedText style={styles.recommendationTitle}>
                        {rec.template.name}
                      </ThemedText>
                      <View style={styles.scoreContainer}>
                        <ThemedText style={styles.scoreText}>
                          {Math.round(rec.score)}% match
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.recommendationDescription}>
                      {rec.template.description}
                    </ThemedText>
                    <View style={styles.recommendationStats}>
                      <ThemedText style={styles.statText}>
                        📋 {rec.template.chores.length} chores
                      </ThemedText>
                      <ThemedText style={styles.statText}>
                        ⏱️ {Math.round(rec.template.totalEstimatedTime / 60)}h total
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.reasonText}>
                      💡 {rec.reasons[0] || 'Great fit for your family'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.noRecommendationsContainer}>
              <ThemedText style={styles.noRecommendationsText}>
                No specific recommendations right now, but you can browse all available templates!
              </ThemedText>
            </View>
          )}

          <View style={styles.templateActionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowTemplateRecommendations(true)}
            >
              <ThemedText style={styles.primaryButtonText}>
                {recommendations.length > 0 ? 'Explore Templates' : 'Browse Templates'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={skipTemplates}
            >
              <ThemedText style={styles.linkButtonText}>
                Skip for now - I'll add chores later
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TemplateQuickPicker
            visible={showTemplateRecommendations}
            onClose={() => setShowTemplateRecommendations(false)}
            onTemplateApplied={handleTemplateApplied}
            mode="full"
            compact={false}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  // Join mode
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Join a Family</ThemedText>
        <ThemedText style={styles.subtitle}>
          Enter the family join code
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Enter code (e.g., ABC123)"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          placeholderTextColor="#999"
          maxLength={6}
        />

        {(error || localError) && (
          <ThemedText style={styles.errorText}>{error || localError}</ThemedText>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleJoinFamily}
            disabled={loading || !joinCode.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                Join Family
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setMode('choose')}
            disabled={loading}
          >
            <ThemedText style={styles.linkButtonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
    backgroundColor: 'white',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkButtonText: {
    color: '#4285F4',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Template recommendations styles
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  recommendationsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  scoreContainer: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    opacity: 0.7,
  },
  reasonText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  noRecommendationsContainer: {
    alignItems: 'center',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  noRecommendationsText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  templateActionContainer: {
    gap: 16,
  },
});