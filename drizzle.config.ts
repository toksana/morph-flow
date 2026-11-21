import { defineConfig } from 'drizzle-kit';

import { readDatabaseUrl } from './src/server/db/databaseUrl';

// drizzle-kit does not read Next.js env files; `vercel env pull` writes the URL here.
const ENV_FILE = '.env.local';

try {
  process.loadEnvFile(ENV_FILE);
} catch (error) {
  // Missing file is fine in CI, where DATABASE_URL comes from the environment.
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
    throw error;
  }
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: { url: readDatabaseUrl(process.env) },
  strict: true,
  verbose: true,
});
