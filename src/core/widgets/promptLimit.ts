import { GUEST_PROMPT_LIMIT, USER_PROMPT_LIMIT } from '../constants';

/** Longest prompt the caller may send: guests get a shorter one to cap anonymous LLM spend. */
export const promptLimitFor = (isSignedIn: boolean): number =>
  isSignedIn ? USER_PROMPT_LIMIT : GUEST_PROMPT_LIMIT;

export const isPromptOverLimit = (prompt: string, limit: number): boolean => prompt.length > limit;

/** The counter stays out of the way until the prompt reaches this share of the limit. */
export const COUNTER_VISIBLE_RATIO = 0.8;
/** From this share the counter warns (amber) that the limit is close. */
export const NEAR_LIMIT_RATIO = 0.95;

/**
 * How the length counter looks: hidden while short, then plain, amber near the limit and red
 * past it (submit is blocked then; the text itself is never cut).
 */
export type PromptLengthTone = 'hidden' | 'visible' | 'near' | 'over';

export const promptLengthTone = (length: number, limit: number): PromptLengthTone => {
  if (length > limit) return 'over';
  if (length >= limit * NEAR_LIMIT_RATIO) return 'near';
  if (length >= limit * COUNTER_VISIBLE_RATIO) return 'visible';
  return 'hidden';
};
