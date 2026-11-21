import { GUEST_HOURLY_GENERATIONS, USER_HOURLY_GENERATIONS } from '../constants';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;

/** Generations per rolling hour for the caller: signed-in users get more than guests. */
export const hourlyGenerationsFor = (isSignedIn: boolean): number =>
  isSignedIn ? USER_HOURLY_GENERATIONS : GUEST_HOURLY_GENERATIONS;

/** Whole seconds until `resetAt` for a `Retry-After` header; at least 1, so a retry never comes early. */
export const retryAfterSeconds = (resetAt: number, now: number): number =>
  Math.max(1, Math.ceil((resetAt - now) / MS_PER_SECOND));

/** Whole minutes until `resetAt` for "try again in N min"; rounded up and at least 1. */
export const minutesUntil = (resetAt: number, now: number): number =>
  Math.max(1, Math.ceil((resetAt - now) / MS_PER_MINUTE));
