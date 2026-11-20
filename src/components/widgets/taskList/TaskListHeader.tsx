import type { JSX } from 'react';

import type { TaskListView } from '@/core/widgets/taskList.view';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { WidgetIconTile } from '../WidgetIconTile';

export const TASK_LIST_LABEL = 'Task list';

interface TaskListHeaderProps {
  view: TaskListView;
}

/**
 * Checklist icon, the list name and, once a task has streamed, the done counter. Laid out like the
 * HabitStreakCard header, so both cards read as one family.
 */
export const TaskListHeader = ({ view }: TaskListHeaderProps): JSX.Element => (
  <CardHeader className="flex items-center gap-3">
    <WidgetIconTile type="TaskList" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <CardDescription className="font-mono text-xs tracking-widest uppercase">
        {TASK_LIST_LABEL}
      </CardDescription>
      {view.title !== '' && <CardTitle className="truncate">{view.title}</CardTitle>}
    </div>
    {view.totalCount > 0 && (
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
        {view.doneCount}/{view.totalCount}
      </span>
    )}
  </CardHeader>
);
