import type { TaskView } from '@/core/widgets/taskList.view';
import type { TaskRow } from '@/server/db/tables/tasks';

/**
 * A saved row as the task list shows it: the database id, `done` derived from `completedAt`, and
 * the all-day due date. Only what the client renders crosses to it, not the owner or timestamps.
 */
export const toSavedTaskView = ({
  id,
  title,
  priority,
  dueDate,
  completedAt,
}: TaskRow): TaskView => ({
  id,
  title,
  done: completedAt !== null,
  priority,
  due: dueDate ?? undefined,
});
