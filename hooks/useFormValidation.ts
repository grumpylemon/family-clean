import { useState, useCallback } from 'react';

interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

interface ValidationRules {
  [key: string]: ValidationRule[];
}

interface ValidationErrors {
  [key: string]: string | null;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
    return null;
  }, [rules]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (touched.has(fieldName)) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [touched, validateField]);

  const handleFieldBlur = useCallback((fieldName: string, value: any) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [validateField]);

  const validateAll = useCallback((values: { [key: string]: any }): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(new Set(Object.keys(rules)));
    return isValid;
  }, [rules, validateField]);

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched(new Set());
  }, []);

  return {
    errors,
    touched,
    handleFieldChange,
    handleFieldBlur,
    validateAll,
    resetValidation,
    isFieldValid: (fieldName: string) => !errors[fieldName] && touched.has(fieldName),
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value != null;
    },
    message,
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value && value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),
  
  numeric: (message = 'Must be a number'): ValidationRule => ({
    validate: (value: string) => !value || /^\d+$/.test(value),
    message,
  }),
  
  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) && num >= min;
    },
    message: message || `Must be at least ${min}`,
  }),
  
  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: string | number) => {
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
};