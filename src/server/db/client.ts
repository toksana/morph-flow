import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { readDatabaseUrl } from './databaseUrl';
import * as schema from './schema';

/** One HTTP client per server instance; camelCase fields map to snake_case columns. */
export const db = drizzle(neon(readDatabaseUrl(process.env)), { schema, casing: 'snake_case' });

export type Database = typeof db;
