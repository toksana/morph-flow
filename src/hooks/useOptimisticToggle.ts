import { startTransition, useOptimistic, useState } from 'react';

import type { SaveResult } from '@/core/saveResult';

export type SaveAction<TRequest> = (request: TRequest) => Promise<SaveResult>;

export interface OptimisticToggle<TItem, TRequest> {
  /** The saved items with every change still in flight already applied. */
  items: TItem[];
  toggle: (request: TRequest) => void;
  /** True after a change that was not saved; cleared by the next one. */
  hasError: boolean;
}

interface OptimisticToggleOptions<TItem, TRequest> {
  /** Pure: the items with one request applied, e.g. a task ticked or a habit checked in. */
  apply: (items: TItem[], request: TRequest) => TItem[];
  action: SaveAction<TRequest>;
  /** Log prefix for a request that never reached the server, e.g. "tasks". */
  scope: string;
}

/**
 * Applies a change at once and saves it in the background. When the action settles, the
 * optimistic state gives way to `items`: the saved state on success (the action refreshes the
 * page's Server Components), or the state before the change on failure, so it rolls itself back.
 */
export const useOptimisticToggle = <TItem, TRequest>(
  items: TItem[],
  { apply, action, scope }: OptimisticToggleOptions<TItem, TRequest>,
): OptimisticToggle<TItem, TRequest> => {
  const [optimisticItems, applyOptimistic] = useOptimistic(items, apply);
  const [hasError, setHasError] = useState(false);

  const save = async (request: TRequest): Promise<boolean> => {
    try {
      return (await action(request)).ok;
    } catch (error) {
      // A network failure rejects instead of returning a result; it counts as not saved.
      if (error instanceof Error) console.error(`[${scope}] save request failed:`, error.message);
      return false;
    }
  };

  const toggle = (request: TRequest): void => {
    setHasError(false);
    startTransition(async () => {
      applyOptimistic(request);
      if (!(await save(request))) setHasError(true);
    });
  };

  return { items: optimisticItems, toggle, hasError };
};
