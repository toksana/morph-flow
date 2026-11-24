import { Check } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const checkInLabel = (title: string): string => `Check in: ${title}`;

const OPEN_CLASSES =
  'rounded-full text-muted-foreground hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400';
const DONE_CLASSES =
  'rounded-full border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600';

interface HabitCheckInButtonProps {
  title: string;
  done: boolean;
  onToggle: () => void;
}

/**
 * One-tap check-in: an outlined circle that fills emerald once today is done. A toggle button
 * (`aria-pressed`), so the same tap undoes it and screen readers hear the state.
 */
export const HabitCheckInButton = ({
  title,
  done,
  onToggle,
}: HabitCheckInButtonProps): JSX.Element => (
  <Button
    variant="outline"
    size="icon-lg"
    aria-pressed={done}
    aria-label={checkInLabel(title)}
    className={cn('transition-colors', done ? DONE_CLASSES : OPEN_CLASSES)}
    onClick={onToggle}
  >
    <Check aria-hidden strokeWidth={done ? 3 : 2} />
  </Button>
);
