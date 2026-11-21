import { SignInButton } from '@clerk/nextjs';
import type { JSX, ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export const SIGN_IN_TEXT = 'Sign in';

interface SignInLinkProps {
  children?: ReactNode;
}

/** An inline link that opens the Clerk sign-in modal, for use inside a line of text. */
export const SignInLink = ({ children = SIGN_IN_TEXT }: SignInLinkProps): JSX.Element => (
  <SignInButton mode="modal">
    <Button type="button" variant="link" size="xs" className="h-auto px-0">
      {children}
    </Button>
  </SignInButton>
);
