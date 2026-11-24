import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildClerkUserId } from '../test/dbUsers';
import { buildTaskRows } from '../test/taskRows';
import { type LoadSavedTasksDeps, createLoadSavedTasks } from './loadSavedTasks';
import { toSavedTaskView } from './savedTaskView';

const MAX_TASKS = 20;

const signedIn = (overrides: Partial<LoadSavedTasksDeps> = {}) => {
  const clerkUserId = buildClerkUserId();
  const userId = faker.string.uuid();
  const rows = buildTaskRows(faker.number.int({ min: 1, max: MAX_TASKS }));
  const deps = {
    identify: vi.fn(async () => clerkUserId),
    findUserId: vi.fn(async () => userId),
    listTasks: vi.fn(async () => rows),
    ...overrides,
  };
  return { clerkUserId, userId, rows, deps };
};

describe('createLoadSavedTasks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the signed-in user's tasks as views, in the order they were listed", async () => {
    // Arrange
    const { clerkUserId, userId, rows, deps } = signedIn();

    // Act
    const tasks = await createLoadSavedTasks(deps)();

    // Assert
    expect(tasks).toEqual(rows.map(toSavedTaskView));
    expect(deps.findUserId).toHaveBeenCalledWith(clerkUserId);
    expect(deps.listTasks).toHaveBeenCalledWith(userId);
  });

  it('returns null for a guest without touching the database', async () => {
    // Arrange
    const { deps } = signedIn({ identify: async () => null });

    // Act
    const tasks = await createLoadSavedTasks(deps)();

    // Assert
    expect(tasks).toBeNull();
    expect(deps.findUserId).not.toHaveBeenCalled();
    expect(deps.listTasks).not.toHaveBeenCalled();
  });

  it('returns null for a user who has no row yet', async () => {
    // Arrange
    const { deps } = signedIn({ findUserId: async () => null });

    // Act
    const tasks = await createLoadSavedTasks(deps)();

    // Assert
    expect(tasks).toBeNull();
    expect(deps.listTasks).not.toHaveBeenCalled();
  });

  it('logs a failed read and returns null, so the page still renders', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps } = signedIn({
      listTasks: async () => {
        throw new Error(message);
      },
    });

    // Act
    const tasks = await createLoadSavedTasks(deps)();

    // Assert
    expect(tasks).toBeNull();
    expect(consoleError).toHaveBeenCalledWith('[tasks] loading saved tasks failed:', message);
  });
});
