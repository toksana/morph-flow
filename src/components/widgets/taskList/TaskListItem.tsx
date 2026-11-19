import { type JSX, useId } from 'react';

import { formatDueDate } from '@/core/widgets/formatDueDate';
import type { TaskView } from '@/core/widgets/taskList.view';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { PriorityBadge } from './PriorityBadge';

interface TaskListItemProps {
  task: TaskView;
  locale: string;
}

/** Read-only row: the checkbox mirrors the streamed `done` flag and cannot be toggled. */
export const TaskListItem = ({ task, locale }: TaskListItemProps): JSX.Element => {
  const titleId = useId();

  return (
    <li className="flex items-center gap-3 py-2">
      <Checkbox
        checked={task.done}
        disabled
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
      <PriorityBadge priority={task.priority} />
    </li>
  );
};
