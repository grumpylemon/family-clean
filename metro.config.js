const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Force Zustand to use CommonJS builds to avoid import.meta issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect zustand imports to CommonJS builds
  if (platform === 'web') {
    if (moduleName === 'zustand') {
      return {
        filePath: require.resolve('zustand/index.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/vanilla') {
      return {
        filePath: require.resolve('zustand/vanilla.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/middleware') {
      return {
        filePath: require.resolve('zustand/middleware.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Add import.meta global polyfill for any remaining cases
if (typeof global !== 'undefined' && typeof global.import === 'undefined') {
  global.import = {
    meta: {
      url: 'http://localhost:8081',
      env: {
        MODE: 'production',
        DEV: false,
        PROD: true
      }
    }
  };
}

module.exports = config;