import type { JSX, ReactNode } from 'react';

import type { WidgetType } from '@/core/widgets/widget.schema';
import { cn } from '@/lib/utils';

import { WIDGET_ACCENTS } from './widgetAccents';

interface WidgetIconTileProps {
  type: WidgetType;
  /** Replaces the widget's icon, e.g. an emoji from the model. */
  children?: ReactNode;
}

/** The rounded square at the start of every widget header, in the widget's accent. */
export const WidgetIconTile = ({ type, children }: WidgetIconTileProps): JSX.Element => {
  const { icon: Icon, iconClass, tileClass } = WIDGET_ACCENTS[type];
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg border text-lg',
        tileClass,
        iconClass,
      )}
    >
      {children ?? <Icon className="size-5" />}
    </span>
  );
};
