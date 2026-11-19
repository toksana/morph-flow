import { Check, Sparkles } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const CHECK_IN_TEXT = 'Check-in today';
export const UNDO_TEXT = 'Completed today · Click to undo';

const CHECKED_IN_CLASSES =
  'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20';

interface CheckInButtonProps {
  checkedIn: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/** One button for both directions; its label always says what a click will do. */
export const CheckInButton = ({
  checkedIn,
  disabled,
  onToggle,
}: CheckInButtonProps): JSX.Element =>
  checkedIn ? (
    <Button
      variant="outline"
      size="lg"
      className={cn('h-11 w-full', CHECKED_IN_CLASSES)}
      disabled={disabled}
      onClick={onToggle}
    >
      <Check aria-hidden />
      {UNDO_TEXT}
    </Button>
  ) : (
    <Button size="lg" className="h-11 w-full" disabled={disabled} onClick={onToggle}>
      <Sparkles aria-hidden className="text-amber-500" />
      {CHECK_IN_TEXT}
    </Button>
  );
