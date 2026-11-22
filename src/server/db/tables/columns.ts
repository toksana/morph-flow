import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/** Time-ordered UUID (Postgres 18 `uuidv7()`), so ids sort by creation and index well. */
export const uuidV7PrimaryKey = () =>
  uuid()
    .primaryKey()
    .default(sql`uuidv7()`);

const timestampTz = () => timestamp({ withTimezone: true, mode: 'date' });

/**
 * Server clock on insert and on every update, never the client's: `updatedAt` is the cursor
 * the future sync pull reads, so device clock skew must not move it. Updates are stamped by the
 * `set_updated_at` trigger (migration 0001), which every table with these columns must attach.
 */
export const auditTimestamps = {
  createdAt: timestampTz().notNull().defaultNow(),
  updatedAt: timestampTz().notNull().defaultNow(),
};
