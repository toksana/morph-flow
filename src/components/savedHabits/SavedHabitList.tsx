'use client';

import type { JSX } from 'react';

import { type SavedHabitView, summarizeHabits } from '@/core/habits/habitCheckIn';
import { SAVE_FAILED_TEXT } from '@/components/savedTasks/SavedTaskList';
import { Card, CardContent } from '@/components/ui/card';
import { WidgetCardHeader } from '@/components/widgets/WidgetCardHeader';
import {
  type CheckInHabitAction,
  useOptimisticHabitCheckIn,
} from '@/hooks/useOptimisticHabitCheckIn';

import { SavedHabitRow } from './SavedHabitRow';

export const SAVED_HABITS_LABEL = 'Habits';
export const SAVED_HABITS_TITLE = 'Daily streaks';

interface SavedHabitListProps {
  /** The saved habits in creation order, streaks counted for the user's today. */
  habits: SavedHabitView[];
  checkInAction: CheckInHabitAction;
}

/**
 * The signed-in user's habits on one compact card: each streak and a one-tap check-in for today.
 * Rows keep creation order, so a check-in never moves one.
 */
export const SavedHabitList = ({ habits, checkInAction }: SavedHabitListProps): JSX.Element => {
  const optimistic = useOptimisticHabitCheckIn(habits, checkInAction);
  const { doneCount, totalCount } = summarizeHabits(optimistic.habits);

  return (
    <Card>
      <WidgetCardHeader
        type="HabitStreakCard"
        label={SAVED_HABITS_LABEL}
        title={SAVED_HABITS_TITLE}
        trailing={
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {doneCount}/{totalCount}
          </span>
        }
      />
      <CardContent className="flex flex-col gap-3">
        <ul className="divide-y">
          {optimistic.habits.map((habit) => (
            <SavedHabitRow key={habit.id} habit={habit} onCheckIn={optimistic.checkIn} />
          ))}
        </ul>
        {optimistic.hasError && (
          <p role="alert" className="text-sm text-destructive">
            {SAVE_FAILED_TEXT}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
