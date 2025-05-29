const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Exclude debugger frontend from web builds to avoid import.meta issues
config.resolver.blockList = [
  /.*\/@react-native\/debugger-frontend\/.*/,
];

// Also configure resolver to handle potential import.meta issues
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;