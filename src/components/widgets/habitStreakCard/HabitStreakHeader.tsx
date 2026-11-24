import { Target } from 'lucide-react';
import type { JSX } from 'react';

import type { HabitStreakView } from '@/core/widgets/habitStreakCard.view';
import { Badge } from '@/components/ui/badge';

import { WidgetCardHeader } from '../WidgetCardHeader';

const CARD_LABEL = 'Habit streak';

interface HabitStreakHeaderProps {
  view: HabitStreakView;
}

/** Emoji (or a flame), the habit name and, once it has streamed, the target badge. */
export const HabitStreakHeader = ({ view }: HabitStreakHeaderProps): JSX.Element => (
  <WidgetCardHeader
    type="HabitStreakCard"
    label={CARD_LABEL}
    title={view.title}
    icon={view.emoji}
    trailing={
      view.hasProgress && (
        <Badge variant="outline" className="shrink-0 font-mono">
          <Target aria-hidden />
          Target: {view.targetDays}d
        </Badge>
      )
    }
  />
);
