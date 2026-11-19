import { Check } from 'lucide-react';
import type { JSX } from 'react';

import type { HabitStreakView } from '@/core/widgets/habitStreakCard.view';

const LOGGED_TEXT = 'Logged for today';
const PENDING_TEXT = "Pending today's check-in";

const streakUnit = (days: number): string => (days === 1 ? 'day streak' : 'days streak');

interface StreakSummaryProps {
  view: HabitStreakView;
}

const TodayStatus = ({ checkedIn }: { checkedIn: boolean }): JSX.Element =>
  checkedIn ? (
    <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
      <Check aria-hidden className="size-4" />
      {LOGGED_TEXT}
    </p>
  ) : (
    <p className="text-sm text-amber-600 dark:text-amber-400">{PENDING_TEXT}</p>
  );

/** The streak as a big number, today's check-in status and the share of the goal. */
export const StreakSummary = ({ view }: StreakSummaryProps): JSX.Element => (
  <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
    <div className="flex flex-col gap-1">
      <p className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums">{view.streakDays}</span>
        <span className="text-muted-foreground">{streakUnit(view.streakDays)}</span>
      </p>
      <TodayStatus checkedIn={view.completedToday} />
    </div>
    <span className="pt-2 font-mono text-sm whitespace-nowrap text-muted-foreground">
      {view.goalPercent}% of goal
    </span>
  </div>
);
