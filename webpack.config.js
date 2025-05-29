const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add font file handling for Expo Vector Icons
  config.module.rules.push({
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    type: 'asset/resource',
    generator: {
      filename: 'assets/fonts/[name][ext]'
    }
  });
  
  // Force browser version of Firebase Auth
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      // Force webpack to use browser version of Firebase Auth
      'firebase/auth': require.resolve('firebase/auth/dist/index.esm.js')
    }
  };
  
  // Ensure proper module ordering and preserve critical functions
  config.optimization = {
    ...config.optimization,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    minimizer: config.optimization.minimizer ? config.optimization.minimizer.map(minimizer => {
      // Configure Terser to preserve critical function names
      if (minimizer.constructor.name === 'TerserPlugin') {
        minimizer.options = {
          ...minimizer.options,
          terserOptions: {
            ...minimizer.options?.terserOptions,
            keep_fnames: /^(signInWithGoogle|signInAnonymously|signOut|onAuthStateChanged|authService|signInWithPopup|GoogleAuthProvider|auth|family|chore|reward|offline|useFamilyStore|createAuthSlice|createFamilySlice)$/,
            mangle: {
              ...minimizer.options?.terserOptions?.mangle,
              reserved: [
                'signInWithGoogle', 
                'signInAnonymously',
                'signInAsGuest',
                'signOut',
                'logout',
                'onAuthStateChanged',
                'authService',
                'signInWithPopup',
                'GoogleAuthProvider',
                'firebaseSignInWithPopup',
                'FirebaseGoogleAuthProvider',
                'firebaseSignInAnonymously',
                'firebaseSignOut',
                'firebaseOnAuthStateChanged',
                'auth',
                'family',
                'chore',
                'reward',
                'offline',
                'useFamilyStore',
                'createAuthSlice',
                'createFamilySlice',
                'checkAuthState',
                'clearError',
                'user',
                'isAuthenticated',
                'isLoading',
                'error'
              ],
              // Preserve property names in Zustand store
              properties: {
                reserved: [
                  'auth',
                  'family',
                  'chore',
                  'reward',
                  'offline',
                  'signInWithGoogle',
                  'signInAsGuest',
                  'logout',
                  'user',
                  'isAuthenticated',
                  'isLoading',
                  'error',
                  'checkAuthState',
                  'clearError'
                ]
              }
            }
          }
        };
      }
      return minimizer;
    }) : [],
  };
  
  // Add DefinePlugin to replace import.meta
  config.plugins.push(
    new webpack.DefinePlugin({
      'import.meta.url': JSON.stringify('http://localhost:8081'),
      'import.meta.env.MODE': JSON.stringify('production'),
      'import.meta.env.DEV': JSON.stringify(false),
      'import.meta.env.PROD': JSON.stringify(true),
      'import.meta.env': JSON.stringify({
        MODE: 'production',
        DEV: false,
        PROD: true,
        SSR: false
      }),
      'import.meta': JSON.stringify({
        url: 'http://localhost:8081',
        env: {
          MODE: 'production',
          DEV: false,
          PROD: true,
          SSR: false
        }
      })
    })
  );
  
  // Add banner to inject polyfill at the very beginning
  config.plugins.push(
    new webpack.BannerPlugin({
      banner: `
        if (typeof globalThis !== 'undefined' && !globalThis.import) {
          globalThis.import = { meta: { url: 'http://localhost:8081', env: { MODE: 'production' } } };
        }
        if (typeof window !== 'undefined' && !window.import) {
          window.import = { meta: { url: 'http://localhost:8081', env: { MODE: 'production' } } };
        }
        // Ensure critical Firebase functions are preserved
        if (typeof window !== 'undefined') {
          window.__FIREBASE_AUTH_PRESERVED__ = true;
        }
      `,
      raw: true,
      entryOnly: true
    })
  );
  
  return config;
};