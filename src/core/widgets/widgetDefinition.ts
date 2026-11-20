import type { z } from 'zod';

/**
 * Everything the generator needs to know about one widget. Adding a widget means writing
 * one definition and listing it in `WIDGETS`; the union schema and the prompt follow.
 */
export interface WidgetDefinition<
  Type extends string = string,
  Schema extends z.ZodObject<{ type: z.ZodLiteral<Type> }> = z.ZodObject<{
    type: z.ZodLiteral<Type>;
  }>,
> {
  type: Type;
  schema: Schema;
  /** One sentence telling the model when this widget fits a request. */
  whenToUse: string;
  /** How to fill the fields; formats live in the schema descriptions instead. */
  rules: readonly string[];
}
