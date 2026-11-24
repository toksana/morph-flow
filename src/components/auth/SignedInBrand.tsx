import { Show } from '@clerk/nextjs';
import type { JSX } from 'react';

import { BRAND } from '@/components/landing/Hero';

/** The app's name in the navbar for a signed-in user, who sees no hero to carry it. */
export const SignedInBrand = (): JSX.Element => (
  <Show when="signed-in">
    <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{BRAND}</p>
  </Show>
);
