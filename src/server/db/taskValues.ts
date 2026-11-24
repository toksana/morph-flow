import type { Task } from '@/core/widgets/taskList.schema';

import type { NewTaskRow } from './tables/tasks';

/** What a caller may write to a task; the owner comes from the session, never from here. */
export type TaskValues = Omit<NewTaskRow, 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * A generated task as row values. The widget's `done` becomes `completedAt` (stamped `now`, the
 * moment the card was made), and its all-day `due` date fills `dueDate`. No id: the database
 * hands out uuidv7s in insert order, which keeps the model's order.
 */
export const toTaskValues = (task: Task, now: Date): TaskValues => ({
  title: task.title.trim(),
  priority: task.priority,
  dueDate: task.due ?? null,
  completedAt: task.done ? now : null,
});
