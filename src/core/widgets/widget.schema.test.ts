import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildHabitStreakCard } from '../test/factories/habitStreakCard.factory';
import { buildTaskList } from '../test/factories/taskList.factory';

import { HABIT_STREAK_CARD_TYPE } from './habitStreakCard.schema';
import { TASK_LIST_TYPE } from './taskList.schema';
import { widgetResponseSchema } from './widget.schema';

const RANDOM_RUNS = 25;

const buildRandomWidget = () => faker.helpers.arrayElement([buildTaskList, buildHabitStreakCard])();

describe('widgetResponseSchema', () => {
  it('accepts every random TaskList and HabitStreakCard and keeps it unchanged', () => {
    // Arrange
    const responses = Array.from({ length: RANDOM_RUNS }, () => ({ widget: buildRandomWidget() }));

    // Act
    const parsed = responses.map((response) => widgetResponseSchema.parse(response));

    // Assert
    expect(parsed).toEqual(responses);
  });

  it('rejects a widget of an unknown type', () => {
    // Arrange
    const response = { widget: { ...buildTaskList(), type: faker.lorem.word() } };

    // Act
    const result = widgetResponseSchema.safeParse(response);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each([
    ['TaskList fields', HABIT_STREAK_CARD_TYPE, buildTaskList],
    ['HabitStreakCard fields', TASK_LIST_TYPE, buildHabitStreakCard],
  ] as const)('rejects %s labelled as %s', (_fields, type, build) => {
    // Arrange
    const response = { widget: { ...build(), type } };

    // Act
    const result = widgetResponseSchema.safeParse(response);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects a bare widget without the wrapping object', () => {
    // Arrange
    const widget = buildRandomWidget();

    // Act
    const result = widgetResponseSchema.safeParse(widget);

    // Assert
    expect(result.success).toBe(false);
  });
});
