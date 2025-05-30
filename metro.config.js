const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Fix for Firebase SDK bundling (v9.7.x and above)
config.resolver.sourceExts.push('cjs');

// Exclude debugger frontend from web builds to avoid import.meta issues
// Also exclude react-native-safe-area-context specs from codegen processing to fix iOS build
config.resolver.blockList = [
  /.*\/@react-native\/debugger-frontend\/.*/,
  // Fix for iOS build error with react-native-safe-area-context codegen
  /node_modules\/react-native-safe-area-context\/lib\/specs\/.*/,
];

// CRITICAL FIX: Prioritize CommonJS over ESM to avoid import.meta issues with Zustand v5
// This forces Metro to use CommonJS versions instead of ESM versions containing import.meta
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// Disable package exports for Firebase compatibility
// Firebase SDK has issues with Metro's package.json exports field support
config.resolver.unstable_enablePackageExports = false;

// CRITICAL FIX for Firebase Auth on Web
// Force browser version of Firebase Auth for web builds
// Firebase v11+ handles platform-specific builds automatically, so we only need to set the resolver fields
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

// Note: Custom resolver removed as it's not needed with Firebase v11+
// The resolverMainFields configuration above is sufficient for proper web builds


// Configure transformer options with ZUSTAND V5 optimized minification
config.transformer = {
  ...config.transformer,
  // Ultra-conservative minification specifically tuned for Zustand v5
  minifierConfig: {
    ecma: 8,
    keep_classnames: true,
    keep_fnames: true,
    module: true,
    mangle: {
      toplevel: false, // Critical: Never mangle top-level scope
      eval: false, // Don't mangle eval expressions  
      keep_classnames: true,
      keep_fnames: true,
      // Comprehensive reserved keywords for Zustand v5 internals
      reserved: [
        // Core Zustand API
        'create', 'setState', 'getState', 'subscribe', 'destroy',
        // Zustand v5 internals (useSyncExternalStore related)
        'useSyncExternalStore', 'snapshot', 'listener', 'listeners',
        // State management functions that could be minified to single letters
        'state', 'prev', 'next', 'partial', 'replace', 'selector',
        // Common variable names that cause issues when minified
        'store', 'api', 'get', 'set', 'initialState',
        // Firebase Auth functions
        'signInWithPopup', 'GoogleAuthProvider', 'signInAnonymously', 'signOut',
        'onAuthStateChanged', 'getAuth', 'initializeAuth', 'auth', 'provider',
        // Auth action names that must be preserved
        'signInWithGoogle', 'signInAsGuest', 'logout', 'clearError', 'checkAuthState',
        // Auth state properties
        'user', 'isAuthenticated', 'isLoading', 'error', 'authData',
        // Family store slices
        'auth', 'family', 'offline', 'chores', 'rewards'
      ],
    },
    compress: {
      // Disable all aggressive optimizations that could break Zustand v5
      arrows: false, // Don't convert function expressions to arrow functions
      booleans: false, // Don't optimize boolean expressions
      collapse_vars: false, // Don't collapse variable declarations
      conditionals: false, // Don't optimize if-statements
      drop_console: false, // Keep console statements
      drop_debugger: false, // Keep debugger statements
      evaluate: false, // Don't evaluate constant expressions
      hoist_funs: false, // Don't hoist function declarations
      if_return: false, // Don't optimize if-return patterns
      inline: false, // Don't inline functions
      join_vars: false, // Don't join consecutive var statements
      loops: false, // Don't optimize loops
      pure_funcs: [], // Don't assume any functions are pure
      reduce_vars: false, // Don't reduce variables
      sequences: false, // Don't join statements with comma operator
      side_effects: false, // Don't remove expressions marked as side-effect-free
      switches: false, // Don't optimize switch statements
      typeofs: false, // Don't optimize typeof expressions
      unused: false, // Don't remove unreferenced functions/variables
    },
  },
  // Prevent inlining of Zustand modules completely
  nonInlinedRequires: [
    'zustand',
    'zustand/vanilla', 
    'zustand/middleware',
    'zustand/shallow',
    'use-sync-external-store', // Zustand v5 dependency
  ],
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false, // Disable for maximum compatibility
    },
  }),
};

module.exports = config;