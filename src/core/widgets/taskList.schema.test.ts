import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildTask, buildTaskList, buildTasks } from '../test/factories/taskList.factory';

import { MAX_TASKS, MIN_TASKS, taskListSchema, taskSchema } from './taskList.schema';

const RANDOM_RUNS = 50;

describe('taskListSchema', () => {
  it('accepts every randomly generated valid task list', () => {
    // Arrange
    const lists = Array.from({ length: RANDOM_RUNS }, () => buildTaskList());

    // Act
    const results = lists.map((list) => taskListSchema.safeParse(list).success);

    // Assert
    expect(results).not.toContain(false);
  });

  it.each([MIN_TASKS, MAX_TASKS])('accepts the boundary task count %i', (count) => {
    // Arrange
    const list = buildTaskList({ tasks: buildTasks(count) });

    // Act
    const result = taskListSchema.safeParse(list);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([MIN_TASKS - 1, MAX_TASKS + 1])('rejects the out-of-range task count %i', (count) => {
    // Arrange
    const list = buildTaskList({ tasks: buildTasks(count) });

    // Act
    const result = taskListSchema.safeParse(list);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects a widget type other than TaskList', () => {
    // Arrange
    const list = { ...buildTaskList(), type: faker.lorem.word() };

    // Act
    const result = taskListSchema.safeParse(list);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    // Arrange
    const list = buildTaskList({ title: '' });

    // Act
    const result = taskListSchema.safeParse(list);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('taskSchema', () => {
  it('accepts a task without a due date', () => {
    // Arrange
    const task = buildTask({ due: undefined });

    // Act
    const result = taskSchema.safeParse(task);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects an unknown priority', () => {
    // Arrange
    const task = { ...buildTask(), priority: faker.lorem.word() };

    // Act
    const result = taskSchema.safeParse(task);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each(['2026-13-01', '18.11.2026', 'tomorrow'])('rejects the non-ISO due date %s', (due) => {
    // Arrange
    const task = buildTask({ due });

    // Act
    const result = taskSchema.safeParse(task);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects an empty id', () => {
    // Arrange
    const task = buildTask({ id: '' });

    // Act
    const result = taskSchema.safeParse(task);

    // Assert
    expect(result.success).toBe(false);
  });
});
