import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { DATABASE_URL_KEY, readDatabaseUrl } from './databaseUrl';

describe('readDatabaseUrl', () => {
  it('returns the configured connection string', () => {
    // Arrange
    const url = `postgresql://${faker.internet.username()}@${faker.internet.domainName()}/${faker.lorem.word()}`;

    // Act
    const result = readDatabaseUrl({ [DATABASE_URL_KEY]: url });

    // Assert
    expect(result).toBe(url);
  });

  it.each([undefined, '', '   '])('throws when the value is %j', (value) => {
    // Arrange
    const env = { [DATABASE_URL_KEY]: value };

    // Act
    const read = (): string => readDatabaseUrl(env);

    // Assert
    expect(read).toThrow(DATABASE_URL_KEY);
  });
});
