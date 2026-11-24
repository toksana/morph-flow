import type { JSX } from 'react';

import type { TaskListView } from '@/core/widgets/taskList.view';

import { WidgetCardHeader } from '../WidgetCardHeader';

export const TASK_LIST_LABEL = 'Task list';

interface TaskListHeaderProps {
  view: TaskListView;
}

/** Checklist icon, the list name and, once a task has streamed, the done counter. */
export const TaskListHeader = ({ view }: TaskListHeaderProps): JSX.Element => (
  <WidgetCardHeader
    type="TaskList"
    label={TASK_LIST_LABEL}
    title={view.title}
    trailing={
      view.totalCount > 0 && (
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {view.doneCount}/{view.totalCount}
        </span>
      )
    }
  />
);
