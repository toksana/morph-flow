import { faker } from '@faker-js/faker';
import { inArray } from 'drizzle-orm';

import { getDb } from '../db/client';
import { users } from '../db/tables/users';
import { upsertUser } from '../db/users';

export const buildClerkUserId = (): string => `user_test_${faker.string.alphanumeric(24)}`;

/**
 * Throwaway users for db tests. Each test creates its own, and `cleanUp` deletes them, which
 * cascades to everything they own, so runs leave the dev branch as they found it.
 */
export const createTestUsers = () => {
  const created: string[] = [];
  return {
    create: async (): Promise<string> => {
      const id = await upsertUser(getDb(), { clerkUserId: buildClerkUserId(), timeZone: 'UTC' });
      created.push(id);
      return id;
    },
    cleanUp: async (): Promise<void> => {
      if (created.length === 0) return;
      await getDb()
        .delete(users)
        .where(inArray(users.id, created.splice(0)));
    },
  };
};
