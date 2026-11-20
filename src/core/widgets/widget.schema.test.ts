import { faker } from '@faker-js/faker';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { buildHabitStreakCard } from '../test/factories/habitStreakCard.factory';
import { buildTaskList } from '../test/factories/taskList.factory';

import { HABIT_STREAK_CARD_TYPE } from './habitStreakCard.schema';
import { TASK_LIST_TYPE, type TaskList } from './taskList.schema';
import { type Widget, WIDGETS, widgetResponseSchema } from './widget.schema';

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

describe('WIDGETS', () => {
  it('lists every widget type once', () => {
    // Act
    const types = WIDGETS.map((widget) => widget.type);

    // Assert
    expect(new Set(types).size).toBe(types.length);
  });

  it.each(WIDGETS.map((widget) => [widget.type, widget] as const))(
    'keeps the %s definition in sync with its schema and prompt text',
    (type, widget) => {
      // Assert
      expect(widget.schema.shape.type.value).toBe(type);
      expect(widget.whenToUse.trim()).not.toBe('');
      expect(widget.rules.length).toBeGreaterThan(0);
      expect(widget.examplePrompt.trim()).not.toBe('');
    },
  );

  it('infers a widget type that narrows by its discriminator', () => {
    // Assert
    expectTypeOf<Extract<Widget, { type: 'TaskList' }>>().toEqualTypeOf<TaskList>();
    expectTypeOf<Widget['type']>().toEqualTypeOf<(typeof WIDGETS)[number]['type']>();
  });
});
