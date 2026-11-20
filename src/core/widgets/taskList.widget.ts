import { MAX_TASKS, MIN_TASKS, TASK_LIST_TYPE, taskListSchema } from './taskList.schema';
import type { WidgetDefinition } from './widgetDefinition';

export const taskListWidget = {
  type: TASK_LIST_TYPE,
  schema: taskListSchema,
  whenToUse:
    'One-off tasks, plans, goals to break down, or several different to-dos. Also the fallback when no other widget fits.',
  rules: [
    'If the user gives a broad goal (e.g. "launch an MVP"), break it down into concrete steps. If they list specific items, keep them intact.',
    `Return between ${MIN_TASKS} and ${MAX_TASKS} tasks, ordered as the user would do them.`,
    'Set done to true only for tasks the user says are already finished.',
    'Set a due date (YYYY-MM-DD, date only) only when the request names a specific date or a relative one ("tomorrow", "next Friday"); resolve relative dates from today; never invent dates.',
  ],
  examplePrompt: 'My tasks for tomorrow: workout, finish the report, call mom',
} as const satisfies WidgetDefinition<typeof TASK_LIST_TYPE, typeof taskListSchema>;
