import type { JSX } from 'react';

export const BRAND = 'Morph Flow';
export const HEADLINE = 'The Zero-UI task and habit planner.';
export const SUBTITLE =
  'Type what you need, and the right interactive card appears — a task list or a habit streak, built live as the model writes it.';

/** What the app is, in one line, before the user has typed anything. */
export const Hero = (): JSX.Element => (
  <header className="flex flex-col items-center gap-4 text-center">
    <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{BRAND}</p>
    <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      {HEADLINE}
    </h1>
    <p className="max-w-prose text-balance text-muted-foreground">{SUBTITLE}</p>
  </header>
);
