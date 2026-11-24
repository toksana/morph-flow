export type LogError = (scope: string, error: unknown) => void;

/**
 * Logs a server failure under a `[area]` prefix. Only the message is logged, never a stack or
 * a whole object, so the log stays short and holds nothing the client sent.
 */
export const createLogError =
  (area: string): LogError =>
  (scope, error) => {
    if (error instanceof Error) {
      console.error(`[${area}] ${scope}:`, error.message);
      return;
    }
    console.error(`[${area}] ${scope} with a non-Error value:`, error);
  };
