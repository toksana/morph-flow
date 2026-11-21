import { GUEST_PROMPT_LIMIT, USER_PROMPT_LIMIT } from '../constants';

/** Longest prompt the caller may send: guests get a shorter one to cap anonymous LLM spend. */
export const promptLimitFor = (isSignedIn: boolean): number =>
  isSignedIn ? USER_PROMPT_LIMIT : GUEST_PROMPT_LIMIT;

export const isPromptOverLimit = (prompt: string, limit: number): boolean => prompt.length > limit;
