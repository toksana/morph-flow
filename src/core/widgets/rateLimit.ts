import { z } from 'zod';

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

export const TOO_MANY_REQUESTS_ERROR = 'Too many requests';

/** Body of the API's 429 answer; `reset` is a Unix timestamp in milliseconds. */
export const rateLimitBodySchema = z.object({
  error: z.literal(TOO_MANY_REQUESTS_ERROR),
  limit: z.number().int().positive(),
  reset: z.number().int(),
});

export type RateLimitBody = z.infer<typeof rateLimitBodySchema>;

/** The 429 body from a failed response's text, or null for any other failure. */
export const parseRateLimitBody = (text: string): RateLimitBody | null => {
  try {
    const parsed = rateLimitBodySchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
