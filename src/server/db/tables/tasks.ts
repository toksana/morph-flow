import { sql } from 'drizzle-orm';
import { check, date, index, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { TASK_PRIORITIES } from '@/core/widgets/taskList.schema';

import { auditTimestamps, softDelete, timestampTz, uuidV7PrimaryKey } from './columns';
import { users } from './users';

/** Same values as the TaskList widget, so a generated task maps onto a row as is. */
export const taskPriority = pgEnum('task_priority', TASK_PRIORITIES);

/**
 * A user's task, independent of the card that created it, so other widgets can query it too.
 * Ids come from the client (uuidv7), so a task made offline keeps its id after sync; they grow
 * in creation order, so `ORDER BY id` lists a card's tasks in the order the model wrote them.
 */
export const tasks = pgTable(
  'tasks',
  {
    id: uuidV7PrimaryKey(),
    /** Deleting a user deletes their tasks. */
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    priority: taskPriority().notNull(),
    /** All-day due date, the user's local calendar day ("2026-11-22"), no time zone. */
    dueDate: date({ mode: 'string' }),
    /** Due at a moment in time, e.g. a call at 15:00; at most one of the two due fields is set. */
    dueAt: timestampTz(),
    /** Null while open; when it was ticked off otherwise. The widget's `done` is derived from it. */
    completedAt: timestampTz(),
    ...auditTimestamps,
    ...softDelete,
  },
  (table) => [
    check('tasks_title_not_blank', sql`btrim(${table.title}) <> ''`),
    check('tasks_single_due', sql`${table.dueDate} is null or ${table.dueAt} is null`),
    // Sync pull: "this user's rows changed since the cursor", tombstones included.
    index('tasks_user_id_updated_at_idx').on(table.userId, table.updatedAt),
    // The task list: this user's live tasks in creation order.
    index('tasks_user_id_live_idx')
      .on(table.userId, table.id)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
