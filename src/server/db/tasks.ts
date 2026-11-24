import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import type { Database } from './client';
import { type TaskRow, tasks } from './tables/tasks';
import type { TaskValues } from './taskValues';

/** Columns a write may change; ids, owner and timestamps stay as they are. */
const writableColumns = {
  title: sql`excluded.title`,
  priority: sql`excluded.priority`,
  dueDate: sql`excluded.due_date`,
  dueAt: sql`excluded.due_at`,
  completedAt: sql`excluded.completed_at`,
  deletedAt: sql`excluded.deleted_at`,
};

/**
 * Inserts the user's tasks, or updates them where the id already exists, in one statement and in
 * the given order. Idempotent: sending the same tasks again changes nothing (the trigger leaves
 * `updated_at` alone too). A task id that belongs to another user is skipped, never overwritten.
 * @returns the ids written, in the given order
 */
export const upsertTasks = async (
  db: Database,
  userId: string,
  values: readonly TaskValues[],
): Promise<string[]> => {
  if (values.length === 0) return [];
  const written = await db
    .insert(tasks)
    .values(values.map((task) => ({ ...task, userId })))
    .onConflictDoUpdate({
      target: tasks.id,
      set: writableColumns,
      setWhere: sql`${tasks.userId} = excluded.user_id`,
    })
    .returning({ id: tasks.id });
  return written.map(({ id }) => id);
};

/** The user's live tasks (not deleted), oldest first: a card's tasks in the order they were written. */
export const listTasks = (db: Database, userId: string): Promise<TaskRow[]> =>
  db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .orderBy(asc(tasks.id));

/**
 * Marks the user's task deleted, keeping the row so other devices learn about it on sync.
 * @returns false if there is no such live task for this user
 */
export const softDeleteTask = async (
  db: Database,
  userId: string,
  taskId: string,
): Promise<boolean> => {
  const deleted = await db
    .update(tasks)
    .set({ deletedAt: sql`now()` })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id });
  return deleted.length > 0;
};

/**
 * Ticks the user's live task off, or opens it again. Ticking an already done task keeps its
 * original `completed_at`, so a repeated request (a retry, a second device) changes nothing.
 * @returns false if there is no such live task for this user
 */
export const setTaskCompleted = async (
  db: Database,
  userId: string,
  taskId: string,
  done: boolean,
): Promise<boolean> => {
  const updated = await db
    .update(tasks)
    .set({ completedAt: done ? sql`coalesce(${tasks.completedAt}, now())` : null })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id });
  return updated.length > 0;
};
