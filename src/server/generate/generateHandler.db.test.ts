import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it } from 'vitest';

import { buildTaskList } from '@/core/test/factories/taskList.factory';
import { getDb } from '@/server/db/client';
import { listTasks, upsertTasks } from '@/server/db/tasks';
import { upsertUser } from '@/server/db/users';

import { buildClerkUserId, createTestUsers } from '../test/dbUsers';
import { mockStreamingModel } from '../test/mockLanguageModel';
import { createGenerateHandler } from './generateHandler';

const testUsers = createTestUsers();

const postPrompt = (prompt: string): Request =>
  new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, timeZone: 'UTC' }),
  });

describe('generate handler with the database', () => {
  afterEach(async () => {
    await testUsers.cleanUp();
  });

  it("saves a signed-in user's generated TaskList, listed back in the card's order", async () => {
    // Arrange
    const now = faker.date.recent();
    const widget = buildTaskList();
    let userId = '';
    const handler = createGenerateHandler({
      model: mockStreamingModel([JSON.stringify({ widget })]),
      now: () => now,
      identify: async () => buildClerkUserId(),
      // The same wiring as route.ts, with the user's id kept for cleanup.
      saveUser: async (identity) => {
        userId = await upsertUser(getDb(), identity);
        testUsers.track(userId);
        return userId;
      },
      saveTasks: async (owner, tasks) => {
        await upsertTasks(getDb(), owner, tasks);
      },
    });

    // Act
    const response = await handler(postPrompt(faker.lorem.sentence()));
    await response.text();
    const listed = await listTasks(getDb(), userId);

    // Assert
    expect(
      listed.map(({ title, priority, dueDate, completedAt, deletedAt }) => ({
        title,
        priority,
        dueDate,
        completedAt,
        deletedAt,
      })),
    ).toEqual(
      widget.tasks.map((task) => ({
        title: task.title,
        priority: task.priority,
        dueDate: task.due ?? null,
        completedAt: task.done ? now : null,
        deletedAt: null,
      })),
    );
  });
});
