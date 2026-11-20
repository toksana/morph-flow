import { Flame, Target } from 'lucide-react';
import type { JSX } from 'react';

import type { HabitStreakView } from '@/core/widgets/habitStreakCard.view';
import { Badge } from '@/components/ui/badge';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { WidgetIconTile } from '../WidgetIconTile';

const CARD_LABEL = 'Habit streak';

interface HabitStreakHeaderProps {
  view: HabitStreakView;
}

/**
 * Emoji (or a flame), the habit name and, once it has streamed, the target badge.
 * A flex row instead of CardAction: CardHeader's grid would put the badge over the title column.
 */
export const HabitStreakHeader = ({ view }: HabitStreakHeaderProps): JSX.Element => (
  <CardHeader className="flex items-center gap-3">
    <WidgetIconTile className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
      {view.emoji ?? <Flame className="size-5" />}
    </WidgetIconTile>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <CardDescription className="font-mono text-xs tracking-widest uppercase">
        {CARD_LABEL}
      </CardDescription>
      {view.title !== '' && <CardTitle className="truncate">{view.title}</CardTitle>}
    </div>
    {view.hasProgress && (
      <Badge variant="outline" className="shrink-0 font-mono">
        <Target aria-hidden />
        Target: {view.targetDays}d
      </Badge>
    )}
  </CardHeader>
);
