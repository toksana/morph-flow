import type { JSX } from 'react';

import type { SavedHabitView } from '@/core/habits/habitCheckIn';

import { HabitCheckInButton } from './HabitCheckInButton';
import { StreakBadge } from './StreakBadge';

interface SavedHabitRowProps {
  habit: SavedHabitView;
  onCheckIn: (habitId: string, done: boolean) => void;
}

/** The habit's name, its streak and the one-tap check-in, on one line. */
export const SavedHabitRow = ({ habit, onCheckIn }: SavedHabitRowProps): JSX.Element => (
  <li className="flex items-center gap-3 py-2">
    <span className="min-w-0 flex-1 truncate">
      {habit.emoji !== undefined && <span aria-hidden>{habit.emoji} </span>}
      {habit.title}
    </span>
    <StreakBadge streakDays={habit.streakDays} />
    <HabitCheckInButton
      title={habit.title}
      done={habit.doneToday}
      onToggle={() => onCheckIn(habit.id, !habit.doneToday)}
    />
  </li>
);
