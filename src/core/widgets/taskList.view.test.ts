import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildTask, buildTaskList, buildTasks } from '../test/factories/taskList.factory';

import { MAX_TASKS, type TaskPriority } from './taskList.schema';
import {
  completeDueDate,
  DEFAULT_PRIORITY,
  sortByPriority,
  toTaskListView,
  type TaskView,
} from './taskList.view';

const RANDOM_RUNS = 50;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;
const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low'];

const buildTaskView = (overrides: Partial<TaskView> = {}): TaskView => {
  const { due, ...task } = buildTask();
  return { id: faker.string.uuid(), ...task, ...(due ? { due } : {}), ...overrides };
};

describe('completeDueDate', () => {
  it('keeps every complete ISO date as-is', () => {
    // Arrange
    const dates = Array.from({ length: RANDOM_RUNS }, () =>
      faker.date.soon({ days: 365 }).toISOString().slice(0, ISO_DATE_LENGTH),
    );

    // Act
    const results = dates.map(completeDueDate);

    // Assert
    expect(results).toEqual(dates);
  });

  it('hides every strict prefix of a date that is still streaming', () => {
    // Arrange
    const date = faker.date.soon({ days: 365 }).toISOString().slice(0, ISO_DATE_LENGTH);
    const prefixes = Array.from({ length: ISO_DATE_LENGTH }, (_, length) => date.slice(0, length));

    // Act
    const results = prefixes.map(completeDueDate);

    // Assert
    results.forEach((result) => expect(result).toBeUndefined());
  });

  it.each([[undefined], ['   '], ['2026-13-01'], ['not a date']])(
    'returns undefined for %j',
    (value) => {
      // Act
      const result = completeDueDate(value);

      // Assert
      expect(result).toBeUndefined();
    },
  );
});

describe('sortByPriority', () => {
  it('orders random tasks from high to low priority', () => {
    // Arrange
    const tasks = Array.from({ length: MAX_TASKS }, () => buildTaskView());

    // Act
    const ranks = sortByPriority(tasks).map((task) => PRIORITY_ORDER.indexOf(task.priority));

    // Assert
    expect(ranks).toEqual(ranks.toSorted((a, b) => a - b));
  });

  it('keeps the original order of tasks with equal priority', () => {
    // Arrange
    const tasks = Array.from({ length: 5 }, () => buildTaskView({ priority: 'medium' }));

    // Act
    const sorted = sortByPriority(tasks);

    // Assert
    expect(sorted.map((task) => task.id)).toEqual(tasks.map((task) => task.id));
  });
});

describe('toTaskListView', () => {
  it('returns an empty view for an object that has not started streaming', () => {
    // Act
    const view = toTaskListView(undefined);

    // Assert
    expect(view).toEqual({
      title: '',
      tasks: [],
      doneCount: 0,
      totalCount: 0,
      completionPercent: 0,
    });
  });

  it.each([[undefined], [''], ['   ']])('falls back to an empty title for title=%j', (title) => {
    // Act
    const view = toTaskListView({ title });

    // Assert
    expect(view.title).toBe('');
  });

  it('hides a due date that is still streaming', () => {
    // Arrange
    const partial = { tasks: [{ title: faker.lorem.words(3), due: '2026-1' }] };

    // Act
    const [task] = toTaskListView(partial).tasks;

    // Assert
    expect(task.due).toBeUndefined();
  });

  it('keeps counts consistent with the tasks for random lists', () => {
    // Arrange
    const lists = Array.from({ length: RANDOM_RUNS }, () => buildTaskList());

    // Act
    const views = lists.map(toTaskListView);

    // Assert
    views.forEach((view, index) => {
      expect(view.totalCount).toBe(lists[index].tasks.length);
      expect(view.doneCount).toBe(view.tasks.filter((task) => task.done).length);
      expect(new Set(view.tasks.map((task) => task.id)).size).toBe(view.totalCount);
    });
  });

  it('drops tasks whose title has not streamed yet', () => {
    // Arrange
    const title = faker.lorem.words(3);
    const partial = { tasks: [undefined, {}, { title: '  ' }, { title }] };

    // Act
    const view = toTaskListView(partial);

    // Assert
    expect(view.tasks.map((task) => task.title)).toEqual([title]);
  });

  it('keys every task by its streamed position, not by its sorted position', () => {
    // Arrange
    const tasks = [
      buildTask({ priority: 'low' }),
      buildTask({ priority: 'high' }),
      buildTask({ priority: 'medium' }),
    ];

    // Act
    const view = toTaskListView(buildTaskList({ tasks }));

    // Assert
    expect(view.tasks.map((task) => [task.id, task.title])).toEqual([
      ['task-1', tasks[1].title],
      ['task-2', tasks[2].title],
      ['task-0', tasks[0].title],
    ]);
  });

  it('keeps the ids of streamed tasks stable as more tasks arrive', () => {
    // Arrange
    const tasks = buildTaskList().tasks;
    const titlesById = (count: number): Map<string, string> =>
      new Map(
        toTaskListView({ tasks: tasks.slice(0, count) }).tasks.map((task) => [task.id, task.title]),
      );

    // Act
    const snapshots = tasks.map((_, index) => titlesById(index + 1));

    // Assert
    snapshots.slice(1).forEach((snapshot, index) => {
      snapshots[index].forEach((title, id) => expect(snapshot.get(id)).toBe(title));
    });
  });

  it('keeps a whitespace-padded title that has visible characters', () => {
    // Arrange
    const title = ` ${faker.lorem.words(3)} `;

    // Act
    const [task] = toTaskListView({ tasks: [{ title }] }).tasks;

    // Assert
    expect(task.title).toBe(title);
  });

  it('fills defaults for fields that have not streamed yet', () => {
    // Arrange
    const title = faker.lorem.words(3);

    // Act
    const [task] = toTaskListView({ tasks: [{ title }] }).tasks;

    // Assert
    expect(task).toEqual({
      id: 'task-0',
      title,
      done: false,
      priority: DEFAULT_PRIORITY,
      due: undefined,
    });
  });

  it.each([
    [true, 100],
    [false, 0],
  ])('reports done=%s for every task as %i percent', (done, expected) => {
    // Arrange
    const tasks = buildTasks(faker.number.int({ min: 1, max: MAX_TASKS })).map((task) => ({
      ...task,
      done,
    }));

    // Act
    const view = toTaskListView(buildTaskList({ tasks }));

    // Assert
    expect(view.completionPercent).toBe(expected);
  });
});
