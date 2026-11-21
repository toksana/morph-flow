import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

/** Sign-in for guests (Clerk modal, no page change), the account menu once signed in. */
export const AuthControls = (): JSX.Element => (
  <>
    <Show when="signed-out">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </SignInButton>
    </Show>
    <Show when="signed-in">
      <UserButton />
    </Show>
  </>
);
