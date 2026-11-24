import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildTaskViews } from '../test/factories/taskList.factory';

import { applyTaskToggle, toggleTaskRequestSchema } from './taskToggle';

const RANDOM_RUNS = 50;
const MAX_TASKS = 20;

const randomTasks = () => buildTaskViews(faker.number.int({ min: 1, max: MAX_TASKS }));

describe('applyTaskToggle', () => {
  it('sets done on the target only, keeping order and length, for random lists', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const tasks = randomTasks();
      const target = faker.helpers.arrayElement(tasks);
      const done = faker.datatype.boolean();

      // Act
      const result = applyTaskToggle(tasks, { taskId: target.id, done });

      // Assert
      expect(result.map((task) => task.id)).toEqual(tasks.map((task) => task.id));
      result.forEach((task, index) =>
        expect(task).toEqual(task.id === target.id ? { ...tasks[index], done } : tasks[index]),
      );
    });
  });

  it('does not change the list it was given', () => {
    // Arrange
    const tasks = randomTasks();
    const before = structuredClone(tasks);
    const [target] = tasks;

    // Act
    applyTaskToggle(tasks, { taskId: target.id, done: !target.done });

    // Assert
    expect(tasks).toEqual(before);
  });

  it('changes nothing for an id that is not in the list', () => {
    // Arrange
    const tasks = randomTasks();

    // Act
    const result = applyTaskToggle(tasks, { taskId: faker.string.uuid(), done: true });

    // Assert
    expect(result).toEqual(tasks);
  });

  it('returns an empty list for an empty list', () => {
    // Act
    const result = applyTaskToggle([], { taskId: faker.string.uuid(), done: true });

    // Assert
    expect(result).toEqual([]);
  });
});

describe('toggleTaskRequestSchema', () => {
  it('accepts a uuid and a boolean', () => {
    // Arrange
    const request = { taskId: faker.string.uuid(), done: faker.datatype.boolean() };

    // Act
    const parsed = toggleTaskRequestSchema.safeParse(request);

    // Assert
    expect(parsed.data).toEqual(request);
  });

  it.each([
    [undefined],
    [{}],
    [{ taskId: 'task-0', done: true }],
    [{ taskId: '00000000-0000-4000-8000-000000000000', done: 'true' }],
  ])('rejects %j', (input) => {
    // Act
    const parsed = toggleTaskRequestSchema.safeParse(input);

    // Assert
    expect(parsed.success).toBe(false);
  });
});
