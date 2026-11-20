import { Flame, ListChecks, type LucideIcon } from 'lucide-react';

import type { WidgetType } from '@/core/widgets/widget.schema';

/** One icon per widget type; `satisfies` fails the build when a new widget has none. */
export const WIDGET_ICONS = {
  TaskList: ListChecks,
  HabitStreakCard: Flame,
} as const satisfies Record<WidgetType, LucideIcon>;
