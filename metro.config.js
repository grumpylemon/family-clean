const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Exclude debugger frontend from web builds to avoid import.meta issues
config.resolver.blockList = [
  /.*\/@react-native\/debugger-frontend\/.*/,
];

// Use custom transformer to replace import.meta at build time
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro.transformer.js'),
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;