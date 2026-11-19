import { z } from 'zod';

import { isValidTimeZone } from './promptDate';

export const MAX_PROMPT_LENGTH = 2000;
const MAX_TIME_ZONE_LENGTH = 64;

/** Body the client sends to generate a widget; shared by web, server and native. */
export const generateRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(MAX_PROMPT_LENGTH),
  /** IANA zone of the user, so "tomorrow" resolves against their calendar day, not the server's. */
  timeZone: z.string().max(MAX_TIME_ZONE_LENGTH).refine(isValidTimeZone, 'Unknown time zone'),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
