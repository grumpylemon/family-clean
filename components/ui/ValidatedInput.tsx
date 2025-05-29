import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ValidatedInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  isValid?: boolean;
  showValidation?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  isValid,
  showValidation = true,
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
    if (isValid) return '#10b981';
    return '#f9a8d4';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: animatedValue }] },
      ]}
    >
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { borderColor: getBorderColor() },
            style,
          ]}
          placeholderTextColor="#f9a8d4"
          {...props}
        />
        
        {showValidation && (error || isValid) && (
          <View style={styles.iconContainer}>
            {error ? (
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            )}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
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
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
});