import { describe, expect, it } from 'vitest';

import { DEFAULT_TARGET_DAYS } from './habitStreakCard.schema';
import { habitStreakCardWidget } from './habitStreakCard.widget';

describe('habitStreakCardWidget', () => {
  it('names the same default target as the schema', () => {
    // Act
    const allRules = habitStreakCardWidget.rules.join('\n');

    // Assert
    expect(allRules).toContain(`otherwise use ${DEFAULT_TARGET_DAYS}.`);
  });
});
