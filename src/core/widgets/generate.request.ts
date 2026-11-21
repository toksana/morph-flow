import { z } from 'zod';

import { isValidTimeZone } from './promptDate';

const MAX_TIME_ZONE_LENGTH = 64;

/** Body the client sends to generate a widget; shared by web, server and native. */
export const generateRequestSchema = z.object({
  /**
   * No length cap here: the limit depends on who is calling, so the server checks it after
   * auth and answers 413 (see `promptLimitFor`), never 400.
   */
  prompt: z.string().trim().min(1),
  /** IANA zone of the user, so "tomorrow" resolves against their calendar day, not the server's. */
  timeZone: z.string().max(MAX_TIME_ZONE_LENGTH).refine(isValidTimeZone, 'Unknown time zone'),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
