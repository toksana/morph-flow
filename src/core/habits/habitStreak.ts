import { addDays } from './habitDay';

export interface StreakInput {
  /** Days the habit was checked in, as ISO dates in the user's time zone. */
  checkInDays: readonly string[];
  /** The user's day the habit was saved; check-ins before it do not count. */
  startDay: string;
  /** Days of the streak before tracking began: the run that ends on the day before `startDay`. */
  streakBase: number;
  today: string;
}

/** Consecutive checked-in days that end on `anchor`, going back no further than `startDay`. */
const checkedRunLength = (days: ReadonlySet<string>, anchor: string, startDay: string): number => {
  let length = 0;
  let day = anchor;
  while (day >= startDay && days.has(day)) {
    length += 1;
    day = addDays(day, -1);
  }
  return length;
};

/**
 * The streak as of `today`. It ends today once today is checked in; until then it ends yesterday,
 * since today can still be done. A missed day before that breaks it to 0. When the run goes all
 * the way back to `startDay`, the days the streak had before tracking (`streakBase`) count too.
 */
export const countStreak = ({ checkInDays, startDay, streakBase, today }: StreakInput): number => {
  const days = new Set(checkInDays);
  const anchor = days.has(today) ? today : addDays(today, -1);
  const run = checkedRunLength(days, anchor, startDay);
  const reachesStart = addDays(anchor, -run) < startDay;
  return run + (reachesStart ? Math.max(0, streakBase) : 0);
};
