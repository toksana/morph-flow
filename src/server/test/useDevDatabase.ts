import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Points the db tests at the Neon dev branch, and only there: DATABASE_URL is taken from
 * `.env.development.local` and overrides any value already in the environment, so a shell that
 * exports the production URL cannot leak into a test run.
 */
const DEV_ENV_FILE = '.env.development.local';

const readDevDatabaseUrl = (): string => {
  const url = parseEnv(readFileSync(DEV_ENV_FILE, 'utf8')).DATABASE_URL?.trim();
  if (url === undefined || url === '') {
    throw new Error(`db tests need DATABASE_URL for the Neon dev branch in ${DEV_ENV_FILE}`);
  }
  return url;
};

process.env.DATABASE_URL = readDevDatabaseUrl();
