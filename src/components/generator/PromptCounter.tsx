import type { JSX } from 'react';

import type { PromptLengthTone } from '@/core/widgets/promptLimit';
import { cn } from '@/lib/utils';

// Matches the "2,000 max" wording of the limit notice.
const countFormat = new Intl.NumberFormat('en-US');

// A soft tint per tone, so the numbers read as a status badge rather than stray text.
const TONE_CLASS: Record<PromptLengthTone, string> = {
  hidden: 'bg-muted text-muted-foreground opacity-0',
  visible: 'bg-muted text-muted-foreground',
  near: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400',
  over: 'bg-destructive/10 font-medium text-destructive dark:bg-destructive/20',
};

interface PromptCounterProps {
  id: string;
  length: number;
  limit: number;
  tone: PromptLengthTone;
}

/**
 * "537 / 500" pill in the toolbar, left of the send button; fades in from 80% of the limit.
 * Tabular digits keep its width steady while typing.
 */
export const PromptCounter = ({ id, length, limit, tone }: PromptCounterProps): JSX.Element => (
  <span
    id={id}
    aria-hidden={tone === 'hidden'}
    className={cn(
      'rounded-full px-2 py-0.5 text-xs tabular-nums transition-[opacity,color,background-color] duration-300',
      TONE_CLASS[tone],
    )}
  >
    {countFormat.format(length)} / {countFormat.format(limit)}
  </span>
);
