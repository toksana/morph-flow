import type { DeepPartial } from './deepPartial';
import { type Task, type TaskList, type TaskPriority, taskSchema } from './taskList.schema';

export interface TaskView {
  id: string;
  title: string;
  done: boolean;
  priority: TaskPriority;
  due?: string;
}

export interface TaskListView {
  title: string;
  tasks: TaskView[];
  doneCount: number;
  totalCount: number;
  completionPercent: number;
}

export const DEFAULT_PRIORITY: TaskPriority = 'medium';
const FALLBACK_ID_PREFIX = 'task';
const PERCENT = 100;

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Treats missing and whitespace-only strings alike: both mean "not streamed yet". */
const nonBlank = (value: string | undefined): string | undefined =>
  value !== undefined && value.trim() !== '' ? value : undefined;

/** A date that is still streaming (e.g. "2026-1") is hidden until it is a full ISO date. */
export const completeDueDate = (value: string | undefined): string | undefined =>
  taskSchema.shape.due.safeParse(value).data;

const toTaskView = (task: DeepPartial<Task> | undefined, index: number): TaskView | null => {
  const title = nonBlank(task?.title);
  if (title === undefined) return null;
  return {
    id: nonBlank(task?.id) ?? `${FALLBACK_ID_PREFIX}-${index}`,
    title,
    done: task?.done ?? false,
    priority: task?.priority ?? DEFAULT_PRIORITY,
    due: completeDueDate(task?.due),
  };
};

/** The model may repeat ids; React keys must stay unique, so later duplicates get a suffix. */
export const ensureUniqueIds = (tasks: TaskView[]): TaskView[] => {
  const seen = new Set<string>();
  return tasks.map((task, index) => {
    const id = seen.has(task.id) ? `${task.id}-${index}` : task.id;
    seen.add(id);
    return id === task.id ? task : { ...task, id };
  });
};

export const sortByPriority = (tasks: TaskView[]): TaskView[] =>
  tasks.toSorted((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

export const completionPercent = (doneCount: number, totalCount: number): number =>
  totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * PERCENT);

export const toTaskListView = (partial: DeepPartial<TaskList> | undefined): TaskListView => {
  const visible = (partial?.tasks ?? [])
    .map(toTaskView)
    .filter((task): task is TaskView => task !== null);
  const tasks = sortByPriority(ensureUniqueIds(visible));
  const doneCount = tasks.filter((task) => task.done).length;

  return {
    title: nonBlank(partial?.title) ?? '',
    tasks,
    doneCount,
    totalCount: tasks.length,
    completionPercent: completionPercent(doneCount, tasks.length),
  };
};
