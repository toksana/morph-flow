import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

import type { Database } from './client';
import type { GeneratedHabit } from './habitValues';
import { habitCheckIns } from './tables/habitCheckIns';
import { type HabitRow, habits } from './tables/habits';

/** A live habit with the days it was checked in, oldest first. */
export interface HabitWithCheckIns extends HabitRow {
  checkInDays: string[];
}

/**
 * Saves a generated habit and, when today is already done, its first check-in.
 * @returns the habit's id
 */
export const createHabit = async (
  db: Database,
  userId: string,
  { values, checkInDay }: GeneratedHabit,
): Promise<string> => {
  const [habit] = await db
    .insert(habits)
    .values({ ...values, userId })
    .returning({ id: habits.id });
  if (checkInDay !== null) {
    await db.insert(habitCheckIns).values({ userId, habitId: habit.id, day: checkInDay });
  }
  return habit.id;
};

const liveCheckIn = and(eq(habitCheckIns.habitId, habits.id), isNull(habitCheckIns.deletedAt));

/** The user's live habits in creation order, each with its live check-in days in one query. */
export const listHabits = async (db: Database, userId: string): Promise<HabitWithCheckIns[]> => {
  const rows = await db
    .select({
      habit: habits,
      // `::text` keeps the days ISO strings; `filter` turns "no check-ins" into an empty array.
      checkInDays: sql<string[]>`coalesce(
        array_agg(${habitCheckIns.day}::text order by ${habitCheckIns.day})
          filter (where ${habitCheckIns.id} is not null),
        '{}'
      )`,
    })
    .from(habits)
    .leftJoin(habitCheckIns, liveCheckIn)
    .where(and(eq(habits.userId, userId), isNull(habits.deletedAt)))
    .groupBy(habits.id)
    .orderBy(asc(habits.id));
  return rows.map(({ habit, checkInDays }) => ({ ...habit, checkInDays }));
};

/** The habit's id if it is the caller's own and live, otherwise no row. */
const ownedLiveHabit = (db: Database, userId: string, habitId: string) =>
  db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId), isNull(habits.deletedAt)));

/**
 * Checks in on `day`: a new row, or the undone one brought back. Only for the owner's live habit:
 * the row is selected from it, so nothing is inserted otherwise. Raw SQL because Drizzle's
 * insert-select must list every column, defaults included.
 */
const checkIn = (db: Database, userId: string, habitId: string, day: string) =>
  db.execute(sql`
    insert into ${habitCheckIns} (user_id, habit_id, day)
    select user_id, id, ${day}::date from ${habits}
    where id = ${habitId} and user_id = ${userId} and deleted_at is null
    on conflict (habit_id, day) do update set deleted_at = null
  `);

/**
 * Undoes the check-in on `day`, only for the owner's live habit; a repeated undo keeps the
 * first undo time.
 */
const undoCheckIn = (db: Database, userId: string, habitId: string, day: string) =>
  db
    .update(habitCheckIns)
    .set({ deletedAt: sql`coalesce(${habitCheckIns.deletedAt}, now())` })
    .where(
      and(
        eq(habitCheckIns.day, day),
        inArray(habitCheckIns.habitId, ownedLiveHabit(db, userId, habitId)),
      ),
    );

/**
 * Checks the user's live habit in on `day`, or undoes it, in one round trip and one transaction.
 * Idempotent: repeating either changes nothing (the trigger leaves `updated_at` alone too).
 * @returns false if there is no such live habit for this user; nothing is written then
 */
export const setHabitCheckIn = async (
  db: Database,
  userId: string,
  habitId: string,
  day: string,
  done: boolean,
): Promise<boolean> => {
  const [owned] = await db.batch([
    ownedLiveHabit(db, userId, habitId),
    done ? checkIn(db, userId, habitId, day) : undoCheckIn(db, userId, habitId, day),
  ]);
  return owned.length > 0;
};
