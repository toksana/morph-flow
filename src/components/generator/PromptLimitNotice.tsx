import { SignInButton } from '@clerk/nextjs';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

export const SIGN_IN_TEXT = 'Sign in';

const countFormat = new Intl.NumberFormat('en-US');

export const guestLimitText = (limit: number): string =>
  `Guest limit reached (${countFormat.format(limit)} chars).`;

export const userLimitText = (limit: number): string =>
  `Character limit reached (${countFormat.format(limit)} max). Please shorten your prompt or split it into two requests.`;

interface PromptLimitNoticeProps {
  limit: number;
  isSignedIn: boolean;
}

/**
 * Shown while the prompt is over the limit and submit is blocked. Guests are offered the
 * longer signed-in limit; signed-in users are asked to shorten or split the prompt.
 */
export const PromptLimitNotice = ({ limit, isSignedIn }: PromptLimitNoticeProps): JSX.Element => (
  <p
    role="status"
    // Same red as the over-limit counter, on a tint that stays readable over cards in the dock.
    className="mb-2 flex w-fit max-w-full flex-wrap items-center gap-x-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive shadow-sm backdrop-blur-md dark:bg-destructive/20"
  >
    {isSignedIn ? (
      userLimitText(limit)
    ) : (
      <>
        {guestLimitText(limit)}
        <SignInButton mode="modal">
          <Button type="button" variant="link" size="xs" className="h-auto px-0">
            {SIGN_IN_TEXT}
          </Button>
        </SignInButton>
      </>
    )}
  </p>
);
