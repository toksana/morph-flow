import type { DeepPartial } from './deepPartial';
import {
  type Task,
  type TaskList,
  type TaskPriority,
  taskPrioritySchema,
  taskSchema,
} from './taskList.schema';
import { completionPercent, nonBlank } from './viewUtils';

export interface TaskView {
  /**
   * Identity within one generation, derived from the task's position in the streamed array.
   * Streamed JSON arrays only grow at the end, so a position never changes mid-stream.
   * Persistent ids are assigned by code when tasks are saved, never by the model.
   */
  id: string;
  title: string;
  done: boolean;
  /** Missing until the model has written a full value: a guessed default would change mid-stream. */
  priority?: TaskPriority;
  due?: string;
}

/** Tasks keep the order the model wrote them in: sorting a half-streamed list would make rows jump. */
export interface TaskListView {
  title: string;
  tasks: TaskView[];
  doneCount: number;
  totalCount: number;
  completionPercent: number;
}

const VIEW_ID_PREFIX = 'task';

/** A date that is still streaming (e.g. "2026-1") is hidden until it is a full ISO date. */
export const completeDueDate = (value: string | undefined): string | undefined =>
  taskSchema.shape.due.safeParse(value).data;

/** A priority that has not streamed, or is still a prefix (e.g. "hi"), is hidden until complete. */
export const completePriority = (value: string | undefined): TaskPriority | undefined =>
  taskPrioritySchema.safeParse(value).data;

const toTaskView = (task: DeepPartial<Task> | undefined, index: number): TaskView | null => {
  const title = nonBlank(task?.title);
  if (title === undefined) return null;
  return {
    id: `${VIEW_ID_PREFIX}-${index}`,
    title,
    done: task?.done ?? false,
    priority: completePriority(task?.priority),
    due: completeDueDate(task?.due),
  };
};

export const toTaskListView = (partial: DeepPartial<TaskList> | undefined): TaskListView => {
  const tasks = (partial?.tasks ?? [])
    .map(toTaskView)
    .filter((task): task is TaskView => task !== null);
  const doneCount = tasks.filter((task) => task.done).length;

  return {
    title: nonBlank(partial?.title) ?? '',
    tasks,
    doneCount,
    totalCount: tasks.length,
    completionPercent: completionPercent(doneCount, tasks.length),
  };
};
