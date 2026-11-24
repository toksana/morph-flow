import { date, index, pgTable, unique, uuid } from 'drizzle-orm/pg-core';

import { auditTimestamps, softDelete, uuidV7PrimaryKey } from './columns';
import { habits } from './habits';
import { users } from './users';

/**
 * One row per habit and day it was done. Undoing a check-in sets `deleted_at` and checking in
 * again clears it, so the row (and its id) stays the same and other devices learn either way.
 */
export const habitCheckIns = pgTable(
  'habit_check_ins',
  {
    id: uuidV7PrimaryKey(),
    /** The habit's owner, copied from the habit on insert: the sync pull filters on it. */
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    habitId: uuid()
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    /** The user's local calendar day ("2026-11-24"), no time zone. */
    day: date({ mode: 'string' }).notNull(),
    ...auditTimestamps,
    ...softDelete,
  },
  (table) => [
    // At most one check-in per habit and day; also the lookup of a habit's days.
    unique('habit_check_ins_habit_id_day_unique').on(table.habitId, table.day),
    // Sync pull: "this user's rows changed since the cursor", tombstones included.
    index('habit_check_ins_user_id_updated_at_idx').on(table.userId, table.updatedAt),
  ],
);

export type HabitCheckInRow = typeof habitCheckIns.$inferSelect;
