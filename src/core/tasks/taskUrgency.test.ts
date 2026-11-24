import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildTaskView, buildTaskViews } from '../test/factories/taskList.factory';
import type { TaskView } from '../widgets/taskList.view';

import {
  COLLAPSED_LIMIT,
  COLLAPSED_LIMIT_MOBILE,
  type ShowAllVisibility,
  compareByUrgency,
  orderBySnapshot,
  orderByUrgency,
  showAllVisibility,
  snapshotTaskIds,
  topOpenTaskIds,
} from './taskUrgency';

const RANDOM_RUNS = 50;
const MAX_TASKS = 20;

const randomTasks = (): TaskView[] =>
  buildTaskViews(faker.number.int({ min: 0, max: MAX_TASKS })).map((task) =>
    // Few distinct dates, so ties on the due date (and then on priority) really happen.
    ({ ...task, due: faker.helpers.arrayElement([undefined, '2026-12-01', '2026-12-02']) }),
  );

const ids = (tasks: readonly TaskView[]): string[] => tasks.map((task) => task.id);

describe('compareByUrgency', () => {
  it('puts the nearer due date first whatever the priority', () => {
    // Arrange
    const sooner = buildTaskView({ due: '2026-12-01', priority: 'low' });
    const later = buildTaskView({ due: '2026-12-02', priority: 'high' });

    // Act
    const result = compareByUrgency(sooner, later);

    // Assert
    expect(result).toBeLessThan(0);
  });

  it('puts a dated task before one with no due date', () => {
    // Arrange
    const dated = buildTaskView({ due: '2030-01-01', priority: 'low' });
    const undated = buildTaskView({ due: undefined, priority: 'high' });

    // Act
    const result = compareByUrgency(dated, undated);

    // Assert
    expect(result).toBeLessThan(0);
  });

  it('breaks a due-date tie by priority, high first', () => {
    // Arrange
    const due = '2026-12-01';
    const [high, medium, low] = (['high', 'medium', 'low'] as const).map((priority) =>
      buildTaskView({ due, priority }),
    );

    // Act
    const sorted = [low, high, medium].sort(compareByUrgency);

    // Assert
    expect(ids(sorted)).toEqual(ids([high, medium, low]));
  });

  it('returns 0 for the same due date and priority, so creation order wins', () => {
    // Arrange
    const [first, second] = buildTaskViews(2, { due: undefined, priority: 'medium' });

    // Act
    const result = compareByUrgency(first, second);

    // Assert
    expect(result).toBe(0);
  });
});

describe('orderByUrgency', () => {
  it('is a permutation with every open task before every done one, for random lists', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const tasks = randomTasks();

      // Act
      const ordered = orderByUrgency(tasks);

      // Assert
      expect(ids(ordered).toSorted()).toEqual(ids(tasks).toSorted());
      const firstDone = ordered.findIndex((task) => task.done);
      if (firstDone >= 0) ordered.slice(firstDone).forEach((task) => expect(task.done).toBe(true));
    });
  });

  it('keeps every open and every done section sorted by urgency, ties in input order', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const tasks = randomTasks();
      const position = new Map(tasks.map((task, index) => [task.id, index]));

      // Act
      const ordered = orderByUrgency(tasks);

      // Assert
      ordered.slice(1).forEach((task, index) => {
        const previous = ordered[index];
        if (previous.done !== task.done) return;
        const order = compareByUrgency(previous, task);
        expect(order).toBeLessThanOrEqual(0);
        if (order === 0) expect(position.get(previous.id)).toBeLessThan(position.get(task.id)!);
      });
    });
  });

  it('returns an empty list for an empty list', () => {
    // Act
    const ordered = orderByUrgency([]);

    // Assert
    expect(ordered).toEqual([]);
  });
});

describe('topOpenTaskIds', () => {
  it('picks at most limit open tasks, none less urgent than an open task left out', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const tasks = randomTasks();
      const limit = faker.helpers.arrayElement([COLLAPSED_LIMIT, COLLAPSED_LIMIT_MOBILE]);
      const open = tasks.filter((task) => !task.done);

      // Act
      const picked = new Set(topOpenTaskIds(tasks, limit));

      // Assert
      expect(picked.size).toBe(Math.min(limit, open.length));
      const inside = open.filter((task) => picked.has(task.id));
      const outside = open.filter((task) => !picked.has(task.id));
      inside.forEach((kept) =>
        outside.forEach((left) => expect(compareByUrgency(kept, left)).toBeLessThanOrEqual(0)),
      );
    });
  });

  it('picks nothing when every task is done', () => {
    // Arrange
    const tasks = buildTaskViews(faker.number.int({ min: 1, max: MAX_TASKS }), { done: true });

    // Act
    const picked = topOpenTaskIds(tasks, COLLAPSED_LIMIT);

    // Assert
    expect(picked).toEqual([]);
  });

  it('picks nothing from an empty list', () => {
    // Act
    const picked = topOpenTaskIds([], COLLAPSED_LIMIT);

    // Assert
    expect(picked).toEqual([]);
  });
});

describe('showAllVisibility', () => {
  it.each<[number, number, ShowAllVisibility]>([
    [0, 0, 'never'],
    [3, 3, 'never'],
    [4, 4, 'mobileOnly'],
    [5, 5, 'mobileOnly'],
    [6, 6, 'always'],
    [3, 2, 'always'],
    [4, 3, 'always'],
    [1, 0, 'always'],
  ])('with %i tasks, %i of them open: %s', (total, open, expected) => {
    // Act
    const visibility = showAllVisibility(total, open);

    // Assert
    expect(visibility).toBe(expected);
  });
});

describe('orderBySnapshot', () => {
  it('follows the snapshot order and skips ids that are gone', () => {
    // Arrange
    const tasks = buildTaskViews(faker.number.int({ min: 2, max: MAX_TASKS }));
    const snapshot = [faker.string.uuid(), ...faker.helpers.shuffle(ids(tasks))];

    // Act
    const ordered = orderBySnapshot(tasks, snapshot, { includeNew: false });

    // Assert
    expect(ids(ordered)).toEqual(snapshot.slice(1));
  });

  it('shows the current state of each task, e.g. a tick made after the snapshot', () => {
    // Arrange
    const tasks = buildTaskViews(3, { done: false });
    const snapshot = ids(tasks);
    const ticked = tasks.map((task, index) => (index === 1 ? { ...task, done: true } : task));

    // Act
    const ordered = orderBySnapshot(ticked, snapshot, { includeNew: false });

    // Assert
    expect(ordered).toEqual(ticked);
  });

  it('drops tasks the snapshot has never seen, or appends them with includeNew', () => {
    // Arrange
    const known = buildTaskViews(3);
    const added = buildTaskViews(2);
    const tasks = faker.helpers.shuffle([...known, ...added]);
    const snapshot = ids(known);

    // Act
    const collapsed = orderBySnapshot(tasks, snapshot, { includeNew: false });
    const expanded = orderBySnapshot(tasks, snapshot, { includeNew: true });

    // Assert
    expect(ids(collapsed)).toEqual(snapshot);
    expect(ids(expanded)).toEqual([...snapshot, ...ids(tasks.filter((t) => added.includes(t)))]);
  });

  it('returns an empty list for an empty snapshot without includeNew', () => {
    // Act
    const ordered = orderBySnapshot(buildTaskViews(3), [], { includeNew: false });

    // Assert
    expect(ordered).toEqual([]);
  });
});

describe('snapshotTaskIds', () => {
  it('fixes the collapsed set when collapsed and every task in expanded order when expanded', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const tasks = randomTasks();

      // Act
      const collapsed = snapshotTaskIds(tasks, false);
      const expanded = snapshotTaskIds(tasks, true);

      // Assert
      expect(collapsed).toEqual(topOpenTaskIds(tasks, COLLAPSED_LIMIT));
      expect(expanded).toEqual(ids(orderByUrgency(tasks)));
    });
  });
});
