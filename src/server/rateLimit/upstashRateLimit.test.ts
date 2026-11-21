import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { createUpstashRateLimit } from './upstashRateLimit';

const buildEnv = () => ({
  KV_REST_API_URL: faker.internet.url(),
  KV_REST_API_TOKEN: faker.string.alphanumeric(40),
});

describe('createUpstashRateLimit', () => {
  it('builds a limiter when both connection settings are present', () => {
    // Act
    const check = createUpstashRateLimit(buildEnv());

    // Assert
    expect(check).toBeTypeOf('function');
  });

  it.each(['KV_REST_API_URL', 'KV_REST_API_TOKEN'] as const)(
    'turns the limit off when %s is missing or blank',
    (name) => {
      // Arrange
      const missing = { ...buildEnv(), [name]: undefined };
      const blank = { ...buildEnv(), [name]: '  ' };

      // Act
      const fromMissing = createUpstashRateLimit(missing);
      const fromBlank = createUpstashRateLimit(blank);

      // Assert
      expect(fromMissing).toBeNull();
      expect(fromBlank).toBeNull();
    },
  );
});
