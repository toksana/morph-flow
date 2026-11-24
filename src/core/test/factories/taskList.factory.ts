import { faker } from '@faker-js/faker';

import {
  MAX_TASKS,
  MIN_TASKS,
  TASK_LIST_TYPE,
  TASK_PRIORITIES,
  type Task,
  type TaskList,
} from '../../widgets/taskList.schema';
import type { TaskView } from '../../widgets/taskList.view';

const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, ISO_DATE_LENGTH);

export const buildTask = (overrides: Partial<Task> = {}): Task => ({
  title: faker.lorem.sentence({ min: 2, max: 6 }),
  done: faker.datatype.boolean(),
  priority: faker.helpers.arrayElement(TASK_PRIORITIES),
  due: faker.helpers.maybe(() => toIsoDate(faker.date.soon({ days: 14 }))),
  ...overrides,
});

export const buildTasks = (count: number): Task[] =>
  Array.from({ length: count }, () => buildTask());

export const buildTaskList = (overrides: Partial<TaskList> = {}): TaskList => ({
  type: TASK_LIST_TYPE,
  title: faker.lorem.words({ min: 2, max: 4 }),
  tasks: buildTasks(faker.number.int({ min: MIN_TASKS, max: MAX_TASKS })),
  ...overrides,
});

/** A saved task as the client sees it: a database id and every field complete. */
export const buildTaskView = (overrides: Partial<TaskView> = {}): TaskView => {
  const { title, done, priority, due } = buildTask();
  return { id: faker.string.uuid(), title, done, priority, due, ...overrides };
};

export const buildTaskViews = (count: number, overrides: Partial<TaskView> = {}): TaskView[] =>
  Array.from({ length: count }, () => buildTaskView(overrides));
