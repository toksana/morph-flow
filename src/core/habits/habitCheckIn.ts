import { z } from 'zod';

import type { SaveResult } from '../saveResult';
import { applyTodayMark } from '../widgets/habitStreakCard.view';

/** What the client sends to check a saved habit in for today, or to undo today's check-in. */
export const checkInHabitRequestSchema = z.object({
  habitId: z.uuid(),
  done: z.boolean(),
});

export type CheckInHabitRequest = z.infer<typeof checkInHabitRequestSchema>;

export type CheckInHabitResult = SaveResult;

/** A saved habit as the "Habits" card shows it, with the streak already counted for today. */
export interface SavedHabitView {
  id: string;
  title: string;
  emoji?: string;
  streakDays: number;
  /** The streak length the user aims for, so the full HabitStreakCard can show the goal. */
  targetDays: number;
  doneToday: boolean;
}

/**
 * The list with one habit checked in or out for today, everything else as it was: the optimistic
 * update. Checking in adds today to the streak, undoing takes it off again; a request that does
 * not change `doneToday` leaves the streak alone. An id that is not in the list changes nothing.
 */
export const applyHabitCheckIn = (
  habits: readonly SavedHabitView[],
  { habitId, done }: CheckInHabitRequest,
): SavedHabitView[] =>
  habits.map((habit) =>
    habit.id === habitId
      ? {
          ...habit,
          doneToday: done,
          streakDays: applyTodayMark(habit.streakDays, habit.doneToday, done),
        }
      : habit,
  );

export interface HabitsSummary {
  doneCount: number;
  totalCount: number;
}

/** How many habits are done today, for the card's counter. */
export const summarizeHabits = (habits: readonly SavedHabitView[]): HabitsSummary => ({
  doneCount: habits.filter((habit) => habit.doneToday).length,
  totalCount: habits.length,
});
