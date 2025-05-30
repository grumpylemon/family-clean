import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as SentryReact from '@sentry/react';
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
  if (!shouldEnableSentry()) {
    console.log('Sentry initialization skipped');
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  
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

  try {
    if (Platform.OS === 'web') {
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
          // Browser tracing for performance monitoring
          new SentryReact.BrowserTracing({
            // Set tracingOrigins to your app's origin
            tracingOrigins: ['localhost', 'family-fun-app.web.app', /^\//],
            // Capture interactions (clicks, navigation)
            routingInstrumentation: SentryReact.reactRouterV6Instrumentation(
              React.useEffect,
              // @ts-ignore - Expo Router not fully typed
              useLocation,
              useNavigationType
            ),
          }),
          // Capture console errors
          new SentryReact.CaptureConsole({
            levels: ['error', 'warn'],
          }),
        ],
        // Performance monitoring
        tracesSampleRate: config.tracesSampleRate,
        // Session tracking
        autoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
      });
    } else {
      // Use React Native SDK for mobile
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
        integrations: [
          new Sentry.ReactNativeTracing({
            // Performance monitoring for React Navigation
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
            tracingOptions: {
              shouldCreateSpanForRequest: (url) => {
                // Don't create spans for Sentry requests
                return !url.includes('sentry.io');
              },
            },
          }),
        ],
        // React Native specific options
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        enableNativeCrashHandling: true,
        enableAutoPerformanceTracking: true,
      });
    }
    
    console.log(`Sentry initialized successfully for ${Platform.OS} in ${config.environment} environment`);
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
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

// Helper to set user context
export const setUserContext = (user: {
  id: string;
  familyId?: string;
  role?: string;
}): void => {
  if (!shouldEnableSentry()) return;

  const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
  SentryLib.setUser({
    id: user.id,
    // Add custom attributes
    familyId: user.familyId,
    role: user.role,
  });
};

// Helper to clear user context (on logout)
export const clearUserContext = (): void => {
  if (!shouldEnableSentry()) return;

  const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
  SentryLib.setUser(null);
};

// Helper to start a transaction for performance monitoring
export const startTransaction = (name: string, op: string): any => {
  if (!shouldEnableSentry()) return null;

  const SentryLib = Platform.OS === 'web' ? SentryReact : Sentry;
  return SentryLib.startTransaction({ name, op });
};

// For web-specific imports (will be tree-shaken on native)
let useLocation: any;
let useNavigationType: any;

if (Platform.OS === 'web') {
  try {
    const routerModule = require('expo-router');
    useLocation = routerModule.useLocation;
    useNavigationType = routerModule.useNavigationType;
  } catch {
    // Expo Router not available, will use default routing instrumentation
  }
}