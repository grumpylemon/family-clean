import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
} from 'react-native';
import UniversalIcon from './UniversalIcon';

interface ValidatedInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  warning?: string | null;
  isValid?: boolean;
  showValidation?: boolean;
  isValidating?: boolean;
  required?: boolean;
  characterLimit?: number;
  hint?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  warning,
  isValid,
  showValidation = true,
  isValidating = false,
  required = false,
  characterLimit,
  hint,
  value,
  style,
  ...props
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  const getBorderColor = () => {
    if (!showValidation) return '#f9a8d4';
    if (error) return '#ef4444';
    if (warning) return '#f59e0b';
    if (isValid) return '#10b981';
    return '#f9a8d4';
  };

  const getCharacterCount = () => {
    if (!characterLimit || !value) return null;
    const currentLength = typeof value === 'string' ? value.length : 0;
    return `${currentLength}/${characterLimit}`;
  };

  const isOverLimit = () => {
    if (!characterLimit || !value) return false;
    const currentLength = typeof value === 'string' ? value.length : 0;
    return currentLength > characterLimit;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: animatedValue }] },
      ]}
    >
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          {characterLimit && (
            <Text style={[
              styles.characterCount, 
              isOverLimit() && styles.characterCountOver
            ]}>
              {getCharacterCount()}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { borderColor: getBorderColor() },
            isOverLimit() && styles.inputOverLimit,
            style,
          ]}
          placeholderTextColor="#f9a8d4"
          value={value}
          {...props}
        />
        
        {showValidation && (
          <View style={styles.iconContainer}>
            {isValidating ? (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>...</Text>
              </View>
            ) : error ? (
              <UniversalIcon name="close-circle" size={20} color="#ef4444" />
            ) : warning ? (
              <UniversalIcon name="warning" size={20} color="#f59e0b" />
            ) : isValid ? (
              <UniversalIcon name="checkmark-circle" size={20} color="#10b981" />
            ) : null}
          </View>
        )}
      </View>
      
      {hint && !error && !warning && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {warning && !error && (
        <Text style={styles.warningText}>{warning}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  required: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  characterCount: {
    fontSize: 12,
    color: '#9f1239',
    fontWeight: '500',
  },
  characterCountOver: {
    color: '#ef4444',
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#831843',
  },
  inputOverLimit: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#9f1239',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#9f1239',
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});