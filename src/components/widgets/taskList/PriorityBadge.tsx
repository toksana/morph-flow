import type { VariantProps } from 'class-variance-authority';
import type { JSX } from 'react';

import type { TaskPriority } from '@/core/widgets/taskList.schema';
import { Badge, type badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_VARIANT: Record<TaskPriority, BadgeVariant> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps): JSX.Element => (
  <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>
);
