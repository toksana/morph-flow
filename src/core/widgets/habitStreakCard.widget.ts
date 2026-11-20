import {
  DEFAULT_TARGET_DAYS,
  HABIT_STREAK_CARD_TYPE,
  habitStreakCardSchema,
} from './habitStreakCard.schema';
import type { WidgetDefinition } from './widgetDefinition';

export const habitStreakCardWidget = {
  type: HABIT_STREAK_CARD_TYPE,
  schema: habitStreakCardSchema,
  whenToUse:
    'Tracking one repeated habit, a streak or an N-day challenge (e.g. "track my daily run", "30-day reading challenge").',
  rules: [
    'Take streakDays from the request; use 0 when the user gives no streak, never invent one.',
    'Set completedToday to true only when the user says the habit is already done today.',
    `Take targetDays from a challenge length or goal the user names; otherwise use ${DEFAULT_TARGET_DAYS}.`,
  ],
} as const satisfies WidgetDefinition<typeof HABIT_STREAK_CARD_TYPE, typeof habitStreakCardSchema>;
