import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { WIDGETS } from '@/core/widgets/widget.schema';

import { buildWidgetSystemPrompt } from './streamWidget';

const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;
const TODAY = 'Thursday, 2026-11-19';

const buildPromptWidget = () => ({
  type: faker.string.alpha({ length: 10 }),
  whenToUse: faker.lorem.sentence(),
  rules: faker.helpers.multiple(() => faker.lorem.sentence(), { count: { min: 1, max: 4 } }),
});

describe('buildWidgetSystemPrompt', () => {
  it('states the given day so the model can resolve relative dates', () => {
    // Arrange
    const today = `${faker.date.weekday()}, ${faker.date.anytime().toISOString().slice(0, ISO_DATE_LENGTH)}`;

    // Act
    const prompt = buildWidgetSystemPrompt(today);

    // Assert
    expect(prompt).toContain(`Today is ${today}.`);
  });

  it.each(WIDGETS.map((widget) => [widget.type, widget] as const))(
    'tells the model when to choose %s and how to fill it',
    (type, widget) => {
      // Act
      const prompt = buildWidgetSystemPrompt(TODAY);

      // Assert
      expect(prompt).toContain(`- ${type}: ${widget.whenToUse}`);
      expect(prompt).toContain(`For a ${type}:\n${widget.rules.join('\n')}`);
    },
  );

  it('builds the choice and the rules from any registry, not a fixed list', () => {
    // Arrange
    const widgets = faker.helpers.multiple(buildPromptWidget, { count: { min: 1, max: 6 } });

    // Act
    const prompt = buildWidgetSystemPrompt(TODAY, widgets);

    // Assert
    widgets.forEach((widget) => {
      expect(prompt).toContain(`- ${widget.type}: ${widget.whenToUse}`);
      expect(prompt).toContain(`For a ${widget.type}:\n${widget.rules.join('\n')}`);
    });
    WIDGETS.forEach((widget) => expect(prompt).not.toContain(widget.whenToUse));
  });
});
