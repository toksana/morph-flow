const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

/**
 * An ISO calendar day moved by whole days, e.g. `addDays('2026-03-01', -1)` → "2026-02-28".
 * Counted in UTC, where every day is 24 hours long, so a DST change never skips or repeats one.
 */
export const addDays = (day: string, days: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, ISO_DATE_LENGTH);
