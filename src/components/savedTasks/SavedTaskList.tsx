'use client';

import type { JSX } from 'react';

import { showAllVisibility } from '@/core/tasks/taskUrgency';
import { type TaskView, summarizeTasks } from '@/core/widgets/taskList.view';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TaskListHeader } from '@/components/widgets/taskList/TaskListHeader';
import { type ToggleTaskAction, useOptimisticTaskToggle } from '@/hooks/useOptimisticTaskToggle';
import { useTaskListExpansion } from '@/hooks/useTaskListExpansion';

import { SavedTaskRows } from './SavedTaskRows';
import { ShowAllButton } from './ShowAllButton';

export const SAVED_TASKS_TITLE = 'Your tasks';
export const SAVE_FAILED_TEXT = "Couldn't save the change. Please try again.";
const PROGRESS_LABEL = 'Completion';

interface SavedTaskListProps {
  /** The saved tasks in creation order, as the server read them. */
  tasks: TaskView[];
  toggleAction: ToggleTaskAction;
}

/** The signed-in user's saved tasks: tick them off, collapsed to the most urgent open ones. */
export const SavedTaskList = ({ tasks, toggleAction }: SavedTaskListProps): JSX.Element => {
  const optimistic = useOptimisticTaskToggle(tasks, toggleAction);
  const { isExpanded, toggleExpanded, visibleTasks } = useTaskListExpansion(optimistic.tasks);
  const summary = summarizeTasks(SAVED_TASKS_TITLE, optimistic.tasks);
  const visibility = showAllVisibility(summary.totalCount, summary.totalCount - summary.doneCount);

  return (
    <Card>
      <TaskListHeader view={summary} />
      <CardContent className="flex flex-col gap-3">
        <Progress value={summary.completionPercent} aria-label={PROGRESS_LABEL} />
        <SavedTaskRows tasks={visibleTasks} isExpanded={isExpanded} onToggle={optimistic.toggle} />
        {visibility !== 'never' && (
          <ShowAllButton
            isExpanded={isExpanded}
            totalCount={summary.totalCount}
            visibility={visibility}
            onToggle={toggleExpanded}
          />
        )}
        {optimistic.hasError && (
          <p role="alert" className="text-sm text-destructive">
            {SAVE_FAILED_TEXT}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
