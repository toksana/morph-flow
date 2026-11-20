import type { JSX } from 'react';

import type { TaskPriority } from '@/core/widgets/taskList.schema';
import { Badge } from '@/components/ui/badge';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// Soft pastels: a light tint, saturated text (700 shades keep 4.5:1 contrast at badge size) and a
// faint border. In the dark theme the tint is a translucent wash of the same hue, so it sits on the
// card instead of glowing.
const PRIORITY_CLASS: Record<TaskPriority, string> = {
  high: 'border-red-200/60 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
  medium:
    'border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  low: 'border-sky-200/60 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps): JSX.Element => (
  <Badge variant="outline" className={PRIORITY_CLASS[priority]}>
    {PRIORITY_LABEL[priority]}
  </Badge>
);
