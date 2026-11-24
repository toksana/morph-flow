import { useState } from 'react';

import { orderBySnapshot, snapshotTaskIds } from '@/core/tasks/taskUrgency';
import type { TaskView } from '@/core/widgets/taskList.view';

export interface TaskListExpansion {
  isExpanded: boolean;
  toggleExpanded: () => void;
  /** The rows to show, in the order fixed when the current view was entered. */
  visibleTasks: TaskView[];
}

/**
 * Collapsed (the most urgent open tasks) or expanded (all of them). Each view fixes its rows
 * when it is entered, so a ticked row stays in place instead of jumping or vanishing. The fixed
 * ids are client state: they survive a refresh, and reset when the list mounts again.
 */
export const useTaskListExpansion = (tasks: TaskView[]): TaskListExpansion => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState(() => snapshotTaskIds(tasks, false));

  const toggleExpanded = (): void => {
    setSnapshot(snapshotTaskIds(tasks, !isExpanded));
    setIsExpanded(!isExpanded);
  };

  return {
    isExpanded,
    toggleExpanded,
    visibleTasks: orderBySnapshot(tasks, snapshot, { includeNew: isExpanded }),
  };
};
