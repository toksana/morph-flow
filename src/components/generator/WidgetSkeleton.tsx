import type { JSX } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const WIDGET_SKELETON_LABEL = 'Generating widget…';

/** Shown until the model has said which widget it is writing. */
export const WidgetSkeleton = (): JSX.Element => (
  <Card aria-busy aria-label={WIDGET_SKELETON_LABEL}>
    <CardHeader className="flex items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);
