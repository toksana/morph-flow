import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { MAX_TASKS, MIN_TASKS } from '@/core/widgets/taskList.schema';

import { buildTaskListSystemPrompt } from './streamTaskList';

const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

describe('buildTaskListSystemPrompt', () => {
  it('states the given day so the model can resolve relative dates', () => {
    // Arrange
    const today = `${faker.date.weekday()}, ${faker.date.anytime().toISOString().slice(0, ISO_DATE_LENGTH)}`;

    // Act
    const prompt = buildTaskListSystemPrompt(today);

    // Assert
    expect(prompt).toContain(`Today is ${today}.`);
  });

  it('asks for a task count within the schema bounds', () => {
    // Act
    const prompt = buildTaskListSystemPrompt('Thursday, 2026-11-19');

    // Assert
    expect(prompt).toContain(`between ${MIN_TASKS} and ${MAX_TASKS} tasks`);
  });

  it('asks for date-only due dates that match the schema format', () => {
    // Act
    const prompt = buildTaskListSystemPrompt('Thursday, 2026-11-19');

    // Assert
    expect(prompt).toContain('YYYY-MM-DD, date only');
  });
});
