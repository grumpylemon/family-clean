// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'components/ui/UniversalIcon.tsx',
      'components/ui/WebIcon.tsx',
      'components/ui/IconSymbol.tsx',
      'components/ui/IconSymbol.ios.tsx',
    ],
    rules: {
      // Prevent direct imports from @expo/vector-icons
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@expo/vector-icons', '@expo/vector-icons/*'],
          message: 'Please use UniversalIcon from components/ui/UniversalIcon instead of direct icon imports.',
        }],
      }],
    },
  },
]);
