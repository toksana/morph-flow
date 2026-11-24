import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildClerkUserId } from '../test/dbUsers';
import { type ToggleTaskDeps, createToggleTask } from './toggleTask';

const buildRequest = () => ({ taskId: faker.string.uuid(), done: faker.datatype.boolean() });

const signedIn = (overrides: Partial<ToggleTaskDeps> = {}) => {
  const clerkUserId = buildClerkUserId();
  const userId = faker.string.uuid();
  const deps = {
    identify: vi.fn(async () => clerkUserId),
    findUserId: vi.fn(async () => userId),
    setTaskCompleted: vi.fn(async () => true),
    ...overrides,
  };
  return { clerkUserId, userId, deps };
};

describe('createToggleTask', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets the task's completion for its owner", async () => {
    // Arrange
    const { clerkUserId, userId, deps } = signedIn();
    const request = buildRequest();

    // Act
    const result = await createToggleTask(deps)(request);

    // Assert
    expect(result).toEqual({ ok: true });
    expect(deps.findUserId).toHaveBeenCalledWith(clerkUserId);
    expect(deps.setTaskCompleted).toHaveBeenCalledWith(userId, request.taskId, request.done);
  });

  it.each([[undefined], [{ taskId: 'task-0', done: true }], [{ taskId: faker.string.uuid() }]])(
    'rejects %j without asking who the caller is',
    async (input) => {
      // Arrange
      const { deps } = signedIn();

      // Act
      const result = await createToggleTask(deps)(input);

      // Assert
      expect(result).toEqual({ ok: false, error: 'invalid' });
      expect(deps.identify).not.toHaveBeenCalled();
      expect(deps.setTaskCompleted).not.toHaveBeenCalled();
    },
  );

  it('refuses a guest without touching the database', async () => {
    // Arrange
    const { deps } = signedIn({ identify: async () => null });

    // Act
    const result = await createToggleTask(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(deps.findUserId).not.toHaveBeenCalled();
    expect(deps.setTaskCompleted).not.toHaveBeenCalled();
  });

  it('reports not_found for a user with no row yet', async () => {
    // Arrange
    const { deps } = signedIn({ findUserId: async () => null });

    // Act
    const result = await createToggleTask(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'not_found' });
    expect(deps.setTaskCompleted).not.toHaveBeenCalled();
  });

  it("reports not_found for a task that is not the caller's live task", async () => {
    // Arrange
    const { deps } = signedIn({ setTaskCompleted: async () => false });

    // Act
    const result = await createToggleTask(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('logs a database failure and reports it instead of throwing', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps } = signedIn({
      setTaskCompleted: async () => {
        throw new Error(message);
      },
    });

    // Act
    const result = await createToggleTask(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'failed' });
    expect(consoleError).toHaveBeenCalledWith('[tasks] toggling a task failed:', message);
  });

  it('lets a failed session read through, so Next.js can defer the read to request time', async () => {
    // Arrange
    const signal = new Error(faker.lorem.sentence());
    const { deps } = signedIn({
      identify: async () => {
        throw signal;
      },
    });

    // Act
    const result = createToggleTask(deps)(buildRequest());

    // Assert
    await expect(result).rejects.toBe(signal);
  });
});
