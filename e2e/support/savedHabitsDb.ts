import { eq } from 'drizzle-orm';

import { localDay } from '../../src/core/widgets/promptDate';
import type { HabitStreakCard } from '../../src/core/widgets/habitStreakCard.schema';
import { getDb } from '../../src/server/db/client';
import { createHabit } from '../../src/server/db/habits';
import { toGeneratedHabit } from '../../src/server/db/habitValues';
import { habits } from '../../src/server/db/tables/habits';
import { upsertUser } from '../../src/server/db/users';

/** The e2e users live in UTC, so "today" in the seed and in the app is the same day. */
const TIME_ZONE = 'UTC';

/**
 * Gives an e2e user exactly these habits, in this order, as if generated today, on the dev
 * branch (see `loadE2eEnv`). Their user row is kept between runs, like a returning user's.
 * @returns the user's `users.id`
 */
export const seedSavedHabits = async (
  clerkUserId: string,
  cards: HabitStreakCard[],
): Promise<string> => {
  const userId = await upsertUser(getDb(), { clerkUserId, timeZone: TIME_ZONE });
  await deleteSavedHabits(userId);
  const today = localDay(new Date(), TIME_ZONE);
  for (const card of cards) await createHabit(getDb(), userId, toGeneratedHabit(card, today));
  return userId;
};

/** Deletes the user's habits; their check-ins go with them (on delete cascade). */
export const deleteSavedHabits = async (userId: string): Promise<void> => {
  await getDb().delete(habits).where(eq(habits.userId, userId));
};
