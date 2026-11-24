import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { buildClerkUserId } from '../test/dbUsers';
import { getDb } from './client';
import { users } from './tables/users';
import { findUser, findUserId, upsertUser } from './users';

const TIME_ZONES = ['Europe/Berlin', 'Asia/Tokyo', 'America/New_York'] as const;

describe('upsertUser', () => {
  const clerkUserIds: string[] = [];

  afterEach(async () => {
    await Promise.all(
      clerkUserIds.splice(0).map((id) => getDb().delete(users).where(eq(users.clerkUserId, id))),
    );
  });

  it('returns the same id on every call and keeps the latest time zone', async () => {
    // Arrange
    const clerkUserId = buildClerkUserId();
    clerkUserIds.push(clerkUserId);
    const [first, second] = faker.helpers.arrayElements(TIME_ZONES, 2);

    // Act
    const createdId = await upsertUser(getDb(), { clerkUserId, timeZone: first });
    const againId = await upsertUser(getDb(), { clerkUserId, timeZone: second });

    // Assert
    const [row] = await getDb().select().from(users).where(eq(users.clerkUserId, clerkUserId));
    expect(againId).toBe(createdId);
    expect(row.id).toBe(createdId);
    expect(row.timeZone).toBe(second);
  });

  it('leaves updated_at alone when the time zone has not changed', async () => {
    // Arrange
    const clerkUserId = buildClerkUserId();
    clerkUserIds.push(clerkUserId);
    const timeZone = faker.helpers.arrayElement(TIME_ZONES);
    await upsertUser(getDb(), { clerkUserId, timeZone });
    const [before] = await getDb().select().from(users).where(eq(users.clerkUserId, clerkUserId));

    // Act
    await upsertUser(getDb(), { clerkUserId, timeZone });

    // Assert
    const [after] = await getDb().select().from(users).where(eq(users.clerkUserId, clerkUserId));
    expect(after.updatedAt).toEqual(before.updatedAt);
  });
});

describe('findUserId', () => {
  const clerkUserIds: string[] = [];

  afterEach(async () => {
    await Promise.all(
      clerkUserIds.splice(0).map((id) => getDb().delete(users).where(eq(users.clerkUserId, id))),
    );
  });

  it("returns the id upsertUser gave the user's row", async () => {
    // Arrange
    const clerkUserId = buildClerkUserId();
    clerkUserIds.push(clerkUserId);
    const id = await upsertUser(getDb(), {
      clerkUserId,
      timeZone: faker.helpers.arrayElement(TIME_ZONES),
    });

    // Act
    const found = await findUserId(getDb(), clerkUserId);

    // Assert
    expect(found).toBe(id);
  });

  it('returns null and creates no row for a user who has never generated a card', async () => {
    // Arrange
    const clerkUserId = buildClerkUserId();

    // Act
    const found = await findUserId(getDb(), clerkUserId);

    // Assert
    const rows = await getDb().select().from(users).where(eq(users.clerkUserId, clerkUserId));
    expect(found).toBeNull();
    expect(rows).toEqual([]);
  });
});

describe('findUser', () => {
  const clerkUserIds: string[] = [];

  afterEach(async () => {
    await Promise.all(
      clerkUserIds.splice(0).map((id) => getDb().delete(users).where(eq(users.clerkUserId, id))),
    );
  });

  it("returns the user's id and latest time zone", async () => {
    // Arrange
    const clerkUserId = buildClerkUserId();
    clerkUserIds.push(clerkUserId);
    const timeZone = faker.helpers.arrayElement(TIME_ZONES);
    const id = await upsertUser(getDb(), { clerkUserId, timeZone });

    // Act
    const found = await findUser(getDb(), clerkUserId);

    // Assert
    expect(found).toEqual({ id, timeZone });
  });

  it('returns null for a user who has never generated a card', async () => {
    // Act
    const found = await findUser(getDb(), buildClerkUserId());

    // Assert
    expect(found).toBeNull();
  });
});
