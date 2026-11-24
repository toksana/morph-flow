import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { readDevDatabaseUrl } from '../../src/server/test/devDatabaseUrl';

/** Where `.env.example` tells developers to put the Clerk keys. */
const LOCAL_ENV_FILE = '.env.local';
/** Only these names are taken from it: the e2e run needs nothing else from that file. */
const CLERK_KEYS = ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'] as const;

const readLocalClerkKeys = (): Partial<Record<(typeof CLERK_KEYS)[number], string>> => {
  if (!existsSync(LOCAL_ENV_FILE)) return {};
  const parsed = parseEnv(readFileSync(LOCAL_ENV_FILE, 'utf8'));
  return Object.fromEntries(CLERK_KEYS.flatMap((key) => (parsed[key] ? [[key, parsed[key]]] : [])));
};

/**
 * Prepares the environment of the Playwright run and the server it starts. The Clerk keys come
 * from the shell (CI) or `.env.local`; DATABASE_URL is always the Neon dev branch, overriding
 * any other value, so neither the seeding code nor the app under test can reach production.
 * @returns the dev database URL, for the web server's environment
 */
export const loadE2eEnv = (): string => {
  Object.entries(readLocalClerkKeys()).forEach(([key, value]) => {
    process.env[key] ??= value;
  });
  const databaseUrl = readDevDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
};
