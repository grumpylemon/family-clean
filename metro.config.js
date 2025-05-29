const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Add import.meta global polyfill
if (typeof global !== 'undefined' && typeof global.import === 'undefined') {
  global.import = {
    meta: {
      url: 'http://localhost:8081'
    }
  };
}

module.exports = config;