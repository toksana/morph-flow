import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/** Holds the Neon dev branch URL, never production's: tests read DATABASE_URL from here only. */
export const DEV_ENV_FILE = '.env.development.local';

export const readDevDatabaseUrl = (): string => {
  const url = parseEnv(readFileSync(DEV_ENV_FILE, 'utf8')).DATABASE_URL?.trim();
  if (url === undefined || url === '') {
    throw new Error(`tests need DATABASE_URL for the Neon dev branch in ${DEV_ENV_FILE}`);
  }
  return url;
};
