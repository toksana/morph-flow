import {
  type CheckInHabitRequest,
  type SavedHabitView,
  applyHabitCheckIn,
} from '@/core/habits/habitCheckIn';

import { type SaveAction, useOptimisticToggle } from './useOptimisticToggle';

export type CheckInHabitAction = SaveAction<CheckInHabitRequest>;

export interface OptimisticHabitCheckIn {
  /** The saved habits with every check-in still in flight already applied, streaks included. */
  habits: SavedHabitView[];
  checkIn: (habitId: string, done: boolean) => void;
  /** True after a check-in that was not saved; cleared by the next one. */
  hasError: boolean;
}

/** Checks a saved habit in (or out) at once and saves it in the background; a failure rolls back. */
export const useOptimisticHabitCheckIn = (
  habits: SavedHabitView[],
  action: CheckInHabitAction,
): OptimisticHabitCheckIn => {
  const { items, toggle, hasError } = useOptimisticToggle(habits, {
    apply: applyHabitCheckIn,
    action,
    scope: 'habits',
  });
  return { habits: items, checkIn: (habitId, done) => toggle({ habitId, done }), hasError };
};
