import type { Database } from './client';
import { users } from './tables/users';

export interface UserIdentity {
  clerkUserId: string;
  /** IANA zone from the request; the latest one wins, so a trip abroad moves "today". */
  timeZone: string;
}

/**
 * Creates the user's row on their first signed-in request and keeps `timeZone` current, in one
 * round trip. The conflict branch always runs, so RETURNING gives the id for new and existing
 * users alike; the `set_updated_at` trigger leaves `updated_at` alone when the zone is unchanged.
 * @returns the user's `users.id`, the owner of their tasks
 */
export const upsertUser = async (
  db: Database,
  { clerkUserId, timeZone }: UserIdentity,
): Promise<string> => {
  const [user] = await db
    .insert(users)
    .values({ clerkUserId, timeZone })
    .onConflictDoUpdate({ target: users.clerkUserId, set: { timeZone } })
    .returning({ id: users.id });
  return user.id;
};
