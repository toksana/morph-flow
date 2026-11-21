import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { readDatabaseUrl } from './databaseUrl';
import * as schema from './schema';

const createDb = () =>
  drizzle(neon(readDatabaseUrl(process.env)), { schema, casing: 'snake_case' });

export type Database = ReturnType<typeof createDb>;

let instance: Database | undefined;

/**
 * One HTTP client per server instance, created on first use rather than at import, so
 * `next build` and tests that never touch the database do not need DATABASE_URL.
 */
export const getDb = (): Database => {
  instance ??= createDb();
  return instance;
};
