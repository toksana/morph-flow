import { auth } from '@clerk/nextjs/server';

import { getDb } from '@/server/db/client';
import { type UserRecord, findUser, findUserId } from '@/server/db/users';

/**
 * Clerk and Neon, wired once for the task and habit loaders and their actions. `async` turns a
 * synchronous throw from getDb() (no DATABASE_URL) into a rejection the handlers catch.
 */
export const identifyCaller = async (): Promise<string | null> => (await auth()).userId;

export const findCallerUserId = async (clerkUserId: string): Promise<string | null> =>
  findUserId(getDb(), clerkUserId);

export const findCaller = async (clerkUserId: string): Promise<UserRecord | null> =>
  findUser(getDb(), clerkUserId);
