import { defineConfig } from 'drizzle-kit';

import { readDatabaseUrl } from './src/server/db/databaseUrl';

/**
 * drizzle-kit does not read Next.js env files, so load them in Next's dev priority. The
 * dev branch URL lives in `.env.development.local` (`vercel env pull` rewrites `.env.local`).
 * `loadEnvFile` never overrides a variable that is already set, so the first file wins.
 */
const ENV_FILES = ['.env.development.local', '.env.local'];

const loadOptionalEnvFile = (file: string): void => {
  try {
    process.loadEnvFile(file);
  } catch (error) {
    // A missing file is fine in CI, where DATABASE_URL comes from the environment.
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
      throw error;
    }
  }
};

ENV_FILES.forEach(loadOptionalEnvFile);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: { url: readDatabaseUrl(process.env) },
  strict: true,
  verbose: true,
});
