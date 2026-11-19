import type { JSX } from 'react';

import type { HabitStreakView } from '@/core/widgets/habitStreakCard.view';
import { Progress } from '@/components/ui/progress';

export const STREAK_PROGRESS_LABEL = 'Progress to goal';

/**
 * Solid amber while today is pending, an amber-to-green gradient once checked in.
 * Tailwind needs literal class names, so the indicator selector is spelled out in each class.
 */
const INDICATOR_CLASSES = [
  'h-2',
  '[&>[data-slot=progress-indicator]]:bg-amber-500',
  'data-[checked-in=true]:[&>[data-slot=progress-indicator]]:bg-linear-to-r',
  'data-[checked-in=true]:[&>[data-slot=progress-indicator]]:from-amber-500',
  'data-[checked-in=true]:[&>[data-slot=progress-indicator]]:via-orange-500',
  'data-[checked-in=true]:[&>[data-slot=progress-indicator]]:to-emerald-400',
].join(' ');

interface StreakProgressProps {
  view: HabitStreakView;
}

export const StreakProgress = ({ view }: StreakProgressProps): JSX.Element => (
  <div className="flex flex-col gap-2">
    <Progress
      value={view.goalPercent}
      aria-label={STREAK_PROGRESS_LABEL}
      data-checked-in={view.completedToday}
      className={INDICATOR_CLASSES}
    />
    <div className="flex justify-between font-mono text-xs text-muted-foreground">
      <span>Day 1</span>
      <span>Day {view.targetDays}</span>
    </div>
  </div>
);
