import type { JSX } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetHeaderSkeleton } from '@/components/widgets/WidgetHeaderSkeleton';

export const WIDGET_SKELETON_LABEL = 'Generating widget…';

/** Shown until the model has said which widget it is writing. */
export const WidgetSkeleton = (): JSX.Element => (
  <Card aria-busy aria-label={WIDGET_SKELETON_LABEL}>
    <WidgetHeaderSkeleton />
    <CardContent className="flex flex-col gap-3">
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);
