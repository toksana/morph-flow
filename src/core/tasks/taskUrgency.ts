import type { TaskPriority } from '../widgets/taskList.schema';
import type { TaskView } from '../widgets/taskList.view';

/** Open tasks the collapsed "Your tasks" card shows from the `sm` breakpoint (640px) up. */
export const COLLAPSED_LIMIT = 5;
/** Open tasks it shows on a phone, below `sm`. */
export const COLLAPSED_LIMIT_MOBILE = 3;

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
/** A task without a priority (not possible once saved, but the view allows it) sorts last. */
const NO_PRIORITY_RANK = Object.keys(PRIORITY_RANK).length;

const priorityRank = (task: TaskView): number =>
  task.priority === undefined ? NO_PRIORITY_RANK : PRIORITY_RANK[task.priority];

/** ISO dates sort as strings; a task with no due date comes after every dated one. */
const compareDue = (a: TaskView, b: TaskView): number => {
  if (a.due === b.due) return 0;
  if (a.due === undefined) return 1;
  if (b.due === undefined) return -1;
  return a.due < b.due ? -1 : 1;
};

/**
 * Nearest due date first, then high → low priority. Ties are 0, so a stable sort keeps the
 * creation order the list came in.
 */
export const compareByUrgency = (a: TaskView, b: TaskView): number =>
  compareDue(a, b) || priorityRank(a) - priorityRank(b);

const byUrgency = (tasks: readonly TaskView[]): TaskView[] => [...tasks].sort(compareByUrgency);

/** The expanded order: open tasks by urgency, then done tasks by urgency. */
export const orderByUrgency = (tasks: readonly TaskView[]): TaskView[] => [
  ...byUrgency(tasks.filter((task) => !task.done)),
  ...byUrgency(tasks.filter((task) => task.done)),
];

/** The collapsed set: ids of the `limit` most urgent open tasks, most urgent first. */
export const topOpenTaskIds = (tasks: readonly TaskView[], limit: number): string[] =>
  byUrgency(tasks.filter((task) => !task.done))
    .slice(0, limit)
    .map((task) => task.id);

export type ShowAllVisibility = 'always' | 'mobileOnly' | 'never';

/**
 * Whether "Show all" has anything to reveal. The collapsed card shows at most
 * `COLLAPSED_LIMIT` open tasks (fewer on a phone), so the button is needed when there are more
 * tasks than that, done ones included. A phone shows fewer, so it may need the button alone.
 */
export const showAllVisibility = (totalCount: number, openCount: number): ShowAllVisibility => {
  if (totalCount > Math.min(openCount, COLLAPSED_LIMIT)) return 'always';
  if (totalCount > Math.min(openCount, COLLAPSED_LIMIT_MOBILE)) return 'mobileOnly';
  return 'never';
};

interface SnapshotOrderOptions {
  /** Appends tasks the snapshot has never seen (e.g. synced from another device) at the end. */
  includeNew: boolean;
}

/**
 * The tasks in an order fixed earlier, so a row does not jump when it is ticked. Ids that are
 * gone are skipped; tasks missing from the snapshot are dropped, or appended with `includeNew`.
 */
export const orderBySnapshot = (
  tasks: readonly TaskView[],
  ids: readonly string[],
  { includeNew }: SnapshotOrderOptions,
): TaskView[] => {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ordered = ids.flatMap((id) => byId.get(id) ?? []);
  if (!includeNew) return ordered;
  const known = new Set(ids);
  return [...ordered, ...tasks.filter((task) => !known.has(task.id))];
};
