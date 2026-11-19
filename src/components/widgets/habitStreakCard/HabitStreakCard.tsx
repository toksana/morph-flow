'use client';

import { type JSX, useState } from 'react';

import type { DeepPartial } from '@/core/widgets/deepPartial';
import type { HabitStreakCard as HabitStreakCardData } from '@/core/widgets/habitStreakCard.schema';
import { toHabitStreakView } from '@/core/widgets/habitStreakCard.view';
import { Card, CardContent } from '@/components/ui/card';

import { CheckInButton } from './CheckInButton';
import { HabitStreakHeader } from './HabitStreakHeader';
import { StreakProgress } from './StreakProgress';
import { StreakSummary } from './StreakSummary';

const EMPTY_TEXT = 'No habit yet';
const STREAMING_TEXT = 'Generating habit…';

interface HabitStreakCardProps {
  /** The card as streamed so far. */
  card: DeepPartial<HabitStreakCardData> | undefined;
  /** While true the check-in is disabled: `completedToday` streams last and would override it. */
  isStreaming?: boolean;
}

/** Streak card with a local "done today" toggle; nothing is saved yet. */
export const HabitStreakCard = ({
  card,
  isStreaming = false,
}: HabitStreakCardProps): JSX.Element => {
  const [todayMark, setTodayMark] = useState<boolean>();
  const view = toHabitStreakView(card, todayMark);

  return (
    <Card aria-busy={isStreaming}>
      <HabitStreakHeader view={view} />
      <CardContent className="flex flex-col gap-5">
        {view.hasProgress ? (
          <>
            <StreakSummary view={view} />
            <StreakProgress view={view} />
            <CheckInButton
              checkedIn={view.completedToday}
              disabled={isStreaming}
              onToggle={() => setTodayMark(!view.completedToday)}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isStreaming ? STREAMING_TEXT : EMPTY_TEXT}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
