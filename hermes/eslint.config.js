const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const palettes = {
  group: ['@/theme/colors'],
  message: 'Use useColors() or createStyles() from @/theme, so dark mode works.',
};

// Supabase and the server are reached only from services/<name>/live.ts.
const backendOnly = {
  group: ['@supabase/*', '@/services/supabase', '@/services/api-client'],
  message: 'Call the backend from a service (src/services/<name>/live.ts), then use that service here.',
};

const upward = {
  group: ['@/features/*', '@/app/*'],
  message: 'Only routes and features may import features.',
};

const featureInternals = {
  group: ['@/features/*/*'],
  message: 'Import a feature from its index (@/features/name), never from inside it.',
};

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*']),
  expoConfig,
  {
    // Test files in plain JavaScript run in Node, under Jest.
    files: ['jest.setup.js', 'src/**/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        Buffer: 'readonly',
        jest: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/services/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [featureInternals, palettes, backendOnly] }],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use apiGet/apiPost from a service (src/services/<name>/live.ts).' },
      ],
    },
  },
  {
    files: ['src/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [featureInternals, palettes, upward] }],
    },
  },
  {
    // Only src/theme may define colors.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/]',
          message: 'Use a color from @/theme. New colors go in src/theme/colors.ts.',
        },
      ],
    },
  },
  {
    // Screens and features are built from src/ui.
    files: ['src/app/**/*.tsx', 'src/features/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [featureInternals, palettes, backendOnly],
          paths: [
            {
              name: 'react-native',
              importNames: [
                'Text',
                'TextInput',
                'Button',
                'Image',
                'Modal',
                'Pressable',
                'TouchableOpacity',
                'TouchableHighlight',
              ],
              message: 'Use the component from @/ui instead.',
            },
            { name: 'expo-image', importNames: ['Image'], message: 'Use Photo from @/ui/photo.' },
            { name: 'expo-symbols', message: 'Use Icon from @/ui/icon.' },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/]',
          message: 'Use a color from @/theme. New colors go in src/theme/colors.ts.',
        },
        {
          selector: 'Property[key.name=/^(fontSize|fontFamily|fontWeight|lineHeight|letterSpacing)$/]',
          message: 'Use <Text variant="..."> from @/ui/text.',
        },
      ],
    },
  },
  {
    // Lower layers can't reach up. (Services have their own block above.)
    files: ['src/{ui,state,domain,utils,theme,navigation}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [palettes, upward, backendOnly] }],
    },
  },
]);
