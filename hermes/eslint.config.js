const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const palettes = {
  group: ['@/theme/colors'],
  message: 'Use useColors() or createStyles() from @/theme, so dark mode works.',
};

const featureInternals = {
  group: ['@/features/*/*'],
  message: 'Import a feature from its index (@/features/name), never from inside it.',
};

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*']),
  expoConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featureInternals, palettes] }] },
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
          patterns: [featureInternals, palettes],
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
    // Lower layers can't reach up.
    files: ['src/{ui,services,state,domain,utils,theme,navigation}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [palettes, { group: ['@/features/*', '@/app/*'], message: 'Only routes and features may import features.' }] },
      ],
    },
  },
]);
