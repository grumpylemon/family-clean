import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as SentryReact from '@sentry/react';
import React from 'react';
import { getCurrentVersion } from '../constants/Version';
import { isMockImplementation } from './firebase';

// Sentry configuration types
export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  debug: boolean;
  tracesSampleRate: number;
  attachStacktrace: boolean;
  beforeSend?: (event: any, hint: any) => any;
}

// Check if we should enable Sentry
const shouldEnableSentry = (): boolean => {
  // Never enable in development
  if (__DEV__) {
    console.log('Sentry disabled: Development mode');
    return false;
  }

  // Never enable in mock mode
  if (isMockImplementation()) {
    console.log('Sentry disabled: Mock mode active');
    return false;
  }

  // TEMPORARILY DISABLE Sentry for iOS to prevent crashes during debugging
  if (Platform.OS === 'ios') {
    console.log('Sentry disabled: iOS temporarily disabled for crash debugging');
    return false;
  }

  // Check for production domains
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isProduction = hostname === 'family-fun-app.web.app' || 
                        hostname === 'family-fun-app.firebaseapp.com';
    
    if (!isProduction) {
      console.log('Sentry disabled: Non-production domain');
      return false;
    }
  }

  return true;
};

// Get environment name
const getEnvironment = (): string => {
  if (__DEV__) return 'development';
  
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname.includes('staging')) return 'staging';
  }
  
  return 'production';
};

// Filter out expected errors
const beforeSend = (event: any, hint: any): any => {
  const error = hint.originalException;
  
  // Filter out network errors when offline
  if (error?.message?.includes('Network request failed') ||
      error?.message?.includes('Failed to fetch') ||
      error?.code === 'auth/network-request-failed') {
    return null;
  }
  
  // Filter out Firebase auth popup errors
  if (error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request') {
    return null;
  }
  
  // Filter out expected permission errors
  if (error?.code === 'permission-denied' ||
      error?.code === 'PERMISSION_DENIED') {
    console.warn('Permission error filtered from Sentry:', error);
    return null;
  }
  
  // Filter out ResizeObserver errors (common and harmless)
  if (error?.message?.includes('ResizeObserver loop limit exceeded')) {
    return null;
  }
  
  // Sanitize sensitive data
  if (event.request?.cookies) {
    delete event.request.cookies;
  }
  
  if (event.user?.email) {
    // Only keep user ID, not email
    event.user = { id: event.user.id };
  }
  
  // Remove any auth tokens from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
      if (breadcrumb.data?.url?.includes('token=')) {
        breadcrumb.data.url = breadcrumb.data.url.replace(/token=[^&]+/, 'token=REDACTED');
      }
      return breadcrumb;
    });
  }
  
  return event;
};

// Initialize Sentry based on platform
export const initializeSentry = async (): Promise<void> => {
  console.log('=== SENTRY INITIALIZATION STARTING ===');
  console.log('Platform.OS for Sentry:', Platform.OS);
  console.log('__DEV__ for Sentry:', __DEV__);
  
  if (!shouldEnableSentry()) {
    console.log('Sentry initialization skipped - shouldEnableSentry returned false');
    return;
  }

  console.log('Sentry should be enabled, checking DSN...');
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  console.log('Sentry DSN found:', dsn ? 'YES' : 'NO');
  
  if (!dsn) {
    console.warn('Sentry DSN not found in environment variables');
    return;
  }

  const config: SentryConfig = {
    dsn,
    environment: getEnvironment(),
    enabled: true,
    debug: false,
    tracesSampleRate: Platform.OS === 'web' ? 0.2 : 0.1, // Lower sample rate for mobile
    attachStacktrace: true,
    beforeSend,
  };

  console.log('Sentry config created:', config);
  console.log('About to initialize Sentry for platform:', Platform.OS);
  
  try {
    if (Platform.OS === 'web') {
      console.log('Initializing Sentry for web platform...');
      // Use React SDK for web
      SentryReact.init({
        dsn: config.dsn,
        environment: config.environment,
        enabled: config.enabled,
        debug: config.debug,
        tracesSampleRate: config.tracesSampleRate,
        attachStacktrace: config.attachStacktrace,
        beforeSend: config.beforeSend,
        release: getCurrentVersion(),
        integrations: [
          // Simple browser tracing without router instrumentation
          new SentryReact.BrowserTracing({
            tracingOrigins: ['localhost', 'family-fun-app.web.app', /^\//],
          }),
        ],
        autoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
      });
      console.log('Sentry web initialization completed');
    } else {
      console.log('Initializing Sentry for React Native platform...');
      // Use React Native SDK for mobile - simplified config to avoid crashes
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        enabled: config.enabled,
        debug: config.debug,
        tracesSampleRate: config.tracesSampleRate,
        attachStacktrace: config.attachStacktrace,
        beforeSend: config.beforeSend,
        release: getCurrentVersion(),
        dist: Platform.OS,
        // Minimal integrations to avoid iOS crashes
        integrations: [],
        // Basic React Native options
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        enableNativeCrashHandling: false, // Disable to prevent conflicts
        enableAutoPerformanceTracking: false, // Disable to prevent conflicts
      });
      console.log('Sentry React Native initialization completed');
    }
    
    console.log(`=== SENTRY INITIALIZED SUCCESSFULLY ===`);
    console.log(`Platform: ${Platform.OS}`);
    console.log(`Environment: ${config.environment}`);
    console.log(`Debug: ${config.debug}`);
  } catch (error) {
    console.error('=== SENTRY INITIALIZATION FAILED ===');
    console.error('Failed to initialize Sentry:', error);
    console.error('Sentry error type:', typeof error);
    console.error('Sentry error stack:', error?.stack);
    console.error('Sentry error message:', error?.message);
  }
};

// Helper to capture exceptions with context
export const captureExceptionWithContext = (
  error: Error,
  context: Record<string, any>,
  tags?: Record<string, string>
): void => {
  if (!shouldEnableSentry()) return;

  const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
  
  SentryLib.withScope((scope) => {
    // Add context
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value);
    });
    
    // Add tags
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    SentryLib.captureException(error);
  });
};

// Helper to add breadcrumb
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}): void => {
  if (!shouldEnableSentry()) return;

  const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
  SentryLib.addBreadcrumb(breadcrumb);
};

// Helper to set user context safely (delayed to prevent auth interference)
export const setUserContext = (user: {
  id: string;
  familyId?: string;
  role?: string;
}): void => {
  if (!shouldEnableSentry()) return;

  // Delay Sentry context setting to prevent interference with authentication flow
  setTimeout(() => {
    try {
      const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
      SentryLib.setUser({
        id: user.id,
        // Add custom attributes
        familyId: user.familyId,
        role: user.role,
      });
      console.log('[Sentry] User context set safely after auth completion');
    } catch (error) {
      console.warn('[Sentry] Failed to set user context (non-blocking):', error);
    }
  }, 1000); // 1 second delay to ensure auth flow is complete
};

// Helper to set user context immediately (for non-auth flows)
export const setUserContextImmediate = (user: {
  id: string;
  familyId?: string;
  role?: string;
}): void => {
  if (!shouldEnableSentry()) return;

  try {
    const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
    SentryLib.setUser({
      id: user.id,
      familyId: user.familyId,
      role: user.role,
    });
    console.log('[Sentry] User context set immediately');
  } catch (error) {
    console.warn('[Sentry] Failed to set user context immediately (non-blocking):', error);
  }
};

// Helper to clear user context safely (on logout)
export const clearUserContext = (): void => {
  if (!shouldEnableSentry()) return;

  try {
    const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
    SentryLib.setUser(null);
    console.log('[Sentry] User context cleared safely');
  } catch (error) {
    console.warn('[Sentry] Failed to clear user context (non-blocking):', error);
  }
};

// Helper to start a transaction for performance monitoring
export const startTransaction = (name: string, op: string): any => {
  if (!shouldEnableSentry()) return null;

  const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
  return SentryLib.startTransaction({ name, op });
};

// Router instrumentation removed to prevent iOS crashes