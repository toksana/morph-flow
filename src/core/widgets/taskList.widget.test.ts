import { describe, expect, it } from 'vitest';

import { MAX_TASKS, MIN_TASKS } from './taskList.schema';
import { taskListWidget } from './taskList.widget';

const allRules = taskListWidget.rules.join('\n');

describe('taskListWidget', () => {
  it('asks for a task count within the schema bounds', () => {
    // Assert
    expect(allRules).toContain(`between ${MIN_TASKS} and ${MAX_TASKS} tasks`);
  });

  it('asks for date-only due dates that match the schema format', () => {
    // Assert
    expect(allRules).toContain('YYYY-MM-DD, date only');
  });

  it('declares itself the fallback when no other widget fits', () => {
    // Assert
    expect(taskListWidget.whenToUse).toContain('fallback');
  });
});
