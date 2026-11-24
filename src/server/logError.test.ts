import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogError } from './logError';

describe('createLogError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs only an Error's message, under the area and scope", () => {
    // Arrange
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const [area, scope, message] = [
      faker.word.noun(),
      faker.lorem.words(2),
      faker.lorem.sentence(),
    ];

    // Act
    createLogError(area)(scope, new Error(message));

    // Assert
    expect(consoleError).toHaveBeenCalledWith(`[${area}] ${scope}:`, message);
  });

  it('logs a thrown non-Error value as is, and says so', () => {
    // Arrange
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const [area, scope, value] = [faker.word.noun(), faker.lorem.words(2), faker.lorem.word()];

    // Act
    createLogError(area)(scope, value);

    // Assert
    expect(consoleError).toHaveBeenCalledWith(`[${area}] ${scope} with a non-Error value:`, value);
  });
});
