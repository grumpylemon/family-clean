import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { UserIdentity, IdentityOption, VisibilityLevel } from '../../types';
import { identityService } from '../../services/identityService';
import { useColorScheme } from '../../hooks/useColorScheme';

interface IdentitySelectorProps {
  identity?: UserIdentity;
  pronouns?: string;
  visibility?: VisibilityLevel;
  ageCategory: 'child' | 'teen' | 'adult';
  onIdentityChange: (identity: UserIdentity) => void;
  onPronounsChange: (pronouns: string) => void;
  onVisibilityChange: (visibility: VisibilityLevel) => void;
  isEditing?: boolean;
}

export function IdentitySelector({
  identity,
  pronouns = '',
  visibility = 'family',
  ageCategory,
  onIdentityChange,
  onPronounsChange,
  onVisibilityChange,
  isEditing = false
}: IdentitySelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityOption>(
    identity?.primaryIdentity || 'Prefer Not to Say'
  );
  const [customIdentity, setCustomIdentity] = useState(identity?.customIdentity || '');
  const [customPronouns, setCustomPronouns] = useState(pronouns);
  const [showPronounOptions, setShowPronounOptions] = useState(false);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);

  const styles = createStyles(isDark);

  const handleIdentitySelect = (identityOption: IdentityOption) => {
    setSelectedIdentity(identityOption);
    
    const newIdentity = identityService.createIdentity(
      identityOption,
      identityOption === 'Other' ? customIdentity : undefined,
      ageCategory
    );
    
    onIdentityChange(newIdentity);

    // Suggest pronouns for the selected identity
    if (!customPronouns) {
      const suggestions = identityService.suggestPronouns(identityOption);
      if (suggestions.length > 0) {
        setCustomPronouns(suggestions[0]);
        onPronounsChange(suggestions[0]);
      }
    }
  };

  const handleCustomIdentityChange = (text: string) => {
    setCustomIdentity(text);
    
    if (selectedIdentity === 'Other') {
      const newIdentity = identityService.createIdentity(
        'Other',
        text,
        ageCategory
      );
      onIdentityChange(newIdentity);
    }
  };

  const handlePronounsChange = (pronouns: string) => {
    const validation = identityService.validatePronouns(pronouns);
    if (validation.valid && validation.formatted) {
      setCustomPronouns(validation.formatted);
      onPronounsChange(validation.formatted);
    } else if (pronouns === '') {
      setCustomPronouns('');
      onPronounsChange('');
    } else {
      Alert.alert('Invalid Pronouns', validation.error);
    }
  };

  const handlePronounSelect = (pronouns: string) => {
    setCustomPronouns(pronouns);
    onPronounsChange(pronouns);
    setShowPronounOptions(false);
  };

  const handleVisibilitySelect = (newVisibility: VisibilityLevel) => {
    onVisibilityChange(newVisibility);
    setShowPrivacyOptions(false);
  };

  const getIdentityOptions = () => {
    return identityService.getAgeAppropriateIdentityOptions(ageCategory);
  };

  const getCommonPronouns = () => {
    return identityService.getCommonPronouns();
  };

  const renderIdentityOptions = () => {
    const options = getIdentityOptions();
    
    return (
      <View style={styles.optionsGrid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.identityOption,
              selectedIdentity === option.id && styles.identityOptionSelected
            ]}
            onPress={() => handleIdentitySelect(option.id)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${option.label} identity`}
          >
            <Text style={styles.identityIcon}>
              {identityService.getIdentityIcon({ primaryIdentity: option.id, ageCategory })}
            </Text>
            <Text style={[
              styles.identityOptionText,
              selectedIdentity === option.id && styles.identityOptionTextSelected
            ]}>
              {option.label}
            </Text>
            {option.description && (
              <Text style={styles.identityOptionDescription}>
                {option.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCustomIdentityInput = () => {
    if (selectedIdentity !== 'Other') return null;

    return (
      <View style={styles.customSection}>
        <Text style={styles.customLabel}>Please specify:</Text>
        <TextInput
          style={styles.customInput}
          value={customIdentity}
          onChangeText={handleCustomIdentityChange}
          placeholder="Enter your identity"
          placeholderTextColor={isDark ? '#9f7086' : '#9f1239'}
          accessibilityLabel="Custom identity input"
        />
      </View>
    );
  };

  const renderPronounSelector = () => {
    const commonPronouns = getCommonPronouns();
    const suggestions = identityService.suggestPronouns(selectedIdentity);

    return (
      <View style={styles.pronounSection}>
        <Text style={styles.sectionTitle}>Pronouns (Optional)</Text>
        
        {suggestions.length > 0 && (
          <View style={styles.suggestedPronouns}>
            <Text style={styles.suggestedLabel}>Suggested:</Text>
            <View style={styles.pronounRow}>
              {suggestions.map((pronoun) => (
                <TouchableOpacity
                  key={pronoun}
                  style={[
                    styles.pronounButton,
                    customPronouns === pronoun && styles.pronounButtonSelected
                  ]}
                  onPress={() => handlePronounSelect(pronoun)}
                >
                  <Text style={[
                    styles.pronounButtonText,
                    customPronouns === pronoun && styles.pronounButtonTextSelected
                  ]}>
                    {pronoun}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.pronounToggle}
          onPress={() => setShowPronounOptions(!showPronounOptions)}
        >
          <Text style={styles.pronounToggleText}>
            {showPronounOptions ? 'Hide' : 'Show'} more options
          </Text>
          <Text style={styles.chevron}>{showPronounOptions ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showPronounOptions && (
          <View style={styles.pronounOptions}>
            {commonPronouns.map((option) => (
              <TouchableOpacity
                key={option.pronouns}
                style={[
                  styles.pronounOption,
                  customPronouns === option.pronouns && styles.pronounOptionSelected
                ]}
                onPress={() => handlePronounSelect(option.pronouns)}
              >
                <Text style={[
                  styles.pronounOptionText,
                  customPronouns === option.pronouns && styles.pronounOptionTextSelected
                ]}>
                  {option.pronouns}
                </Text>
                <Text style={styles.pronounExample}>{option.example}</Text>
                {option.description && (
                  <Text style={styles.pronounDescription}>{option.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.customPronounSection}>
          <Text style={styles.customLabel}>Or enter custom pronouns:</Text>
          <TextInput
            style={styles.customInput}
            value={customPronouns}
            onChangeText={setCustomPronouns}
            onBlur={() => handlePronounsChange(customPronouns)}
            placeholder="e.g., they/them"
            placeholderTextColor={isDark ? '#9f7086' : '#9f1239'}
            accessibilityLabel="Custom pronouns input"
          />
          <Text style={styles.pronounHelp}>
            Format: they/them, he/him, she/her, etc.
          </Text>
        </View>
      </View>
    );
  };

  const renderPrivacySelector = () => {
    const visibilityLevels = identityService.getVisibilityLevels();
    const currentLevel = visibilityLevels.find(level => level.level === visibility);

    return (
      <View style={styles.privacySection}>
        <TouchableOpacity
          style={styles.privacyButton}
          onPress={() => setShowPrivacyOptions(!showPrivacyOptions)}
          accessibilityRole="button"
          accessibilityLabel="Change identity privacy settings"
        >
          <Text style={styles.privacyLabel}>Who can see identity:</Text>
          <View style={styles.privacyValue}>
            <Text style={styles.privacyIcon}>{currentLevel?.icon}</Text>
            <Text style={styles.privacyText}>{currentLevel?.label}</Text>
            <Text style={styles.chevron}>{showPrivacyOptions ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {showPrivacyOptions && (
          <View style={styles.privacyOptions}>
            {visibilityLevels.map((level) => (
              <TouchableOpacity
                key={level.level}
                style={[
                  styles.privacyOption,
                  visibility === level.level && styles.privacyOptionSelected
                ]}
                onPress={() => handleVisibilitySelect(level.level)}
              >
                <Text style={styles.privacyOptionIcon}>{level.icon}</Text>
                <View style={styles.privacyOptionContent}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    visibility === level.level && styles.privacyOptionTitleSelected
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    {level.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDisplayMode = () => {
    if (!identity) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>No Identity Set</Text>
          <Text style={styles.emptyDescription}>
            Share how you'd like to be recognized
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.displayCard}>
        <View style={styles.identityDisplay}>
          <Text style={styles.identityDisplayIcon}>
            {identityService.getIdentityIcon(identity)}
          </Text>
          <View style={styles.identityDisplayContent}>
            <Text style={styles.identityDisplayName}>
              {identityService.getIdentityDisplayName(identity)}
            </Text>
            {pronouns && (
              <Text style={styles.pronounsDisplay}>
                Pronouns: {pronouns}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!isEditing) {
    return renderDisplayMode();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.editSection}>
        <Text style={styles.sectionTitle}>👤 Identity</Text>
        <Text style={styles.sectionDescription}>
          How would you like to be recognized? This helps us create a welcoming environment for everyone.
        </Text>
        
        {renderIdentityOptions()}
        {renderCustomIdentityInput()}
        {renderPronounSelector()}
        {renderPrivacySelector()}
      </View>
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    lineHeight: 22,
  },
  displayCard: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    marginVertical: 8,
  },
  identityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identityDisplayIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  identityDisplayContent: {
    flex: 1,
  },
  identityDisplayName: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 4,
  },
  pronounsDisplay: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  editSection: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    lineHeight: 22,
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  identityOption: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
  },
  identityOptionSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  identityIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  identityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    textAlign: 'center',
    marginBottom: 4,
  },
  identityOptionTextSelected: {
    color: '#ffffff',
  },
  identityOptionDescription: {
    fontSize: 12,
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    lineHeight: 16,
  },
  customSection: {
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  customInput: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: isDark ? '#fbcfe8' : '#831843',
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  pronounSection: {
    marginBottom: 20,
  },
  suggestedPronouns: {
    marginBottom: 16,
  },
  suggestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  pronounRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pronounButton: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  pronounButtonSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  pronounButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  pronounButtonTextSelected: {
    color: '#ffffff',
  },
  pronounToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#4a1f35' : '#f9a8d4',
    marginBottom: 12,
  },
  pronounToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#be185d',
  },
  chevron: {
    fontSize: 12,
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  pronounOptions: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    overflow: 'hidden',
    marginBottom: 16,
  },
  pronounOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  pronounOptionSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
  },
  pronounOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 4,
  },
  pronounOptionTextSelected: {
    color: '#ffffff',
  },
  pronounExample: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  pronounDescription: {
    fontSize: 12,
    color: isDark ? '#9f7086' : '#9f1239',
  },
  customPronounSection: {
    marginTop: 12,
  },
  pronounHelp: {
    fontSize: 12,
    color: isDark ? '#9f7086' : '#9f1239',
    marginTop: 8,
    fontStyle: 'italic',
  },
  privacySection: {
    marginTop: 8,
  },
  privacyButton: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  privacyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    flex: 1,
  },
  privacyOptions: {
    marginTop: 8,
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    overflow: 'hidden',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  privacyOptionSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
  },
  privacyOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyOptionContent: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 4,
  },
  privacyOptionTitleSelected: {
    color: '#ffffff',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
});