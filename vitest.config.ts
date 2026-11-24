import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.db.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // SQL against the Neon dev branch: opt-in with `pnpm test:db`, kept out of `pnpm test`.
          name: 'db',
          environment: 'node',
          include: ['src/**/*.db.test.ts'],
          setupFiles: ['./src/server/test/useDevDatabase.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setupDom.ts'],
        },
      },
    ],
  },
});
