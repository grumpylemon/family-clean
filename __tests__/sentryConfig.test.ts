import { shouldEnableSentry, getEnvironment, initializeSentry } from '../config/sentry';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

jest.mock('../config/firebase', () => ({
  isMockImplementation: jest.fn(() => false),
}));

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  ReactNativeTracing: jest.fn(),
  ReactNavigationInstrumentation: jest.fn(),
}));

describe('Sentry Configuration', () => {
  const originalDEV = __DEV__;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    global.__DEV__ = false;
    global.window = {
      location: {
        hostname: 'family-fun-app.web.app',
      },
    } as any;
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@test.ingest.sentry.io/test';
  });

  afterEach(() => {
    // @ts-ignore
    global.__DEV__ = originalDEV;
    global.window = originalWindow;
  });

  describe('shouldEnableSentry', () => {
    test('returns false in development mode', () => {
      // @ts-ignore
      global.__DEV__ = true;
      const SentryModule = require('../config/sentry');
      expect(SentryModule.shouldEnableSentry()).toBe(false);
    });

    test('returns false in mock mode', () => {
      const { isMockImplementation } = require('../config/firebase');
      isMockImplementation.mockReturnValue(true);
      
      const SentryModule = require('../config/sentry');
      expect(SentryModule.shouldEnableSentry()).toBe(false);
    });

    test('returns true on production domain', () => {
      const SentryModule = require('../config/sentry');
      expect(SentryModule.shouldEnableSentry()).toBe(true);
    });

    test('returns false on non-production domain', () => {
      global.window.location.hostname = 'localhost';
      const SentryModule = require('../config/sentry');
      expect(SentryModule.shouldEnableSentry()).toBe(false);
    });
  });

  describe('getEnvironment', () => {
    test('returns development when __DEV__ is true', () => {
      // @ts-ignore
      global.__DEV__ = true;
      const SentryModule = require('../config/sentry');
      expect(SentryModule.getEnvironment()).toBe('development');
    });

    test('returns staging for staging domains', () => {
      global.window.location.hostname = 'staging.family-fun-app.web.app';
      const SentryModule = require('../config/sentry');
      expect(SentryModule.getEnvironment()).toBe('staging');
    });

    test('returns production for production domains', () => {
      const SentryModule = require('../config/sentry');
      expect(SentryModule.getEnvironment()).toBe('production');
    });
  });

  describe('beforeSend filter', () => {
    test('filters out network errors', () => {
      const SentryModule = require('../config/sentry');
      const event = { request: {} };
      const hint = { originalException: new Error('Network request failed') };
      
      expect(SentryModule.beforeSend(event, hint)).toBeNull();
    });

    test('filters out auth popup errors', () => {
      const SentryModule = require('../config/sentry');
      const event = { request: {} };
      const error = new Error();
      error.code = 'auth/popup-closed-by-user';
      const hint = { originalException: error };
      
      expect(SentryModule.beforeSend(event, hint)).toBeNull();
    });

    test('sanitizes user email', () => {
      const SentryModule = require('../config/sentry');
      const event = {
        user: { id: '123', email: 'test@example.com' },
        request: {},
      };
      const hint = { originalException: new Error('Test error') };
      
      const result = SentryModule.beforeSend(event, hint);
      expect(result.user).toEqual({ id: '123' });
      expect(result.user.email).toBeUndefined();
    });

    test('allows valid errors through', () => {
      const SentryModule = require('../config/sentry');
      const event = { request: {} };
      const hint = { originalException: new Error('Legitimate error') };
      
      expect(SentryModule.beforeSend(event, hint)).toBe(event);
    });
  });
});