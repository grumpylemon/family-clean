const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Fix for Zustand import.meta issue - force CommonJS build
  config.resolve.alias = {
    ...config.resolve.alias,
    // Map zustand imports to the CommonJS builds to avoid import.meta
    'zustand': require.resolve('zustand/index.js'),
    'zustand/vanilla': require.resolve('zustand/vanilla.js'),
    'zustand/middleware': require.resolve('zustand/middleware.js'),
  };
  
  // Also handle import.meta in other modules if needed
  config.module.rules.push({
    test: /\.js$/,
    loader: require.resolve('string-replace-loader'),
    options: {
      search: 'import\\.meta',
      replace: '(typeof import !== "undefined" && import.meta || { url: "" })',
      flags: 'g'
    }
  });
  
  return config;
};