import type { DeepPartial } from './deepPartial';
import {
  DEFAULT_TARGET_DAYS,
  type HabitStreakCard,
  MIN_TARGET_DAYS,
} from './habitStreakCard.schema';
import { completionPercent, FULL_PERCENT, nonBlank } from './viewUtils';

export interface HabitStreakView {
  title: string;
  emoji?: string;
  /** Streak shown to the user, after the local "done today" mark is applied. */
  streakDays: number;
  targetDays: number;
  completedToday: boolean;
  /** Progress toward the target, capped at 100 once the streak reaches it. */
  goalPercent: number;
  daysLeft: number;
  goalReached: boolean;
  /** Streak and target have both streamed; until then the counters would only show defaults. */
  hasProgress: boolean;
}

/**
 * Adjusts the streamed streak when the user marks today differently from the model:
 * marking adds today to the streak, undoing removes it. Never goes below 0.
 */
export const applyTodayMark = (
  streakDays: number,
  streamedDone: boolean,
  markedDone: boolean,
): number => {
  if (markedDone === streamedDone) return streakDays;
  return Math.max(0, streakDays + (markedDone ? 1 : -1));
};

/** A streak that is already marked done today counts today, whatever the model streamed. */
const includeToday = (streakDays: number, doneToday: boolean): number =>
  doneToday ? Math.max(1, streakDays) : streakDays;

/**
 * @param todayMark the user's local "done today" toggle; `undefined` keeps the streamed value
 */
export const toHabitStreakView = (
  partial: DeepPartial<HabitStreakCard> | undefined,
  todayMark?: boolean,
): HabitStreakView => {
  const streamedDone = partial?.completedToday ?? false;
  const completedToday = todayMark ?? streamedDone;
  const streamedStreak = includeToday(Math.max(0, partial?.streakDays ?? 0), streamedDone);
  const streakDays = applyTodayMark(streamedStreak, streamedDone, completedToday);
  const targetDays = Math.max(MIN_TARGET_DAYS, partial?.targetDays ?? DEFAULT_TARGET_DAYS);

  return {
    title: nonBlank(partial?.title) ?? '',
    emoji: nonBlank(partial?.emoji),
    streakDays,
    targetDays,
    completedToday,
    goalPercent: Math.min(FULL_PERCENT, completionPercent(streakDays, targetDays)),
    daysLeft: Math.max(0, targetDays - streakDays),
    goalReached: streakDays >= targetDays,
    hasProgress: partial?.streakDays !== undefined && partial?.targetDays !== undefined,
  };
};
