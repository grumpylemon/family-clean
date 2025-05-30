// This file is kept for potential future use with webpack bundler
// Currently using Metro bundler for Expo web

const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config for Firebase Auth
  if (config.resolve) {
    // Ensure webpack resolves to browser versions of packages
    config.resolve.mainFields = ['browser', 'module', 'main'];
  }
  
  return config;
};