import { z } from 'zod';

export const HABIT_STREAK_CARD_TYPE = 'HabitStreakCard';
export const MIN_TARGET_DAYS = 1;
export const MAX_TARGET_DAYS = 365;
export const DEFAULT_TARGET_DAYS = 7;

export const habitStreakCardSchema = z.object({
  type: z.literal(HABIT_STREAK_CARD_TYPE),
  title: z
    .string()
    .min(1)
    .describe('Short habit name in the user language, under 6 words, e.g. "Read 20 minutes".'),
  emoji: z.string().optional().describe('Optional single emoji that represents the habit.'),
  streakDays: z
    .int()
    .min(0)
    .describe(
      'Consecutive days the habit was done, including today only if completedToday is true. 0 if the user gives none.',
    ),
  targetDays: z
    .int()
    .min(MIN_TARGET_DAYS)
    .max(MAX_TARGET_DAYS)
    .describe(
      `Streak length the user aims for, e.g. 30 for "30-day challenge". ${DEFAULT_TARGET_DAYS} if the user gives none.`,
    ),
  completedToday: z.boolean().describe('Whether the user says the habit is already done today.'),
});

export type HabitStreakCard = z.infer<typeof habitStreakCardSchema>;
