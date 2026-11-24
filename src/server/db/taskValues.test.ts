import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { buildTask, buildTaskList } from '@/core/test/factories/taskList.factory';

import { generatedTaskValues, toTaskValues } from './taskValues';

const RANDOM_RUNS = 20;

describe('toTaskValues', () => {
  it('maps every generated task: done to completedAt, due to dueDate, title and priority as is', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const now = faker.date.recent();
      const task = buildTask();

      // Act
      const values = toTaskValues(task, now);

      // Assert
      expect(values).toEqual({
        title: task.title,
        priority: task.priority,
        dueDate: task.due ?? null,
        completedAt: task.done ? now : null,
      });
    });
  });

  it('leaves an open task without completedAt and a task without due date without dueDate', () => {
    // Arrange
    const open = buildTask({ done: false, due: undefined });

    // Act
    const values = toTaskValues(open, faker.date.recent());

    // Assert
    expect(values.completedAt).toBeNull();
    expect(values.dueDate).toBeNull();
  });

  it('trims the title, so padding never reaches the not-blank check', () => {
    // Arrange
    const title = faker.lorem.words(3);

    // Act
    const values = toTaskValues(buildTask({ title: `  ${title}\n` }), faker.date.recent());

    // Assert
    expect(values.title).toBe(title);
  });
});

describe('generatedTaskValues', () => {
  it("maps every task of a TaskList, in the model's order", () => {
    // Arrange
    const now = faker.date.recent();
    const taskList = buildTaskList();

    // Act
    const values = generatedTaskValues(taskList, now);

    // Assert
    expect(values).toEqual(taskList.tasks.map((task) => toTaskValues(task, now)));
  });

  it('gives no tasks for a widget that is not a TaskList', () => {
    // Act
    const values = generatedTaskValues(buildHabitStreakCard(), faker.date.recent());

    // Assert
    expect(values).toEqual([]);
  });
});
