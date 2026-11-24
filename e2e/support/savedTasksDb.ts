import { eq } from 'drizzle-orm';

import type { Task } from '../../src/core/widgets/taskList.schema';
import { getDb } from '../../src/server/db/client';
import { tasks } from '../../src/server/db/tables/tasks';
import { upsertTasks } from '../../src/server/db/tasks';
import { toTaskValues } from '../../src/server/db/taskValues';
import { upsertUser } from '../../src/server/db/users';

/**
 * Gives the e2e user exactly these saved tasks, in this order, on the dev branch (see
 * `loadE2eEnv`). Their user row is kept between runs, like a real returning user's.
 * @returns the user's `users.id`
 */
export const seedSavedTasks = async (clerkUserId: string, seeded: Task[]): Promise<string> => {
  const userId = await upsertUser(getDb(), { clerkUserId, timeZone: 'UTC' });
  await deleteSavedTasks(userId);
  await upsertTasks(
    getDb(),
    userId,
    seeded.map((task) => toTaskValues(task, new Date())),
  );
  return userId;
};

export const deleteSavedTasks = async (userId: string): Promise<void> => {
  await getDb().delete(tasks).where(eq(tasks.userId, userId));
};
