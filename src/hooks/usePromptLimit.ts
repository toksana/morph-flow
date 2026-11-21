import { useAuth } from '@clerk/nextjs';

import { promptLimitFor } from '@/core/widgets/promptLimit';

export interface PromptLimit {
  limit: number;
  isSignedIn: boolean;
}

/**
 * The prompt limit for whoever is typing. While Clerk is still loading the caller counts as a
 * guest: the stricter limit, which the server would apply to an anonymous request anyway.
 */
export const usePromptLimit = (): PromptLimit => {
  const isSignedIn = useAuth().isSignedIn === true;
  return { limit: promptLimitFor(isSignedIn), isSignedIn };
};
