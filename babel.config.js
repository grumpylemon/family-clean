module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Conditionally disable codegen for react-native-safe-area-context to fix iOS build
      ...(process.env.NODE_ENV === 'production' ? [
        ['@react-native/babel-plugin-codegen', { 
          exclude: /node_modules\/react-native-safe-area-context/ 
        }]
      ] : []),
      // Transform import.meta before any other transformations
      ['babel-plugin-transform-import-meta', { module: 'ES6' }],
      // Enhanced import.meta transformer that works with Metro CommonJS resolution
      function() {
        return {
          visitor: {
            MetaProperty(path, state) {
              try {
                if (path.node.meta && path.node.meta.name === 'import' && 
                    path.node.property && path.node.property.name === 'meta') {
                  
                  // More robust polyfill that handles various execution contexts
                  const replacement = api.template.expression(`
                    (function() {
                      if (typeof globalThis !== 'undefined' && globalThis.import && globalThis.import.meta) {
                        return globalThis.import.meta;
                      }
                      if (typeof window !== 'undefined' && window.import && window.import.meta) {
                        return window.import.meta;
                      }
                      // Fallback for production builds
                      return { 
                        url: typeof window !== 'undefined' ? window.location.href : "http://localhost:8081",
                        env: { MODE: "production", DEV: false, PROD: true } 
                      };
                    })()
                  `)();
                  path.replaceWith(replacement);
                  
                  // Log successful transformation in development
                  if (process.env.NODE_ENV !== 'production') {
                    console.log('✅ Transformed import.meta in:', state.filename?.split('/').pop() || 'unknown file');
                  }
                }
              } catch (error) {
                // Log errors in development, silently skip in production
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('❌ Failed to transform import.meta:', error.message);
                }
              }
            }
          }
        };
      }
    ]
  };
};