import { useState, useCallback, useEffect } from 'react';
import { useValidationConfig } from './useValidationConfig';
import { FamilyValidationConfig, ValidationRuleConfig } from '../types/validationConfig';

interface ValidationRule {
  validate: (value: any, allValues?: any) => boolean;
  message: string | ((value: any, allValues?: any) => string);
  severity?: 'error' | 'warning';
  debounce?: number;
}

interface CrossFieldValidation {
  fields: string[];
  validate: (values: { [key: string]: any }) => ValidationError | null;
  message: string;
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationRules {
  [key: string]: ValidationRule[];
}

interface ValidationErrors {
  [key: string]: string | null;
}

interface FormValidationOptions {
  crossFieldValidations?: CrossFieldValidation[];
  debounceMs?: number;
}

export const useFormValidation = (rules: ValidationRules, options?: FormValidationOptions) => {
  const { config } = useValidationConfig();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [warnings, setWarnings] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimers, setDebounceTimers] = useState<{ [key: string]: any }>({});

  // Get effective debounce time from config or options
  const getDebounceMs = useCallback(() => {
    if (options?.debounceMs !== undefined) return options.debounceMs;
    if (config?.globalSettings?.debounceMs !== undefined) return config.globalSettings.debounceMs;
    return 300;
  }, [config?.globalSettings?.debounceMs, options?.debounceMs]);

  const validateField = useCallback((fieldName: string, value: any, allValues?: any): string | null => {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const isValid = rule.validate(value, allValues);
      if (!isValid) {
        const message = typeof rule.message === 'function' 
          ? rule.message(value, allValues) 
          : rule.message;
        return message;
      }
    }
    return null;
  }, [rules]);

  const validateCrossFields = useCallback((values: { [key: string]: any }): ValidationErrors => {
    const crossFieldErrors: ValidationErrors = {};
    
    if (options?.crossFieldValidations) {
      for (const crossValidation of options.crossFieldValidations) {
        const error = crossValidation.validate(values);
        if (error) {
          crossFieldErrors[error.field] = error.message;
        }
      }
    }
    
    return crossFieldErrors;
  }, [options?.crossFieldValidations]);

  const handleFieldChange = useCallback((fieldName: string, value: any, allValues?: any) => {
    // Clear existing debounce timer
    if (debounceTimers[fieldName]) {
      clearTimeout(debounceTimers[fieldName]);
    }

    const debounceMs = getDebounceMs();
    
    // Set new debounce timer
    const timer = setTimeout(() => {
      if (touched.has(fieldName)) {
        setIsValidating(true);
        const error = validateField(fieldName, value, allValues);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        
        // Run cross-field validation if this field is part of any cross validations
        if (options?.crossFieldValidations && allValues) {
          const crossErrors = validateCrossFields(allValues);
          setErrors(prev => ({ ...prev, ...crossErrors }));
        }
        
        setIsValidating(false);
      }
      
      // Clean up timer
      setDebounceTimers(prev => {
        const { [fieldName]: removed, ...rest } = prev;
        return rest;
      });
    }, debounceMs);

    setDebounceTimers(prev => ({ ...prev, [fieldName]: timer }));
  }, [touched, validateField, validateCrossFields, getDebounceMs, options?.crossFieldValidations, debounceTimers]);

  const handleFieldBlur = useCallback((fieldName: string, value: any, allValues?: any) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const error = validateField(fieldName, value, allValues);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [validateField]);

  const validateAll = useCallback((values: { [key: string]: any }): boolean => {
    setIsValidating(true);
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate individual fields
    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName], values);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    // Validate cross-field rules
    const crossErrors = validateCrossFields(values);
    Object.keys(crossErrors).forEach(fieldName => {
      if (crossErrors[fieldName]) {
        newErrors[fieldName] = crossErrors[fieldName];
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(new Set(Object.keys(rules)));
    setIsValidating(false);
    return isValid;
  }, [rules, validateField, validateCrossFields]);

  const resetValidation = useCallback(() => {
    setErrors({});
    setWarnings({});
    setTouched(new Set());
    setIsValidating(false);
    
    // Clear all debounce timers
    Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    setDebounceTimers({});
  }, [debounceTimers]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
    };
  }, [debounceTimers]);

  return {
    errors,
    warnings,
    touched,
    isValidating,
    handleFieldChange,
    handleFieldBlur,
    validateAll,
    resetValidation,
    isFieldValid: (fieldName: string) => !errors[fieldName] && touched.has(fieldName),
    hasErrors: Object.values(errors).some(error => error !== null),
    getFieldError: (fieldName: string) => errors[fieldName],
    isFieldTouched: (fieldName: string) => touched.has(fieldName),
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value != null && value !== '';
    },
    message,
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),
  
  numeric: (message = 'Must be a number'): ValidationRule => ({
    validate: (value: string | number) => {
      if (!value && value !== 0) return true;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num);
    },
    message,
  }),
  
  positiveInteger: (message = 'Must be a positive whole number'): ValidationRule => ({
    validate: (value: string | number) => {
      if (!value && value !== 0) return true;
      const str = typeof value === 'number' ? value.toString() : value;
      const num = parseInt(str, 10);
      return Number.isInteger(num) && num > 0 && str === num.toString();
    },
    message,
  }),
  
  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: string | number) => {
      if (!value && value !== 0) return true;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num >= min;
    },
    message: message || `Must be at least ${min}`,
  }),
  
  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: string | number) => {
      if (!value && value !== 0) return true;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num <= max;
    },
    message: message || `Must be no more than ${max}`,
  }),
  
  email: (message = 'Must be a valid email'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  futureDate: (message = 'Date must be in the future'): ValidationRule => ({
    validate: (value: string | Date) => {
      if (!value) return true;
      const date = value instanceof Date ? value : new Date(value);
      return date > new Date();
    },
    message,
  }),

  // Chore-specific validations
  choreTitle: (message = 'Chore title must be 2-50 characters'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      const trimmed = value.trim();
      return trimmed.length >= 2 && trimmed.length <= 50;
    },
    message,
  }),

  chorePoints: (message = 'Points must be between 1 and 100'): ValidationRule => ({
    validate: (value: string | number) => {
      const num = typeof value === 'string' ? parseInt(value, 10) : value;
      return Number.isInteger(num) && num >= 1 && num <= 100;
    },
    message,
  }),

  // Member-specific validations
  displayName: (message = 'Display name must be 2-30 characters'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      const trimmed = value.trim();
      return trimmed.length >= 2 && trimmed.length <= 30;
    },
    message,
  }),

  // Reward-specific validations
  rewardName: (message = 'Reward name must be 2-50 characters'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      const trimmed = value.trim();
      return trimmed.length >= 2 && trimmed.length <= 50;
    },
    message,
  }),

  rewardCost: (message = 'Cost must be between 1 and 1000 points'): ValidationRule => ({
    validate: (value: string | number) => {
      const num = typeof value === 'string' ? parseInt(value, 10) : value;
      return Number.isInteger(num) && num >= 1 && num <= 1000;
    },
    message,
  }),
};

/**
 * Create custom validation rules based on family configuration
 */
export function createCustomValidationRules(config: FamilyValidationConfig | null) {
  if (!config) return validationRules;

  const customRules = { ...validationRules };

  // Helper to create custom rule from config
  const createCustomRule = (
    ruleConfig: ValidationRuleConfig,
    defaultRule: ValidationRule,
    customMessage?: string
  ): ValidationRule => {
    if (!ruleConfig.enabled) {
      return { validate: () => true, message: '' }; // Always pass if disabled
    }

    return {
      validate: (value: any, allValues?: any) => {
        // Apply custom min/max/required logic
        if (ruleConfig.required && (!value || (typeof value === 'string' && !value.trim()))) {
          return false;
        }
        if (!ruleConfig.required && (!value || value === '')) {
          return true; // Optional field, empty is valid
        }
        if (ruleConfig.minLength && typeof value === 'string' && value.length < ruleConfig.minLength) {
          return false;
        }
        if (ruleConfig.maxLength && typeof value === 'string' && value.length > ruleConfig.maxLength) {
          return false;
        }
        if (ruleConfig.min !== undefined) {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          if (!isNaN(num) && num < ruleConfig.min) return false;
        }
        if (ruleConfig.max !== undefined) {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          if (!isNaN(num) && num > ruleConfig.max) return false;
        }

        // Fall back to default validation
        return defaultRule.validate(value, allValues);
      },
      message: customMessage || ruleConfig.customMessage || defaultRule.message
    };
  };

  // Customize chore validation rules
  if (config.choreRules) {
    customRules.choreTitle = () => createCustomRule(
      config.choreRules.title,
      validationRules.choreTitle(),
      config.customMessages.choreTitle
    );

    customRules.chorePoints = () => createCustomRule(
      config.choreRules.points,
      validationRules.chorePoints(),
      config.customMessages.chorePoints
    );
  }

  // Customize member validation rules
  if (config.memberRules) {
    customRules.displayName = () => createCustomRule(
      config.memberRules.displayName,
      validationRules.displayName(),
      config.customMessages.displayName
    );

    customRules.email = () => createCustomRule(
      config.memberRules.email,
      validationRules.email(),
      config.customMessages.email
    );
  }

  // Customize reward validation rules
  if (config.rewardRules) {
    customRules.rewardName = () => createCustomRule(
      config.rewardRules.name,
      validationRules.rewardName(),
      config.customMessages.rewardName
    );

    customRules.rewardCost = () => createCustomRule(
      config.rewardRules.pointsCost,
      validationRules.rewardCost(),
      config.customMessages.rewardCost
    );
  }

  return customRules;
}

// Cross-field validation helpers
export const crossFieldValidations = {
  cooldownVsFrequency: (cooldownField: string, frequencyField: string): CrossFieldValidation => ({
    fields: [cooldownField, frequencyField],
    validate: (values) => {
      const cooldown = parseInt(values[cooldownField], 10);
      const frequency = parseInt(values[frequencyField], 10);
      
      if (isNaN(cooldown) || isNaN(frequency)) return null;
      
      const cooldownDays = cooldown / 24;
      if (cooldownDays > frequency) {
        return {
          field: cooldownField,
          message: `Cooldown (${cooldownDays.toFixed(1)} days) cannot be longer than frequency (${frequency} days)`,
          severity: 'error'
        };
      }
      
      return null;
    },
    message: 'Cooldown period cannot exceed frequency period'
  }),
};