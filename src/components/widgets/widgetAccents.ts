import { Flame, ListChecks, type LucideIcon } from 'lucide-react';

import type { WidgetType } from '@/core/widgets/widget.schema';

interface WidgetAccent {
  icon: LucideIcon;
  /** Icon color, used on its own (example presets) and inside the header tile. */
  iconClass: string;
  /** Translucent border and fill of the header tile, in the same hue. */
  tileClass: string;
}

/**
 * One icon and one hue per widget type, shared by its header and its example preset so both match.
 * `satisfies` fails the build when a new widget has no accent.
 */
export const WIDGET_ACCENTS = {
  TaskList: {
    icon: ListChecks,
    iconClass: 'text-violet-600 dark:text-violet-400',
    tileClass: 'border-violet-500/30 bg-violet-500/10',
  },
  HabitStreakCard: {
    icon: Flame,
    iconClass: 'text-amber-600 dark:text-amber-400',
    tileClass: 'border-amber-500/30 bg-amber-500/10',
  },
} as const satisfies Record<WidgetType, WidgetAccent>;
