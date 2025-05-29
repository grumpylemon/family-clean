// Polyfill for import.meta to fix Zustand on web
if (typeof globalThis !== 'undefined' && !globalThis.import) {
  globalThis.import = {
    meta: {
      env: {
        MODE: process.env.NODE_ENV || 'production'
      }
    }
  };
}