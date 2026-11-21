import { pgTable, text } from 'drizzle-orm/pg-core';

import { auditTimestamps, uuidV7PrimaryKey } from './columns';

/**
 * Our own user row. Identity (passwords, Google tokens) stays in Clerk; this holds only what
 * our domain needs. Own `id` so foreign keys survive a change of auth provider.
 */
export const users = pgTable('users', {
  id: uuidV7PrimaryKey(),
  /** Clerk's `user_…` id: the link to the auth provider, looked up on every request. */
  clerkUserId: text().notNull().unique('users_clerk_user_id_unique'),
  /** Display cache of the primary email; Clerk is the source of truth, users may have none. */
  email: text(),
  /** IANA zone, e.g. "Europe/Berlin": defines the user's "today" for habits and due dates. */
  timeZone: text().notNull(),
  ...auditTimestamps,
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
