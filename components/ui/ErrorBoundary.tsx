import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import * as SentryReact from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (__DEV__) {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Capture error in Sentry with context
    let errorId: string | null = null;
    
    try {
      // Use platform-specific Sentry
      const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
      
      // Capture the error and get the event ID
      errorId = SentryLib.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          },
          errorBoundary: {
            props: Object.keys(this.props).filter(key => key !== 'children')
          }
        },
        tags: {
          errorBoundary: 'true',
          platform: Platform.OS
        }
      });
      
      console.log('Error captured in Sentry with ID:', errorId);
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }

    // Update state with error details and ID
    this.setState({
      errorInfo,
      errorId
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              We&apos;re sorry for the inconvenience. The error has been logged and we&apos;ll look into it.
            </Text>

            {this.state.errorId && (
              <View style={styles.errorIdContainer}>
                <Text style={styles.errorIdLabel}>Error ID:</Text>
                <Text style={styles.errorId}>{this.state.errorId}</Text>
              </View>
            )}

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.resetButton}
              onPress={this.handleReset}
            >
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#9f1239',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  resetButton: {
    backgroundColor: '#be185d',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    maxHeight: 200,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: '#991b1b',
    fontFamily: 'monospace',
  },
  errorIdContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f1d1d',
    marginRight: 8,
  },
  errorId: {
    fontSize: 14,
    color: '#991b1b',
    fontFamily: 'monospace',
  },
});