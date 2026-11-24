import type { SavedHabitView } from '@/core/habits/habitCheckIn';
import { countStreak } from '@/core/habits/habitStreak';
import type { HabitWithCheckIns } from '@/server/db/habits';

/**
 * A saved habit as the habits card shows it on the user's `today`: the streak counted from its
 * check-ins, and whether today is one of them. Only what the client renders crosses to it.
 */
export const toSavedHabitView = (
  { id, title, emoji, targetDays, streakBase, startDay, checkInDays }: HabitWithCheckIns,
  today: string,
): SavedHabitView => ({
  id,
  title,
  emoji: emoji ?? undefined,
  streakDays: countStreak({ checkInDays, startDay, streakBase, today }),
  targetDays,
  doneToday: checkInDays.includes(today),
});
