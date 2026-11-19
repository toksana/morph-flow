import type { JSX } from 'react';

import type { TaskListView } from '@/core/widgets/taskList.view';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { TaskListItem } from './TaskListItem';

export const DEFAULT_LOCALE = 'en-US';
const EMPTY_LIST_TEXT = 'No tasks yet';
const PROGRESS_LABEL = 'Completion';

interface TaskListProps {
  view: TaskListView;
  locale?: string;
}

/** Counter and progress only make sense once at least one task has streamed in. */
export const TaskList = ({ view, locale = DEFAULT_LOCALE }: TaskListProps): JSX.Element => {
  const hasTasks = view.totalCount > 0;
  const hasTitle = view.title !== '';

  return (
    <Card>
      {(hasTitle || hasTasks) && (
        <CardHeader>
          {hasTitle && <CardTitle>{view.title}</CardTitle>}
          {hasTasks && (
            <CardAction className="text-sm text-muted-foreground">
              {view.doneCount}/{view.totalCount}
            </CardAction>
          )}
        </CardHeader>
      )}
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
          <p className="text-sm text-muted-foreground">{EMPTY_LIST_TEXT}</p>
        )}
      </CardContent>
    </Card>
  );
};
