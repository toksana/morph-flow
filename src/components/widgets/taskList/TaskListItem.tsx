import { type JSX, useId } from 'react';

import { formatDueDate } from '@/core/widgets/formatDueDate';
import type { TaskView } from '@/core/widgets/taskList.view';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { PriorityBadge } from './PriorityBadge';

interface TaskListItemProps {
  task: TaskView;
  locale: string;
  /** Makes the checkbox clickable; without it the row only mirrors `done` (a streamed card). */
  onToggle?: (taskId: string, done: boolean) => void;
  className?: string;
}

export const TaskListItem = ({
  task,
  locale,
  onToggle,
  className,
}: TaskListItemProps): JSX.Element => {
  const titleId = useId();

  return (
    <li className={cn('flex items-center gap-3 py-2', className)}>
      <Checkbox
        checked={task.done}
        disabled={onToggle === undefined}
        onCheckedChange={(checked) => onToggle?.(task.id, checked === true)}
        aria-labelledby={titleId}
        className="disabled:cursor-default disabled:opacity-100"
      />
      <span
        id={titleId}
        className={cn('min-w-0 flex-1 truncate', task.done && 'text-muted-foreground line-through')}
      >
        {task.title}
      </span>
      {task.due !== undefined && (
        <time dateTime={task.due} className="shrink-0 text-xs text-muted-foreground">
          {formatDueDate(task.due, locale)}
        </time>
      )}
      {task.priority !== undefined && <PriorityBadge priority={task.priority} />}
    </li>
  );
};
