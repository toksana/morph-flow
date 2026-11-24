import { faker } from '@faker-js/faker';

import { buildTask } from '@/core/test/factories/taskList.factory';

import type { TaskRow } from '../db/tables/tasks';

/** A saved row as `listTasks` returns it, built without a database. */
export const buildTaskRow = (overrides: Partial<TaskRow> = {}): TaskRow => {
  const { title, done, priority, due } = buildTask();
  const createdAt = faker.date.recent();
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title,
    priority,
    dueDate: due ?? null,
    dueAt: null,
    completedAt: done ? faker.date.between({ from: createdAt, to: new Date() }) : null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    ...overrides,
  };
};

export const buildTaskRows = (count: number): TaskRow[] =>
  Array.from({ length: count }, () => buildTaskRow());
