import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, safeCollection } from '../config/firebase';
import { FamilyValidationConfig, ValidationPreset, DEFAULT_STRICTNESS_CONFIGS, StrictnessLevel, ValidationAnalytics } from '../types/validationConfig';

const VALIDATION_CONFIG_COLLECTION = 'validationConfigs';
const VALIDATION_PRESETS_COLLECTION = 'validationPresets';

/**
 * Get the validation configuration for a family
 */
export async function getFamilyValidationConfig(familyId: string): Promise<FamilyValidationConfig | null> {
  try {
    const configDoc = doc(safeCollection(VALIDATION_CONFIG_COLLECTION), familyId);
    const configSnap = await getDoc(configDoc);
    
    if (configSnap.exists()) {
      return { id: configSnap.id, ...configSnap.data() } as FamilyValidationConfig;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching validation config:', error);
    return null;
  }
}

/**
 * Create or update validation configuration for a family
 */
export async function updateFamilyValidationConfig(
  familyId: string, 
  config: Partial<FamilyValidationConfig>
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const configDoc = doc(safeCollection(VALIDATION_CONFIG_COLLECTION), familyId);
    const existingConfig = await getFamilyValidationConfig(familyId);
    
    const now = new Date().toISOString();
    const updatedConfig: FamilyValidationConfig = {
      id: familyId,
      familyId,
      createdAt: existingConfig?.createdAt || now,
      updatedAt: now,
      createdBy: existingConfig?.createdBy || user.uid,
      version: (existingConfig?.version || 0) + 1,
      ...getDefaultValidationConfig(familyId, user.uid),
      ...existingConfig,
      ...config,
    };

    // Add change to history
    if (existingConfig) {
      const historyEntry = {
        timestamp: now,
        changedBy: user.uid,
        changes: config,
        reason: config.notes || 'Configuration updated'
      };
      
      updatedConfig.analytics = {
        ...updatedConfig.analytics,
        configurationHistory: [
          ...(updatedConfig.analytics?.configurationHistory || []),
          historyEntry
        ].slice(-50) // Keep last 50 changes
      };
    }

    await setDoc(configDoc, updatedConfig);
    return true;
  } catch (error) {
    console.error('Error updating validation config:', error);
    return false;
  }
}

/**
 * Reset validation configuration to default for a specific strictness level
 */
export async function resetValidationConfigToDefault(
  familyId: string, 
  strictnessLevel: StrictnessLevel = 'normal'
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const defaultConfig = {
      ...getDefaultValidationConfig(familyId, user.uid),
      ...DEFAULT_STRICTNESS_CONFIGS[strictnessLevel],
      strictnessLevel,
      notes: `Reset to ${strictnessLevel} mode`
    };

    return await updateFamilyValidationConfig(familyId, defaultConfig);
  } catch (error) {
    console.error('Error resetting validation config:', error);
    return false;
  }
}

/**
 * Get default validation configuration
 */
export function getDefaultValidationConfig(familyId: string, userId: string): FamilyValidationConfig {
  const now = new Date().toISOString();
  
  return {
    id: familyId,
    familyId,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    strictnessLevel: 'normal',
    isEnabled: true,
    version: 1,
    
    choreRules: {
      title: { enabled: true, minLength: 2, maxLength: 50, required: true },
      description: { enabled: true, maxLength: 200, required: false },
      points: { enabled: true, min: 1, max: 100, required: true },
      frequency: { enabled: true, min: 1, max: 365, required: false },
      cooldown: { enabled: true, min: 0, max: 168, required: false },
      crossField: { cooldownVsFrequency: { enabled: true } }
    },
    
    memberRules: {
      displayName: { enabled: true, minLength: 2, maxLength: 30, required: true },
      email: { enabled: true, required: true, formatValidation: true },
      profileRequirements: { photoRequired: false }
    },
    
    rewardRules: {
      name: { enabled: true, minLength: 2, maxLength: 50, required: true },
      description: { enabled: true, maxLength: 200, required: false },
      pointsCost: { enabled: true, min: 1, max: 1000, required: true },
      category: { required: true },
      minLevel: { enabled: true, min: 1, max: 10, required: false }
    },
    
    globalSettings: {
      debounceMs: 300,
      showWarnings: true,
      animationsEnabled: true,
      characterCountEnabled: true,
      hintsEnabled: true
    },
    
    customMessages: {},
    
    analytics: {
      totalValidationErrors: 0,
      errorsByField: {},
      errorsByUser: {},
      completionRates: {
        overall: 100,
        byForm: {},
        byUser: {}
      },
      performanceMetrics: {
        averageValidationTime: 0,
        peakValidationTime: 0,
        validationCacheHitRate: 100
      },
      userFeedback: [],
      configurationHistory: []
    }
  };
}

/**
 * Record validation analytics
 */
export async function recordValidationAnalytics(
  familyId: string,
  analytics: Partial<ValidationAnalytics>
): Promise<void> {
  try {
    const config = await getFamilyValidationConfig(familyId);
    if (!config) return;

    const updatedAnalytics: ValidationAnalytics = {
      ...config.analytics,
      ...analytics,
      // Merge specific fields
      errorsByField: {
        ...config.analytics?.errorsByField,
        ...analytics.errorsByField
      },
      errorsByUser: {
        ...config.analytics?.errorsByUser,
        ...analytics.errorsByUser
      },
      userFeedback: [
        ...(config.analytics?.userFeedback || []),
        ...(analytics.userFeedback || [])
      ].slice(-100) // Keep last 100 feedback entries
    };

    await updateFamilyValidationConfig(familyId, { analytics: updatedAnalytics });
  } catch (error) {
    console.error('Error recording validation analytics:', error);
  }
}

/**
 * Save validation configuration as a preset
 */
export async function saveValidationPreset(
  config: FamilyValidationConfig,
  name: string,
  description: string,
  tags: string[] = []
): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    const presetId = `${user.uid}_${Date.now()}`;
    const preset: ValidationPreset = {
      id: presetId,
      name,
      description,
      config: {
        strictnessLevel: config.strictnessLevel,
        choreRules: config.choreRules,
        memberRules: config.memberRules,
        rewardRules: config.rewardRules,
        globalSettings: config.globalSettings,
        customMessages: config.customMessages
      },
      tags,
      isDefault: false,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    const presetDoc = doc(safeCollection(VALIDATION_PRESETS_COLLECTION), presetId);
    await setDoc(presetDoc, preset);
    
    return presetId;
  } catch (error) {
    console.error('Error saving validation preset:', error);
    return null;
  }
}

/**
 * Load validation presets for a user
 */
export async function getUserValidationPresets(userId: string): Promise<ValidationPreset[]> {
  try {
    const presetsQuery = query(
      safeCollection(VALIDATION_PRESETS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const presetsSnap = await getDocs(presetsQuery);
    return presetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ValidationPreset));
  } catch (error) {
    console.error('Error loading validation presets:', error);
    return [];
  }
}

/**
 * Load a validation preset by ID
 */
export async function getValidationPreset(presetId: string): Promise<ValidationPreset | null> {
  try {
    const presetDoc = doc(safeCollection(VALIDATION_PRESETS_COLLECTION), presetId);
    const presetSnap = await getDoc(presetDoc);
    
    if (presetSnap.exists()) {
      return { id: presetSnap.id, ...presetSnap.data() } as ValidationPreset;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading validation preset:', error);
    return null;
  }
}

/**
 * Apply a validation preset to a family
 */
export async function applyValidationPreset(
  familyId: string,
  presetId: string
): Promise<boolean> {
  try {
    const preset = await getValidationPreset(presetId);
    if (!preset) {
      console.error('Preset not found:', presetId);
      return false;
    }

    // Update preset usage count
    const presetDoc = doc(safeCollection(VALIDATION_PRESETS_COLLECTION), presetId);
    await updateDoc(presetDoc, {
      usageCount: preset.usageCount + 1
    });

    // Apply preset configuration
    return await updateFamilyValidationConfig(familyId, {
      ...preset.config,
      notes: `Applied preset: ${preset.name}`
    });
  } catch (error) {
    console.error('Error applying validation preset:', error);
    return false;
  }
}

/**
 * Delete a validation preset
 */
export async function deleteValidationPreset(presetId: string): Promise<boolean> {
  try {
    const presetDoc = doc(safeCollection(VALIDATION_PRESETS_COLLECTION), presetId);
    await deleteDoc(presetDoc);
    return true;
  } catch (error) {
    console.error('Error deleting validation preset:', error);
    return false;
  }
}

/**
 * Rollback validation configuration to a previous version
 */
export async function rollbackValidationConfig(
  familyId: string,
  targetVersion: number
): Promise<boolean> {
  try {
    const config = await getFamilyValidationConfig(familyId);
    if (!config || !config.analytics?.configurationHistory) {
      console.error('No configuration history available');
      return false;
    }

    // Find the target version in history
    const historyEntry = config.analytics.configurationHistory
      .find(entry => entry.changes.version === targetVersion);
    
    if (!historyEntry) {
      console.error('Target version not found in history');
      return false;
    }

    // Apply the historical configuration
    return await updateFamilyValidationConfig(familyId, {
      ...historyEntry.changes,
      notes: `Rolled back to version ${targetVersion}`
    });
  } catch (error) {
    console.error('Error rolling back validation config:', error);
    return false;
  }
}