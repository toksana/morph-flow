import { type CheckInHabitResult, checkInHabitRequestSchema } from '@/core/habits/habitCheckIn';
import { localDay } from '@/core/widgets/promptDate';
import type { UserRecord } from '@/server/db/users';

import { createLogError } from '../logError';

const logError = createLogError('habits');

export interface CheckInHabitDeps {
  /** Clerk user id of the caller, or null for a guest. */
  identify: () => Promise<string | null>;
  /** The caller's row (id and time zone), or null if they have none yet. */
  findUser: (clerkUserId: string) => Promise<UserRecord | null>;
  /** @returns false if the caller has no such live habit */
  setHabitCheckIn: (
    userId: string,
    habitId: string,
    day: string,
    done: boolean,
  ) => Promise<boolean>;
  /** Clock for the user's "today"; injected so tests are deterministic. */
  now?: () => Date;
}

/**
 * Builds the check-in behind the Server Action. The action is a public POST endpoint, so the
 * input is validated and the caller checked on every call; the habit must be theirs. The day is
 * the user's today by their saved time zone, never a day the client sends. Database failures
 * come back as a result, and the client rolls its optimistic check-in back.
 */
export const createCheckInHabit =
  ({ identify, findUser, setHabitCheckIn, now = () => new Date() }: CheckInHabitDeps) =>
  async (input: unknown): Promise<CheckInHabitResult> => {
    const parsed = checkInHabitRequestSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'invalid' };
    const { habitId, done } = parsed.data;
    // Outside the try, like every framework call: Next.js signals through rejections there.
    const clerkUserId = await identify();
    if (clerkUserId === null) return { ok: false, error: 'unauthorized' };
    try {
      const user = await findUser(clerkUserId);
      if (user === null) return { ok: false, error: 'not_found' };
      const today = localDay(now(), user.timeZone);
      const updated = await setHabitCheckIn(user.id, habitId, today, done);
      return updated ? { ok: true } : { ok: false, error: 'not_found' };
    } catch (error) {
      logError('checking in a habit failed', error);
      return { ok: false, error: 'failed' };
    }
  };
