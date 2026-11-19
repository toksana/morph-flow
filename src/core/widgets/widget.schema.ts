import { z } from 'zod';

import { habitStreakCardSchema } from './habitStreakCard.schema';
import { taskListSchema } from './taskList.schema';

/** Every widget the generator can produce; the model picks one by its `type`. */
export const widgetSchema = z.discriminatedUnion('type', [taskListSchema, habitStreakCardSchema]);

/** Structured output needs an object at the root, so the widget is wrapped. */
export const widgetResponseSchema = z.object({
  widget: widgetSchema.describe('The single widget that best fits the user request.'),
});

export type Widget = z.infer<typeof widgetSchema>;
export type WidgetType = Widget['type'];
export type WidgetResponse = z.infer<typeof widgetResponseSchema>;
