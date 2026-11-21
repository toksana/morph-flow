/** Who is asking: the Clerk user id when signed in, otherwise the client IP (null if unknown). */
export interface RateLimitCaller {
  clerkUserId: string | null;
  ip: string | null;
}

/** Outcome of one limiter check; `reset` is a Unix timestamp in milliseconds. */
export interface RateLimitVerdict {
  success: boolean;
  limit: number;
  reset: number;
}

export type CheckRateLimit = (caller: RateLimitCaller) => Promise<RateLimitVerdict>;

const UNKNOWN_IP = 'unknown';

/**
 * The client IP. On Vercel `x-forwarded-for` is set by the platform and its first entry is the
 * client; `x-real-ip` is the fallback. Null when neither is present (e.g. a local request).
 */
export const clientIp = (headers: Headers): string | null => {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded !== undefined && forwarded !== '') return forwarded;
  // `Headers` already strips whitespace around a value, so a blank header reads as ''.
  const realIp = headers.get('x-real-ip');
  return realIp === null || realIp === '' ? null : realIp;
};

/**
 * Signed-in users are counted per account, so the allowance follows them across devices; guests per
 * IP. Callers without an IP share one bucket, which errs on the strict side.
 */
export const rateLimitKey = ({ clerkUserId, ip }: RateLimitCaller): string =>
  clerkUserId === null ? `ip:${ip ?? UNKNOWN_IP}` : `user:${clerkUserId}`;
