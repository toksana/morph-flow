import { TASK_LIST_TYPE, type Task } from '@/core/widgets/taskList.schema';
import type { Widget } from '@/core/widgets/widget.schema';

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

/**
 * The row values to save for a generated widget: a TaskList's tasks in the model's order, nothing
 * for other widgets (they have no table yet).
 */
export const generatedTaskValues = (widget: Widget, now: Date): TaskValues[] =>
  widget.type === TASK_LIST_TYPE ? widget.tasks.map((task) => toTaskValues(task, now)) : [];
