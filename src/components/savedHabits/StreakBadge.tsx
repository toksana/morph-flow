import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';

interface StreakBadgeProps {
  streakDays: number;
}

export const streakLabel = (streakDays: number): string => `${streakDays}-day streak`;

/** The streak in a few characters, e.g. "🔥 12d"; screen readers hear "12-day streak". */
export const StreakBadge = ({ streakDays }: StreakBadgeProps): JSX.Element => (
  <Badge
    variant="outline"
    aria-label={streakLabel(streakDays)}
    className="shrink-0 font-mono tabular-nums"
  >
    <span aria-hidden>🔥 {streakDays}d</span>
  </Badge>
);
