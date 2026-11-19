import { z } from 'zod';

export const TASK_LIST_TYPE = 'TaskList';
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const MIN_TASKS = 1;
export const MAX_TASKS = 20;

export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

export const taskSchema = z.object({
  title: z
    .string()
    .min(1)
    .describe(
      'Concise task title in the user language: under 10 words, starting with an action verb.',
    ),
  done: z.boolean().describe('Whether the task is already completed.'),
  priority: taskPrioritySchema.describe('Task priority.'),
  due: z.iso.date().optional().describe('Optional due date in YYYY-MM-DD format.'),
});

export const taskListSchema = z.object({
  type: z.literal(TASK_LIST_TYPE),
  title: z
    .string()
    .min(1)
    .describe('Concise title of the task list, under 6 words, e.g. "Plan for tomorrow".'),
  tasks: z.array(taskSchema).min(MIN_TASKS).max(MAX_TASKS),
});

export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskList = z.infer<typeof taskListSchema>;
