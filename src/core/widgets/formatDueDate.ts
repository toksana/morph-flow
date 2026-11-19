const DUE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  // ISO dates parse as UTC midnight; formatting in UTC keeps the calendar day from shifting.
  timeZone: 'UTC',
};

/** Formats a complete ISO date ("2026-11-20") as a short, locale-aware calendar date. */
export const formatDueDate = (isoDate: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, DUE_DATE_FORMAT).format(new Date(isoDate));
