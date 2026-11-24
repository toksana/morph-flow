import { sql } from 'drizzle-orm';
import { check, date, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { MAX_TARGET_DAYS, MIN_TARGET_DAYS } from '@/core/widgets/habitStreakCard.schema';

import { auditTimestamps, softDelete, uuidV7PrimaryKey } from './columns';
import { users } from './users';

/**
 * A user's habit. The streak is not stored: it is counted from the check-ins (`habit_check_ins`),
 * so it can never drift from them. Ids are uuidv7, so `ORDER BY id` lists habits as created.
 */
export const habits = pgTable(
  'habits',
  {
    id: uuidV7PrimaryKey(),
    /** Deleting a user deletes their habits. */
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    emoji: text(),
    /** Streak length the user aims for, in the HabitStreakCard's range. */
    targetDays: integer().notNull(),
    /**
     * Days the streak already had when the habit was saved (the model's `streakDays`, without
     * today): the run that ends the day before `startDay`. Counts only while the streak is unbroken.
     */
    streakBase: integer().notNull().default(0),
    /** The user's local calendar day the habit was saved ("2026-11-24"); tracking starts here. */
    startDay: date({ mode: 'string' }).notNull(),
    ...auditTimestamps,
    ...softDelete,
  },
  (table) => [
    check('habits_title_not_blank', sql`btrim(${table.title}) <> ''`),
    check(
      'habits_target_days_range',
      sql`${table.targetDays} between ${sql.raw(String(MIN_TARGET_DAYS))} and ${sql.raw(String(MAX_TARGET_DAYS))}`,
    ),
    check('habits_streak_base_not_negative', sql`${table.streakBase} >= 0`),
    // Sync pull: "this user's rows changed since the cursor", tombstones included.
    index('habits_user_id_updated_at_idx').on(table.userId, table.updatedAt),
    // The habits card: this user's live habits in creation order.
    index('habits_user_id_live_idx')
      .on(table.userId, table.id)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type HabitRow = typeof habits.$inferSelect;
export type NewHabitRow = typeof habits.$inferInsert;
