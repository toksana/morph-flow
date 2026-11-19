/** The whole, as a percentage: used both to scale a ratio and to cap progress. */
export const FULL_PERCENT = 100;

/** Treats missing and whitespace-only strings alike: both mean "not streamed yet". */
export const nonBlank = (value: string | undefined): string | undefined =>
  value !== undefined && value.trim() !== '' ? value : undefined;

/** Share of `doneCount` in `totalCount`, rounded to a whole percent; 0 for an empty total. */
export const completionPercent = (doneCount: number, totalCount: number): number =>
  totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * FULL_PERCENT);
