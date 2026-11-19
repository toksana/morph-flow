import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const CORE_BOUNDARY_MESSAGE =
  'src/core must stay platform-agnostic (shared with React Native later): no React, Next.js, DOM, Node or app imports.';

/** src/core will become a standalone package, so it may depend only on itself and plain libraries. */
const coreBoundary = {
  files: ['src/core/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              'react',
              'react/*',
              'react-dom',
              'react-dom/*',
              'react-native',
              'next',
              'next/*',
            ],
            message: CORE_BOUNDARY_MESSAGE,
          },
          { group: ['node:*'], message: CORE_BOUNDARY_MESSAGE },
          {
            group: ['@/*'],
            message: `${CORE_BOUNDARY_MESSAGE} Use relative imports inside src/core.`,
          },
        ],
      },
    ],
    'no-restricted-globals': [
      'error',
      ...['window', 'document', 'navigator', 'localStorage', 'process'].map((name) => ({
        name,
        message: CORE_BOUNDARY_MESSAGE,
      })),
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  coreBoundary,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
