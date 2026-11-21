import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { clientIp, rateLimitKey } from './caller';

const buildClerkUserId = (): string => `user_${faker.string.alphanumeric(24)}`;

describe('clientIp', () => {
  it('takes the first entry of x-forwarded-for, trimmed', () => {
    // Arrange
    const client = faker.internet.ipv4();
    const headers = new Headers({
      'x-forwarded-for': ` ${client} , ${faker.internet.ipv4()}, ${faker.internet.ipv6()}`,
      'x-real-ip': faker.internet.ipv4(),
    });

    // Act
    const ip = clientIp(headers);

    // Assert
    expect(ip).toBe(client);
  });

  it('falls back to x-real-ip when x-forwarded-for is missing or blank', () => {
    // Arrange
    const realIp = faker.internet.ipv6();
    const missing = new Headers({ 'x-real-ip': realIp });
    const blank = new Headers({ 'x-forwarded-for': ' ', 'x-real-ip': ` ${realIp} ` });

    // Act
    const fromMissing = clientIp(missing);
    const fromBlank = clientIp(blank);

    // Assert
    expect(fromMissing).toBe(realIp);
    expect(fromBlank).toBe(realIp);
  });

  it('returns null without either header', () => {
    // Act
    const ip = clientIp(new Headers({ 'x-real-ip': '  ' }));

    // Assert
    expect(ip).toBeNull();
  });
});

describe('rateLimitKey', () => {
  it('keys a signed-in user by account, whatever their IP', () => {
    // Arrange
    const clerkUserId = buildClerkUserId();

    // Act
    const fromOneIp = rateLimitKey({ clerkUserId, ip: faker.internet.ipv4() });
    const fromAnother = rateLimitKey({ clerkUserId, ip: null });

    // Assert
    expect(fromOneIp).toBe(`user:${clerkUserId}`);
    expect(fromAnother).toBe(fromOneIp);
  });

  it('keys a guest by IP, and guests without an IP share one key', () => {
    // Arrange
    const ip = faker.internet.ipv4();

    // Act
    const guest = rateLimitKey({ clerkUserId: null, ip });
    const anonymous = [
      rateLimitKey({ clerkUserId: null, ip: null }),
      rateLimitKey({ clerkUserId: null, ip: null }),
    ];

    // Assert
    expect(guest).toBe(`ip:${ip}`);
    expect(anonymous[0]).toBe(anonymous[1]);
    expect(anonymous[0]).not.toBe(guest);
  });
});
