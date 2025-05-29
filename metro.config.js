const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Expo Vector Icons on web
config.resolver.assetExts.push('ttf');

// Exclude debugger frontend from web builds to avoid import.meta issues
config.resolver.blockList = [
  /.*\/@react-native\/debugger-frontend\/.*/,
];

// CRITICAL FIX: Prioritize CommonJS over ESM to avoid import.meta issues with Zustand v5
// This forces Metro to use CommonJS versions instead of ESM versions containing import.meta
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// Ensure package exports resolution works correctly
config.resolver.unstable_enablePackageExports = true;

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
        'store', 'api', 'get', 'set', 'initialState'
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