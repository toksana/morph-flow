import type { JSX } from 'react';

import type { ShowAllVisibility } from '@/core/tasks/taskUrgency';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const SHOW_LESS_TEXT = 'Show less';
export const showAllText = (totalCount: number): string => `Show all (${totalCount})`;

interface ShowAllButtonProps {
  isExpanded: boolean;
  totalCount: number;
  /** `mobileOnly`: a wider screen already shows every task, so the button hides from `sm` up. */
  visibility: Exclude<ShowAllVisibility, 'never'>;
  onToggle: () => void;
}

export const ShowAllButton = ({
  isExpanded,
  totalCount,
  visibility,
  onToggle,
}: ShowAllButtonProps): JSX.Element => (
  <Button
    variant="ghost"
    size="sm"
    aria-expanded={isExpanded}
    className={cn('self-start', visibility === 'mobileOnly' && 'sm:hidden')}
    onClick={onToggle}
  >
    {isExpanded ? SHOW_LESS_TEXT : showAllText(totalCount)}
  </Button>
);
