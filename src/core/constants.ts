/** Prompt length caps, in UTF-16 code units (`string.length`), shared by the form and the API. */
export const GUEST_PROMPT_LIMIT = 500;
export const USER_PROMPT_LIMIT = 2000;

/** Generations allowed per rolling hour, shared by the API limiter and the client message. */
export const GUEST_HOURLY_GENERATIONS = 10;
export const USER_HOURLY_GENERATIONS = 30;
