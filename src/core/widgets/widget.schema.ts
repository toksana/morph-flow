import { z } from 'zod';

import { habitStreakCardWidget } from './habitStreakCard.widget';
import { taskListWidget } from './taskList.widget';

/** Every widget the generator can produce. The first one is the fallback in the prompt. */
export const WIDGETS = [taskListWidget, habitStreakCardWidget] as const;

/** Maps a tuple of definitions to the tuple of their schemas (needs a type parameter to stay a tuple). */
type SchemasOf<Widgets extends readonly { schema: unknown }[]> = {
  [Index in keyof Widgets]: Widgets[Index]['schema'];
};

// `map` widens the tuple to an array; the mapped type restores the per-index schemas.
const widgetSchemas = WIDGETS.map((widget) => widget.schema) as unknown as SchemasOf<
  typeof WIDGETS
>;

/** The model picks one widget by its `type`. */
export const widgetSchema = z.discriminatedUnion('type', widgetSchemas);

/** Structured output needs an object at the root, so the widget is wrapped. */
export const widgetResponseSchema = z.object({
  widget: widgetSchema.describe('The single widget that best fits the user request.'),
});

export type Widget = z.infer<typeof widgetSchema>;
export type WidgetType = Widget['type'];
export type WidgetResponse = z.infer<typeof widgetResponseSchema>;
