import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal
} from 'react-native';
import { UserAvatar, AvatarOptions } from '../../types';
import { avatarService } from '../../services/avatarService';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { useColorScheme } from '../../hooks/useColorScheme';

interface AvatarBuilderProps {
  currentAvatar?: UserAvatar | null;
  onAvatarCreated: (avatar: UserAvatar) => void;
  onCancel: () => void;
  isVisible: boolean;
}

type AvatarCreationStep = 'choose_type' | 'customize_generated' | 'upload_custom' | 'preview';

export function AvatarBuilder({
  currentAvatar,
  onAvatarCreated,
  onCancel,
  isVisible
}: AvatarBuilderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [step, setStep] = useState<AvatarCreationStep>('choose_type');
  const [loading, setLoading] = useState(false);
  
  // Generated avatar state
  const [selectedProvider, setSelectedProvider] = useState<'dicebear' | 'avataaars'>('dicebear');
  const [selectedStyle, setSelectedStyle] = useState('personas');
  const [avatarSeed, setAvatarSeed] = useState(avatarService.generateRandomSeed());
  const [avatarOptions, setAvatarOptions] = useState<AvatarOptions>(avatarService.getDefaultAvatarOptions());
  
  // Upload avatar state
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [urlValidation, setUrlValidation] = useState<{valid: boolean; error?: string} | null>(null);
  
  // Preview state
  const [previewAvatar, setPreviewAvatar] = useState<UserAvatar | null>(null);

  const styles = createStyles(isDark);

  const handleChooseType = (type: 'generated' | 'uploaded') => {
    if (type === 'generated') {
      setStep('customize_generated');
    } else {
      setStep('upload_custom');
    }
  };

  const handleProviderChange = (provider: 'dicebear' | 'avataaars') => {
    setSelectedProvider(provider);
    if (provider === 'avataaars') {
      setSelectedStyle('avataaars');
    } else {
      setSelectedStyle('personas');
    }
    generateNewSeed();
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    generateNewSeed();
  };

  const generateNewSeed = () => {
    setAvatarSeed(avatarService.generateRandomSeed());
  };

  const handleOptionChange = (key: string, value: any) => {
    setAvatarOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateGoogleDriveUrl = useCallback(async () => {
    if (!googleDriveUrl.trim()) {
      setUrlValidation({ valid: false, error: 'Please enter a Google Drive URL' });
      return;
    }

    setLoading(true);
    try {
      const validation = await avatarService.validateGoogleDriveUrl(googleDriveUrl);
      setUrlValidation(validation);
    } catch (error) {
      setUrlValidation({ valid: false, error: 'Failed to validate URL' });
    } finally {
      setLoading(false);
    }
  }, [googleDriveUrl]);

  const handlePreview = async () => {
    setLoading(true);
    try {
      let avatar: UserAvatar;

      if (step === 'customize_generated') {
        avatar = await avatarService.createAvatar({
          type: 'generated',
          generatedConfig: {
            provider: selectedProvider,
            style: selectedStyle,
            seed: avatarSeed,
            options: avatarOptions
          }
        });
      } else {
        avatar = await avatarService.createAvatar({
          type: 'uploaded',
          uploadedConfig: {
            googleDriveUrl
          }
        });
      }

      setPreviewAvatar(avatar);
      setStep('preview');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (previewAvatar) {
      onAvatarCreated(previewAvatar);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'customize_generated':
      case 'upload_custom':
        setStep('choose_type');
        break;
      case 'preview':
        setStep(step === 'preview' && previewAvatar?.type === 'generated' ? 'customize_generated' : 'upload_custom');
        break;
      default:
        onCancel();
    }
  };

  const renderChooseType = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Choose Avatar Type</Text>
      <Text style={styles.subtitle}>How would you like to create your avatar?</Text>
      
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleChooseType('generated')}
        accessibilityRole="button"
        accessibilityLabel="Create generated avatar"
      >
        <Text style={styles.optionTitle}>🎨 Generated Avatar</Text>
        <Text style={styles.optionDescription}>
          Create a custom cartoon avatar with lots of customization options
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleChooseType('uploaded')}
        accessibilityRole="button"
        accessibilityLabel="Upload custom image"
      >
        <Text style={styles.optionTitle}>📸 Upload Image</Text>
        <Text style={styles.optionDescription}>
          Use your own photo from Google Drive
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomizeGenerated = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Customize Avatar</Text>
      
      {/* Preview */}
      <View style={styles.previewSection}>
        <AvatarDisplay
          avatar={{
            type: 'generated',
            generatedConfig: {
              provider: selectedProvider,
              style: selectedStyle,
              seed: avatarSeed,
              options: avatarOptions,
              url: selectedProvider === 'dicebear' 
                ? avatarService.generateDiceBearAvatar(selectedStyle, avatarSeed, avatarOptions)
                : avatarService.generateAvataaarsAvatar(avatarSeed, avatarOptions)
            },
            lastUpdated: new Date().toISOString()
          }}
          size="xlarge"
        />
        <TouchableOpacity style={styles.randomButton} onPress={generateNewSeed}>
          <Text style={styles.randomButtonText}>🎲 Randomize</Text>
        </TouchableOpacity>
      </View>

      {/* Provider Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avatar Style</Text>
        <View style={styles.providerRow}>
          <TouchableOpacity
            style={[styles.providerButton, selectedProvider === 'dicebear' && styles.providerButtonActive]}
            onPress={() => handleProviderChange('dicebear')}
          >
            <Text style={[styles.providerButtonText, selectedProvider === 'dicebear' && styles.providerButtonTextActive]}>
              DiceBear
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.providerButton, selectedProvider === 'avataaars' && styles.providerButtonActive]}
            onPress={() => handleProviderChange('avataaars')}
          >
            <Text style={[styles.providerButtonText, selectedProvider === 'avataaars' && styles.providerButtonTextActive]}>
              Avataaars
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Style Selection for DiceBear */}
      {selectedProvider === 'dicebear' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Character Style</Text>
          <View style={styles.styleGrid}>
            {avatarService.getDiceBearStyles().map(style => (
              <TouchableOpacity
                key={style.id}
                style={[styles.styleButton, selectedStyle === style.id && styles.styleButtonActive]}
                onPress={() => handleStyleChange(style.id)}
              >
                <Text style={[styles.styleButtonText, selectedStyle === style.id && styles.styleButtonTextActive]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Color Customization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Colors</Text>
        
        <View style={styles.colorSection}>
          <Text style={styles.colorLabel}>Background</Text>
          <View style={styles.colorRow}>
            {['#be185d', '#f9a8d4', '#fbcfe8', '#10b981', '#f59e0b', '#ef4444'].map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorButton, { backgroundColor: color }]}
                onPress={() => handleOptionChange('backgroundColor', [color])}
              />
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handlePreview}>
        <Text style={styles.primaryButtonText}>Preview Avatar</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderUploadCustom = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Upload from Google Drive</Text>
      <Text style={styles.subtitle}>
        Share your image on Google Drive and paste the link below
      </Text>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📋 Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Upload your image to Google Drive{'\n'}
          2. Right-click and select "Get link"{'\n'}
          3. Make sure it's set to "Anyone with the link"{'\n'}
          4. Copy and paste the link below
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Google Drive Link</Text>
        <TextInput
          style={styles.textInput}
          value={googleDriveUrl}
          onChangeText={setGoogleDriveUrl}
          placeholder="https://drive.google.com/file/d/..."
          placeholderTextColor={isDark ? '#9f7086' : '#9f1239'}
          multiline
          accessibilityLabel="Google Drive URL input"
        />
        
        <TouchableOpacity 
          style={styles.validateButton} 
          onPress={validateGoogleDriveUrl}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.validateButtonText}>Validate URL</Text>
          )}
        </TouchableOpacity>

        {urlValidation && (
          <View style={[
            styles.validationMessage,
            urlValidation.valid ? styles.validationSuccess : styles.validationError
          ]}>
            <Text style={styles.validationText}>
              {urlValidation.valid ? '✅ Valid image URL!' : `❌ ${urlValidation.error}`}
            </Text>
          </View>
        )}
      </View>

      {urlValidation?.valid && (
        <TouchableOpacity style={styles.primaryButton} onPress={handlePreview}>
          <Text style={styles.primaryButtonText}>Preview Avatar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPreview = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Preview Avatar</Text>
      <Text style={styles.subtitle}>How does this look?</Text>

      <View style={styles.previewSection}>
        <AvatarDisplay avatar={previewAvatar} size="xlarge" />
        <Text style={styles.previewDescription}>
          This is how your avatar will appear throughout the app
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
          <Text style={styles.secondaryButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>Use This Avatar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avatar Builder</Text>
          <View style={styles.closeButton} />
        </View>

        {step === 'choose_type' && renderChooseType()}
        {step === 'customize_generated' && renderCustomizeGenerated()}
        {step === 'upload_custom' && renderUploadCustom()}
        {step === 'preview' && renderPreview()}
      </View>
    </Modal>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#be185d',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  optionCard: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    shadowColor: isDark ? '#000000' : '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    lineHeight: 22,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  randomButton: {
    backgroundColor: isDark ? '#4a1f35' : '#f9a8d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  randomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  providerButton: {
    flex: 1,
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    alignItems: 'center',
  },
  providerButtonActive: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  providerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  providerButtonTextActive: {
    color: isDark ? '#fbcfe8' : '#ffffff',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleButton: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    marginBottom: 8,
  },
  styleButtonActive: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderColor: isDark ? '#f9a8d4' : '#be185d',
  },
  styleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  styleButtonTextActive: {
    color: isDark ? '#fbcfe8' : '#ffffff',
  },
  colorSection: {
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  instructionsCard: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: isDark ? '#fbcfe8' : '#831843',
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  validateButton: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  validationMessage: {
    borderRadius: 8,
    padding: 12,
  },
  validationSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  validationError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewDescription: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: isDark ? '#000000' : '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#be185d',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#f9a8d4' : '#be185d',
  },
});