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
      // Hermes (el motor de JavaScript de la app en iOS/Android) no trae estos métodos de ES2023: en la vista web funcionan y
      // en el teléfono revientan con "undefined is not a function". Copia y ordena: `[...lista].sort(...)`.
      'no-restricted-properties': [
        'error',
        ...['toSorted', 'toReversed', 'toSpliced', 'findLast', 'findLastIndex'].map((property) => ({ property, message: 'Hermes no lo soporta en el teléfono; usa `[...lista].sort()` / `.reverse()` / un bucle.' })),
        { object: 'Object', property: 'groupBy', message: 'Hermes no lo soporta en el teléfono.' },
      ],
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
