import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Platform,
  ToastAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Toast Manager to handle the queue
class ToastManager {
  private static instance: ToastManager;
  private toastQueue: ToastConfig[] = [];
  private showToastCallback: ((config: ToastConfig) => void) | null = null;

  static getInstance() {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setShowToastCallback(callback: (config: ToastConfig) => void) {
    this.showToastCallback = callback;
    // Process any queued toasts
    if (this.toastQueue.length > 0) {
      const toast = this.toastQueue.shift()!;
      this.show(toast);
    }
  }

  show(config: ToastConfig) {
    // On Android, use native ToastAndroid for better integration
    if (Platform.OS === 'android') {
      ToastAndroid.show(config.message, ToastAndroid.SHORT);
      return;
    }

    if (this.showToastCallback) {
      this.showToastCallback(config);
    } else {
      this.toastQueue.push(config);
    }
  }
}

// Export the singleton instance methods
export const Toast = {
  show: (config: ToastConfig) => ToastManager.getInstance().show(config),
  success: (message: string, duration?: number) => 
    ToastManager.getInstance().show({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => 
    ToastManager.getInstance().show({ message, type: 'error', duration }),
  info: (message: string, duration?: number) => 
    ToastManager.getInstance().show({ message, type: 'info', duration }),
  warning: (message: string, duration?: number) => 
    ToastManager.getInstance().show({ message, type: 'warning', duration }),
};

// Toast Component
const ToastComponent: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onHide,
  action
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
      case 'error':
        return <Ionicons name="close-circle" size={24} color="#ef4444" />;
      case 'warning':
        return <Ionicons name="warning" size={24} color="#f59e0b" />;
      default:
        return <Ionicons name="information-circle" size={24} color="#be185d" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#ecfdf5';
      case 'error':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      default:
        return '#fdf2f8';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#be185d';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={[styles.message, { color: getBorderColor() }]}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: getBorderColor() }]}
            onPress={() => {
              action.onPress();
              hideToast();
            }}
          >
            <Text style={[styles.actionText, { color: getBorderColor() }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);

  useEffect(() => {
    ToastManager.getInstance().setShowToastCallback((config) => {
      setCurrentToast(config);
    });
  }, []);

  return (
    <>
      {children}
      {currentToast && Platform.OS !== 'android' && (
        <View style={styles.toastContainer}>
          <ToastComponent
            {...currentToast}
            onHide={() => setCurrentToast(null)}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    maxWidth: 400,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});