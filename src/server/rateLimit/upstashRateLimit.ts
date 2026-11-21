import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { GUEST_HOURLY_GENERATIONS, USER_HOURLY_GENERATIONS } from '@/core/constants';

import { type CheckRateLimit, rateLimitKey } from './caller';

const WINDOW = '1 h';
const KEY_PREFIX = 'morph-flow:generate';

/** Environment variables; the Upstash for Redis integration on Vercel sets `KV_REST_API_*`. */
type Env = Readonly<Record<string, string | undefined>>;

const readSetting = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? null : trimmed;
};

const slidingWindow = (redis: Redis, scope: string, requests: number): Ratelimit =>
  new Ratelimit({
    redis,
    prefix: `${KEY_PREFIX}:${scope}`,
    limiter: Ratelimit.slidingWindow(requests, WINDOW),
  });

/**
 * A sliding one-hour window per caller in Upstash Redis, or null when the connection settings are
 * missing (e.g. locally). Create it once per module: the limiter keeps blocked callers in memory
 * while the function is warm, so repeat requests from them skip Redis.
 */
export const createUpstashRateLimit = (env: Env): CheckRateLimit | null => {
  const url = readSetting(env.KV_REST_API_URL);
  const token = readSetting(env.KV_REST_API_TOKEN);
  if (url === null || token === null) return null;

  const redis = new Redis({ url, token });
  const guest = slidingWindow(redis, 'guest', GUEST_HOURLY_GENERATIONS);
  const user = slidingWindow(redis, 'user', USER_HOURLY_GENERATIONS);

  return async (caller) => {
    const limiter = caller.clerkUserId === null ? guest : user;
    const { success, limit, reset } = await limiter.limit(rateLimitKey(caller));
    return { success, limit, reset };
  };
};
