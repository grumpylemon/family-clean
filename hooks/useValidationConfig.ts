import { useState, useEffect, useCallback } from 'react';
import { useFamily, useAuth } from './useZustandHooks';
import { 
  getFamilyValidationConfig,
  updateFamilyValidationConfig,
  resetValidationConfigToDefault,
  saveValidationPreset,
  getUserValidationPresets,
  applyValidationPreset,
  recordValidationAnalytics,
  getDefaultValidationConfig
} from '../services/validationConfigService';
import {
  FamilyValidationConfig,
  ValidationPreset,
  StrictnessLevel,
  ValidationAnalytics,
  ValidationConfigContext
} from '../types/validationConfig';

export function useValidationConfig(): ValidationConfigContext {
  const { family } = useFamily();
  const { user } = useAuth();
  const [config, setConfig] = useState<FamilyValidationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load validation configuration when family changes
  useEffect(() => {
    if (family?.id) {
      loadValidationConfig();
    }
  }, [family?.id]);

  const loadValidationConfig = useCallback(async () => {
    if (!family?.id) return;

    setLoading(true);
    setError(null);

    try {
      let familyConfig = await getFamilyValidationConfig(family.id);
      
      // If no config exists, create default
      if (!familyConfig && user?.uid) {
        const defaultConfig = getDefaultValidationConfig(family.id, user.uid);
        const success = await updateFamilyValidationConfig(family.id, defaultConfig);
        
        if (success) {
          familyConfig = await getFamilyValidationConfig(family.id);
        }
      }

      setConfig(familyConfig);
    } catch (err) {
      console.error('Error loading validation config:', err);
      setError('Failed to load validation configuration');
    } finally {
      setLoading(false);
    }
  }, [family?.id, user?.uid]);

  const updateConfig = useCallback(async (updates: Partial<FamilyValidationConfig>) => {
    if (!family?.id) {
      setError('No family selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await updateFamilyValidationConfig(family.id, updates);
      
      if (success) {
        // Reload configuration to get updated version
        await loadValidationConfig();
      } else {
        setError('Failed to update validation configuration');
      }
    } catch (err) {
      console.error('Error updating validation config:', err);
      setError('Failed to update validation configuration');
    } finally {
      setLoading(false);
    }
  }, [family?.id, loadValidationConfig]);

  const resetToDefaults = useCallback(async (strictnessLevel: StrictnessLevel = 'normal') => {
    if (!family?.id) {
      setError('No family selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await resetValidationConfigToDefault(family.id, strictnessLevel);
      
      if (success) {
        await loadValidationConfig();
      } else {
        setError('Failed to reset validation configuration');
      }
    } catch (err) {
      console.error('Error resetting validation config:', err);
      setError('Failed to reset validation configuration');
    } finally {
      setLoading(false);
    }
  }, [family?.id, loadValidationConfig]);

  const loadPreset = useCallback(async (preset: ValidationPreset) => {
    if (!family?.id) {
      setError('No family selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await applyValidationPreset(family.id, preset.id);
      
      if (success) {
        await loadValidationConfig();
      } else {
        setError('Failed to apply validation preset');
      }
    } catch (err) {
      console.error('Error applying validation preset:', err);
      setError('Failed to apply validation preset');
    } finally {
      setLoading(false);
    }
  }, [family?.id, loadValidationConfig]);

  const saveAsPreset = useCallback(async (name: string, description: string) => {
    if (!config) {
      setError('No configuration to save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const presetId = await saveValidationPreset(config, name, description);
      
      if (!presetId) {
        setError('Failed to save validation preset');
      }
    } catch (err) {
      console.error('Error saving validation preset:', err);
      setError('Failed to save validation preset');
    } finally {
      setLoading(false);
    }
  }, [config]);

  const rollbackToVersion = useCallback(async (version: number) => {
    if (!family?.id) {
      setError('No family selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This would need to be implemented in the service
      // For now, we'll just reload the current config
      await loadValidationConfig();
    } catch (err) {
      console.error('Error rolling back validation config:', err);
      setError('Failed to rollback validation configuration');
    } finally {
      setLoading(false);
    }
  }, [family?.id, loadValidationConfig]);

  return {
    config,
    loading,
    error,
    updateConfig,
    resetToDefaults,
    loadPreset,
    saveAsPreset,
    rollbackToVersion
  };
}

/**
 * Hook for loading and managing validation presets
 */
export function useValidationPresets() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<ValidationPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const userPresets = await getUserValidationPresets(user.uid);
      setPresets(userPresets);
    } catch (err) {
      console.error('Error loading validation presets:', err);
      setError('Failed to load validation presets');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return {
    presets,
    loading,
    error,
    refreshPresets: loadPresets
  };
}

/**
 * Hook for recording validation analytics
 */
export function useValidationAnalytics() {
  const { family } = useFamily();

  const recordError = useCallback(async (fieldName: string, errorType: string) => {
    if (!family?.id) return;

    try {
      await recordValidationAnalytics(family.id, {
        totalValidationErrors: 1,
        errorsByField: {
          [fieldName]: 1
        }
      });
    } catch (error) {
      console.error('Error recording validation error:', error);
    }
  }, [family?.id]);

  const recordCompletion = useCallback(async (formType: string, success: boolean) => {
    if (!family?.id) return;

    try {
      const completionRate = success ? 100 : 0;
      await recordValidationAnalytics(family.id, {
        completionRates: {
          overall: completionRate,
          byForm: {
            [formType]: completionRate
          }
        }
      });
    } catch (error) {
      console.error('Error recording form completion:', error);
    }
  }, [family?.id]);

  const recordUserFeedback = useCallback(async (
    formType: string,
    rating: number,
    comment?: string
  ) => {
    if (!family?.id) return;

    try {
      await recordValidationAnalytics(family.id, {
        userFeedback: [{
          userId: family.id, // This should be the actual user ID
          formType,
          rating,
          comment,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Error recording user feedback:', error);
    }
  }, [family?.id]);

  return {
    recordError,
    recordCompletion,
    recordUserFeedback
  };
}