import {
  HABIT_STREAK_CARD_TYPE,
  type HabitStreakCard,
} from '@/core/widgets/habitStreakCard.schema';
import { nonBlank } from '@/core/widgets/viewUtils';
import type { Widget } from '@/core/widgets/widget.schema';

import type { NewHabitRow } from './tables/habits';

/** What a caller may write to a habit; the owner comes from the session, never from here. */
export type HabitValues = Omit<NewHabitRow, 'userId' | 'createdAt' | 'updatedAt'>;

/** A generated habit as a row, plus today's check-in when the user said it is already done. */
export interface GeneratedHabit {
  values: HabitValues;
  /** The day to check in on save, or null when today is not done yet. */
  checkInDay: string | null;
}

/**
 * A generated HabitStreakCard as row values on the user's `today`. The model's `streakDays`
 * includes today only when `completedToday`, so today becomes a check-in and the rest of the
 * streak the base: either way the counted streak starts out as the model wrote it.
 */
export const toGeneratedHabit = (card: HabitStreakCard, today: string): GeneratedHabit => ({
  values: {
    title: card.title.trim(),
    emoji: nonBlank(card.emoji)?.trim() ?? null,
    targetDays: card.targetDays,
    streakBase: Math.max(0, card.streakDays - (card.completedToday ? 1 : 0)),
    startDay: today,
  },
  checkInDay: card.completedToday ? today : null,
});

/** The habit to save for a generated widget: a HabitStreakCard's, null for other widgets. */
export const generatedHabit = (widget: Widget, today: string): GeneratedHabit | null =>
  widget.type === HABIT_STREAK_CARD_TYPE ? toGeneratedHabit(widget, today) : null;
