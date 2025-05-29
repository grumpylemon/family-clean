const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Exclude debugger frontend from web builds to avoid import.meta issues
config.resolver.blockList = [
  /.*\/@react-native\/debugger-frontend\/.*/,
];

// Configure transformer options
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;