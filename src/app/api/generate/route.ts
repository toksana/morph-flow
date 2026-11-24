import { auth } from '@clerk/nextjs/server';

import { getDb } from '@/server/db/client';
import { upsertUser } from '@/server/db/users';
import { createGenerateHandler } from '@/server/generate/generateHandler';
import { createUpstashRateLimit } from '@/server/rateLimit/upstashRateLimit';

// Created once per instance, so the limiter's in-memory block list survives between requests.
const checkRateLimit = createUpstashRateLimit(process.env);
if (checkRateLimit === null) {
  console.warn('[generate] KV_REST_API_URL or KV_REST_API_TOKEN is not set: no rate limit');
}

export const POST = createGenerateHandler({
  identify: async () => (await auth()).userId,
  saveUser: async (identity) => {
    await upsertUser(getDb(), identity);
  },
  checkRateLimit: checkRateLimit ?? undefined,
});
