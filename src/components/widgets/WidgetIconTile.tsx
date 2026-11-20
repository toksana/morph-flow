import type { JSX, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface WidgetIconTileProps {
  /** The widget's accent: a translucent border and fill plus the icon color. */
  className: string;
  children: ReactNode;
}

/** The rounded square at the start of every widget header, holding its icon or emoji. */
export const WidgetIconTile = ({ className, children }: WidgetIconTileProps): JSX.Element => (
  <span
    aria-hidden
    className={cn(
      'flex size-10 shrink-0 items-center justify-center rounded-lg border text-lg',
      className,
    )}
  >
    {children}
  </span>
);
