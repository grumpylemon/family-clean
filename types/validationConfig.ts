export type StrictnessLevel = 'relaxed' | 'normal' | 'strict' | 'custom';

export interface ValidationRuleConfig {
  enabled: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  customMessage?: string;
}

export interface ChoreValidationRules {
  title: ValidationRuleConfig;
  description: ValidationRuleConfig;
  points: ValidationRuleConfig;
  frequency: ValidationRuleConfig;
  cooldown: ValidationRuleConfig;
  crossField: {
    cooldownVsFrequency: {
      enabled: boolean;
      customMessage?: string;
    };
  };
}

export interface MemberValidationRules {
  displayName: ValidationRuleConfig;
  email: ValidationRuleConfig & {
    formatValidation: boolean;
  };
  profileRequirements: {
    photoRequired: boolean;
    customMessage?: string;
  };
}

export interface RewardValidationRules {
  name: ValidationRuleConfig;
  description: ValidationRuleConfig;
  pointsCost: ValidationRuleConfig;
  category: {
    required: boolean;
    customMessage?: string;
  };
  minLevel: ValidationRuleConfig;
}

export interface GlobalValidationSettings {
  debounceMs: number;
  showWarnings: boolean;
  animationsEnabled: boolean;
  characterCountEnabled: boolean;
  hintsEnabled: boolean;
}

export interface FamilyValidationConfig {
  id: string;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // admin uid
  strictnessLevel: StrictnessLevel;
  isEnabled: boolean;
  
  // Rule configurations
  choreRules: ChoreValidationRules;
  memberRules: MemberValidationRules;
  rewardRules: RewardValidationRules;
  globalSettings: GlobalValidationSettings;
  
  // Custom messages
  customMessages: Record<string, string>;
  
  // Analytics
  analytics?: ValidationAnalytics;
  
  // Metadata
  version: number;
  notes?: string;
}

export interface ValidationAnalytics {
  totalValidationErrors: number;
  errorsByField: Record<string, number>;
  errorsByUser: Record<string, number>;
  completionRates: {
    overall: number;
    byForm: Record<string, number>;
    byUser: Record<string, number>;
  };
  performanceMetrics: {
    averageValidationTime: number;
    peakValidationTime: number;
    validationCacheHitRate: number;
  };
  userFeedback: Array<{
    userId: string;
    formType: string;
    rating: number; // 1-5
    comment?: string;
    timestamp: string;
  }>;
  configurationHistory: Array<{
    timestamp: string;
    changedBy: string;
    changes: Partial<FamilyValidationConfig>;
    reason?: string;
  }>;
}

export interface ValidationPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<FamilyValidationConfig>;
  tags: string[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

// Helper types for form validation integration
export interface CustomValidationRule {
  fieldName: string;
  ruleType: 'minLength' | 'maxLength' | 'min' | 'max' | 'required' | 'custom';
  value?: number | boolean | string;
  message: string;
  enabled: boolean;
}

export interface ValidationConfigContext {
  config: FamilyValidationConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<FamilyValidationConfig>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  loadPreset: (preset: ValidationPreset) => Promise<void>;
  saveAsPreset: (name: string, description: string) => Promise<void>;
  rollbackToVersion: (version: number) => Promise<void>;
}

// Default configurations for each strictness level
export const DEFAULT_STRICTNESS_CONFIGS: Record<StrictnessLevel, Partial<FamilyValidationConfig>> = {
  relaxed: {
    strictnessLevel: 'relaxed',
    choreRules: {
      title: { enabled: true, minLength: 1, maxLength: 100, required: true },
      description: { enabled: true, maxLength: 500, required: false },
      points: { enabled: true, min: 1, max: 1000, required: true },
      frequency: { enabled: true, min: 1, max: 365, required: false },
      cooldown: { enabled: true, min: 0, max: 720, required: false },
      crossField: { cooldownVsFrequency: { enabled: false } }
    },
    memberRules: {
      displayName: { enabled: true, minLength: 1, maxLength: 50, required: true },
      email: { enabled: true, required: false, formatValidation: false },
      profileRequirements: { photoRequired: false }
    },
    rewardRules: {
      name: { enabled: true, minLength: 1, maxLength: 100, required: true },
      description: { enabled: true, maxLength: 500, required: false },
      pointsCost: { enabled: true, min: 1, max: 10000, required: true },
      category: { required: false },
      minLevel: { enabled: true, min: 1, max: 10, required: false }
    }
  },
  normal: {
    strictnessLevel: 'normal',
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
    }
  },
  strict: {
    strictnessLevel: 'strict',
    choreRules: {
      title: { enabled: true, minLength: 3, maxLength: 30, required: true },
      description: { enabled: true, minLength: 10, maxLength: 100, required: true },
      points: { enabled: true, min: 1, max: 50, required: true },
      frequency: { enabled: true, min: 1, max: 30, required: true },
      cooldown: { enabled: true, min: 1, max: 48, required: true },
      crossField: { cooldownVsFrequency: { enabled: true } }
    },
    memberRules: {
      displayName: { enabled: true, minLength: 3, maxLength: 20, required: true },
      email: { enabled: true, required: true, formatValidation: true },
      profileRequirements: { photoRequired: true }
    },
    rewardRules: {
      name: { enabled: true, minLength: 3, maxLength: 30, required: true },
      description: { enabled: true, minLength: 10, maxLength: 100, required: true },
      pointsCost: { enabled: true, min: 5, max: 500, required: true },
      category: { required: true },
      minLevel: { enabled: true, min: 1, max: 10, required: true }
    }
  },
  custom: {
    strictnessLevel: 'custom',
    // Custom configurations are user-defined
  }
};