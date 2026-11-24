import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { buildTask, buildTasks } from '@/core/test/factories/taskList.factory';

import { createTestUsers } from '../test/dbUsers';
import { getDb } from './client';
import { tasks } from './tables/tasks';
import { listTasks, setTaskCompleted, softDeleteTask, upsertTasks } from './tasks';
import { toTaskValues } from './taskValues';

const testUsers = createTestUsers();

const buildValues = (count: number, now = faker.date.recent()) =>
  buildTasks(count).map((task) => toTaskValues(task, now));

const saveOpenTask = async (userId: string): Promise<string> => {
  const [id] = await upsertTasks(getDb(), userId, [
    toTaskValues(buildTask({ done: false }), new Date()),
  ]);
  return id;
};

const readTask = async (id: string) => {
  const [row] = await getDb().select().from(tasks).where(eq(tasks.id, id));
  return row;
};

describe('tasks repository', () => {
  afterEach(async () => {
    await testUsers.cleanUp();
  });

  it('saves tasks and lists them back in the order they were given', async () => {
    // Arrange
    const userId = await testUsers.create();
    const values = buildValues(faker.number.int({ min: 2, max: 8 }));

    // Act
    const ids = await upsertTasks(getDb(), userId, values);
    const listed = await listTasks(getDb(), userId);

    // Assert
    expect(listed.map((task) => task.id)).toEqual(ids);
    expect(
      listed.map(({ title, priority, dueDate, completedAt }) => ({
        title,
        priority,
        dueDate,
        completedAt,
      })),
    ).toEqual(values);
  });

  it('is idempotent: the same tasks sent again change nothing, updated_at included', async () => {
    // Arrange
    const userId = await testUsers.create();
    const ids = await upsertTasks(getDb(), userId, buildValues(3));
    const saved = await listTasks(getDb(), userId);
    const resend = saved.map(({ id, title, priority, dueDate, dueAt, completedAt, deletedAt }) => ({
      id,
      title,
      priority,
      dueDate,
      dueAt,
      completedAt,
      deletedAt,
    }));

    // Act
    const againIds = await upsertTasks(getDb(), userId, resend);

    // Assert
    expect(againIds).toEqual(ids);
    expect(await listTasks(getDb(), userId)).toEqual(saved);
  });

  it('updates an existing task by id, e.g. ticking it off', async () => {
    // Arrange
    const userId = await testUsers.create();
    const [open] = buildTasks(1).map((task) => toTaskValues({ ...task, done: false }, new Date()));
    const [id] = await upsertTasks(getDb(), userId, [open]);
    const completedAt = faker.date.recent();

    // Act
    await upsertTasks(getDb(), userId, [{ ...open, id, completedAt }]);

    // Assert
    const row = await readTask(id);
    expect(row.completedAt).toEqual(completedAt);
    expect(row.updatedAt.getTime()).toBeGreaterThan(row.createdAt.getTime());
  });

  it("never overwrites another user's task that has the same id", async () => {
    // Arrange
    const owner = await testUsers.create();
    const intruder = await testUsers.create();
    const [id] = await upsertTasks(getDb(), owner, buildValues(1));
    const original = await readTask(id);

    // Act
    const written = await upsertTasks(getDb(), intruder, [
      { ...toTaskValues(buildTask(), new Date()), id },
    ]);

    // Assert
    expect(written).toEqual([]);
    expect(await readTask(id)).toEqual(original);
    expect(await listTasks(getDb(), intruder)).toEqual([]);
  });

  it('writes nothing for an empty list', async () => {
    // Arrange
    const userId = await testUsers.create();

    // Act
    const ids = await upsertTasks(getDb(), userId, []);

    // Assert
    expect(ids).toEqual([]);
  });

  it('soft-deletes a task: gone from the list, row kept with deleted_at, only once', async () => {
    // Arrange
    const userId = await testUsers.create();
    const [deletedId, keptId] = await upsertTasks(getDb(), userId, buildValues(2));

    // Act
    const first = await softDeleteTask(getDb(), userId, deletedId);
    const second = await softDeleteTask(getDb(), userId, deletedId);

    // Assert
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect((await listTasks(getDb(), userId)).map((task) => task.id)).toEqual([keptId]);
    expect((await readTask(deletedId)).deletedAt).toBeInstanceOf(Date);
  });

  it("does not let a user delete another user's task", async () => {
    // Arrange
    const owner = await testUsers.create();
    const other = await testUsers.create();
    const [id] = await upsertTasks(getDb(), owner, buildValues(1));

    // Act
    const deleted = await softDeleteTask(getDb(), other, id);

    // Assert
    expect(deleted).toBe(false);
    expect((await readTask(id)).deletedAt).toBeNull();
  });

  it('ticks a task off and keeps the first completion time when ticked again', async () => {
    // Arrange
    const userId = await testUsers.create();
    const id = await saveOpenTask(userId);

    // Act
    const first = await setTaskCompleted(getDb(), userId, id, true);
    const completedAt = (await readTask(id)).completedAt;
    const again = await setTaskCompleted(getDb(), userId, id, true);

    // Assert
    expect(first).toBe(true);
    expect(again).toBe(true);
    expect(completedAt).toBeInstanceOf(Date);
    expect((await readTask(id)).completedAt).toEqual(completedAt);
  });

  it('opens a done task again', async () => {
    // Arrange
    const userId = await testUsers.create();
    const id = await saveOpenTask(userId);
    await setTaskCompleted(getDb(), userId, id, true);

    // Act
    const reopened = await setTaskCompleted(getDb(), userId, id, false);

    // Assert
    expect(reopened).toBe(true);
    expect((await readTask(id)).completedAt).toBeNull();
  });

  it("does not let a user tick off another user's task", async () => {
    // Arrange
    const owner = await testUsers.create();
    const other = await testUsers.create();
    const id = await saveOpenTask(owner);

    // Act
    const updated = await setTaskCompleted(getDb(), other, id, true);

    // Assert
    expect(updated).toBe(false);
    expect((await readTask(id)).completedAt).toBeNull();
  });

  it('leaves a deleted task alone', async () => {
    // Arrange
    const userId = await testUsers.create();
    const id = await saveOpenTask(userId);
    await softDeleteTask(getDb(), userId, id);

    // Act
    const updated = await setTaskCompleted(getDb(), userId, id, true);

    // Assert
    expect(updated).toBe(false);
    expect((await readTask(id)).completedAt).toBeNull();
  });

  it('returns false for an id that does not exist', async () => {
    // Arrange
    const userId = await testUsers.create();

    // Act
    const updated = await setTaskCompleted(getDb(), userId, faker.string.uuid(), true);

    // Assert
    expect(updated).toBe(false);
  });
});
