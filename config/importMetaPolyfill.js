// Comprehensive polyfill for import.meta to fix Zustand and other libraries on web
// This handles different ways libraries might access import.meta

// Define import.meta polyfill
const importMetaPolyfill = {
  url: typeof window !== 'undefined' && window.location 
    ? window.location.href 
    : 'http://localhost:8081',
  env: {
    MODE: process.env.NODE_ENV || 'production',
    DEV: process.env.NODE_ENV === 'development',
    PROD: process.env.NODE_ENV === 'production',
    SSR: typeof window === 'undefined'
  }
};

// Apply to different global objects that libraries might check
if (typeof globalThis !== 'undefined' && !globalThis.import) {
  globalThis.import = { meta: importMetaPolyfill };
}

if (typeof window !== 'undefined' && !window.import) {
  window.import = { meta: importMetaPolyfill };
}

if (typeof global !== 'undefined' && !global.import) {
  global.import = { meta: importMetaPolyfill };
}

// Also define on self for web workers
if (typeof self !== 'undefined' && !self.import) {
  self.import = { meta: importMetaPolyfill };
}