import type { JSX } from 'react';

import { SignInLink } from '@/components/auth/SignInLink';

export const SIGN_IN_FOR_MORE_TEXT = 'Sign in for more';

export const rateLimitText = (minutes: number): string =>
  `Hourly limit reached. Try again in ${minutes} min.`;

interface RateLimitNoticeProps {
  /** Whole minutes until the hourly allowance resets. */
  minutes: number;
  isSignedIn: boolean;
}

/** Shown in place of the generic error when the hourly allowance is used up; guests may sign in for a larger one. */
export const RateLimitNotice = ({ minutes, isSignedIn }: RateLimitNoticeProps): JSX.Element => (
  <p role="alert" className="flex flex-wrap items-center gap-x-1.5 text-sm text-destructive">
    {rateLimitText(minutes)}
    {!isSignedIn && <SignInLink>{SIGN_IN_FOR_MORE_TEXT}</SignInLink>}
  </p>
);
