import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildTaskRow } from '../test/taskRows';
import { toSavedTaskView } from './savedTaskView';

const RANDOM_RUNS = 50;

describe('toSavedTaskView', () => {
  it('keeps the id, title, priority and due date, and is done exactly when completed', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const row = buildTaskRow();

      // Act
      const view = toSavedTaskView(row);

      // Assert
      expect(view).toEqual({
        id: row.id,
        title: row.title,
        done: row.completedAt !== null,
        priority: row.priority,
        due: row.dueDate ?? undefined,
      });
    });
  });

  it('leaves out the owner and timestamps, which the client has no use for', () => {
    // Arrange
    const row = buildTaskRow({ completedAt: faker.date.recent() });

    // Act
    const view = toSavedTaskView(row);

    // Assert
    expect(Object.keys(view).toSorted()).toEqual(['done', 'due', 'id', 'priority', 'title']);
  });

  it('has no due date when the row has none', () => {
    // Arrange
    const row = buildTaskRow({ dueDate: null });

    // Act
    const view = toSavedTaskView(row);

    // Assert
    expect(view.due).toBeUndefined();
  });
});
