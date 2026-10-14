// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*', 'docs/*', 'src/uniwind-types.d.ts'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*'],
              message: 'Usa el alias absoluto `@/` (ver ARCHITECTURE.md, M-03).',
            },
          ],
        },
      ],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['./*', '../*'], message: 'Usa el alias absoluto `@/`.' },
            {
              group: ['@/features/*', '@/providers/*', '@/app/*'],
              message: 'Los componentes de diseño no importan lógica: reciben datos y callbacks por props (M-02).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }] },
  },
]);
