const PROMPT_DATE_LOCALE = 'en-US';

const promptDateParts = (now: Date, timeZone: string): Record<string, string> =>
  Object.fromEntries(
    new Intl.DateTimeFormat(PROMPT_DATE_LOCALE, {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );

/** Today's date in the user's time zone, e.g. "Thursday, 2026-11-19", for resolving "tomorrow". */
export const formatPromptDate = (now: Date, timeZone: string): string => {
  const { weekday, year, month, day } = promptDateParts(now, timeZone);
  return `${weekday}, ${year}-${month}-${day}`;
};

/** True for IANA zones the runtime knows, e.g. "Europe/Moscow"; false for anything else. */
export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat(PROMPT_DATE_LOCALE, { timeZone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
};
