import { auth } from '@clerk/nextjs/server';

import { getDb } from '@/server/db/client';
import { upsertUser } from '@/server/db/users';
import { createGenerateHandler } from '@/server/generate/generateHandler';

export const POST = createGenerateHandler({
  identify: async () => (await auth()).userId,
  saveUser: (identity) => upsertUser(getDb(), identity),
});
