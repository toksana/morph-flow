import { sql } from 'drizzle-orm';

import type { Database } from './client';
import { users } from './tables/users';

export interface UserIdentity {
  clerkUserId: string;
  /** IANA zone from the request; the latest one wins, so a trip abroad moves "today". */
  timeZone: string;
}

/**
 * Creates the user's row on their first signed-in request and keeps `timeZone` current.
 * One round trip; rows whose zone already matches are left untouched.
 */
export const upsertUser = async (
  db: Database,
  { clerkUserId, timeZone }: UserIdentity,
): Promise<void> => {
  await db
    .insert(users)
    .values({ clerkUserId, timeZone })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      // `$onUpdate` does not fire inside ON CONFLICT, so the timestamp is set explicitly.
      set: { timeZone, updatedAt: sql`now()` },
      setWhere: sql`${users.timeZone} is distinct from excluded.time_zone`,
    });
};
