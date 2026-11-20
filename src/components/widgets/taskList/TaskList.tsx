import type { JSX } from 'react';

import type { TaskListView } from '@/core/widgets/taskList.view';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { TaskListHeader } from './TaskListHeader';
import { TaskListItem } from './TaskListItem';

export const DEFAULT_LOCALE = 'en-US';
const EMPTY_LIST_TEXT = 'No tasks yet';
const STREAMING_TEXT = 'Generating tasks…';
const PROGRESS_LABEL = 'Completion';

interface TaskListProps {
  view: TaskListView;
  locale?: string;
  /** While true and empty, the card says it is generating instead of "No tasks yet". */
  isStreaming?: boolean;
}

/** Progress only makes sense once at least one task has streamed in. */
export const TaskList = ({
  view,
  locale = DEFAULT_LOCALE,
  isStreaming = false,
}: TaskListProps): JSX.Element => {
  const hasTasks = view.totalCount > 0;

  return (
    <Card aria-busy={isStreaming}>
      <TaskListHeader view={view} />
      <CardContent className="flex flex-col gap-3">
        {hasTasks ? (
          <>
            <Progress value={view.completionPercent} aria-label={PROGRESS_LABEL} />
            <ul className="divide-y">
              {view.tasks.map((task) => (
                <TaskListItem key={task.id} task={task} locale={locale} />
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isStreaming ? STREAMING_TEXT : EMPTY_LIST_TEXT}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
