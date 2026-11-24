/** Why a change was not saved; the client only shows a generic message for any of them. */
export type SaveError = 'invalid' | 'unauthorized' | 'not_found' | 'failed';

/** What a Server Action that saves one change answers: the client rolls back on `ok: false`. */
export type SaveResult = { ok: true } | { ok: false; error: SaveError };
