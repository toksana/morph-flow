import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { DEFAULT_TARGET_DAYS, HABIT_STREAK_CARD_TYPE } from '@/core/widgets/habitStreakCard.schema';
import { MAX_TASKS, MIN_TASKS, TASK_LIST_TYPE } from '@/core/widgets/taskList.schema';

import { buildWidgetSystemPrompt } from './streamWidget';

const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

describe('buildWidgetSystemPrompt', () => {
  it('states the given day so the model can resolve relative dates', () => {
    // Arrange
    const today = `${faker.date.weekday()}, ${faker.date.anytime().toISOString().slice(0, ISO_DATE_LENGTH)}`;

    // Act
    const prompt = buildWidgetSystemPrompt(today);

    // Assert
    expect(prompt).toContain(`Today is ${today}.`);
  });

  it('asks for a task count within the schema bounds', () => {
    // Act
    const prompt = buildWidgetSystemPrompt('Thursday, 2026-11-19');

    // Assert
    expect(prompt).toContain(`between ${MIN_TASKS} and ${MAX_TASKS} tasks`);
  });

  it('asks for date-only due dates that match the schema format', () => {
    // Act
    const prompt = buildWidgetSystemPrompt('Thursday, 2026-11-19');

    // Assert
    expect(prompt).toContain('YYYY-MM-DD, date only');
  });

  it.each([TASK_LIST_TYPE, HABIT_STREAK_CARD_TYPE])('tells the model when to choose %s', (type) => {
    // Act
    const prompt = buildWidgetSystemPrompt('Thursday, 2026-11-19');

    // Assert
    expect(prompt).toContain(`Choose ${type} `);
  });

  it('names the same default target as the schema', () => {
    // Act
    const prompt = buildWidgetSystemPrompt('Thursday, 2026-11-19');

    // Assert
    expect(prompt).toContain(`otherwise use ${DEFAULT_TARGET_DAYS}.`);
  });
});
