import type { SavedHabitView } from '@/core/habits/habitCheckIn';
import { localDay } from '@/core/widgets/promptDate';
import type { HabitWithCheckIns } from '@/server/db/habits';
import type { UserRecord } from '@/server/db/users';

import { createLogError } from '../logError';
import { toSavedHabitView } from './savedHabitView';

const logError = createLogError('habits');

export interface LoadSavedHabitsDeps {
  /** Clerk user id of the caller, or null for a guest. */
  identify: () => Promise<string | null>;
  /** The caller's row (id and time zone), or null if they have none yet. */
  findUser: (clerkUserId: string) => Promise<UserRecord | null>;
  listHabits: (userId: string) => Promise<HabitWithCheckIns[]>;
  /** Clock for the user's "today"; injected so tests are deterministic. */
  now?: () => Date;
}

/**
 * Builds the loader for the habits card.
 * @returns the caller's live habits in creation order, streaks counted for their today, or null
 * when there is nothing to show: a guest, a user with no row yet, or a failed database read
 * (logged, so the start screen still renders). A failed session read is not caught.
 */
export const createLoadSavedHabits =
  ({ identify, findUser, listHabits, now = () => new Date() }: LoadSavedHabitsDeps) =>
  async (): Promise<SavedHabitView[] | null> => {
    // Outside the try: during a prerender, the session read rejects on purpose to mark the
    // component as request-time, and Next.js must see that rejection.
    const clerkUserId = await identify();
    if (clerkUserId === null) return null;
    try {
      const user = await findUser(clerkUserId);
      if (user === null) return null;
      const today = localDay(now(), user.timeZone);
      return (await listHabits(user.id)).map((habit) => toSavedHabitView(habit, today));
    } catch (error) {
      logError('loading saved habits failed', error);
      return null;
    }
  };
