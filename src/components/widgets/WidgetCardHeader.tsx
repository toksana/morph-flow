import type { JSX, ReactNode } from 'react';

import type { WidgetType } from '@/core/widgets/widget.schema';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { WidgetIconTile } from './WidgetIconTile';

interface WidgetCardHeaderProps {
  type: WidgetType;
  /** Small caps line above the title, e.g. "Task list". */
  label: string;
  /** Hidden while empty, e.g. before the model has written it. */
  title: string;
  /** Replaces the widget's icon in the tile, e.g. an emoji from the model. */
  icon?: ReactNode;
  /** Right-hand slot: a counter or a badge. */
  trailing?: ReactNode;
}

/**
 * The header every card shares, so all of them read as one family: the icon tile, a small caps
 * label over the title, and an optional counter or badge on the right. A flex row instead of
 * CardAction: CardHeader's grid would put the trailing slot over the title column.
 */
export const WidgetCardHeader = ({
  type,
  label,
  title,
  icon,
  trailing,
}: WidgetCardHeaderProps): JSX.Element => (
  <CardHeader className="flex items-center gap-3">
    <WidgetIconTile type={type}>{icon}</WidgetIconTile>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <CardDescription className="font-mono text-xs tracking-widest uppercase">
        {label}
      </CardDescription>
      {title !== '' && <CardTitle className="truncate">{title}</CardTitle>}
    </div>
    {trailing}
  </CardHeader>
);
