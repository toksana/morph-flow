import type { JSX } from 'react';

import { CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface WidgetHeaderSkeletonProps {
  /** Reserves the counter on the right, for cards whose header shows one. */
  withCounter?: boolean;
}

/** The shape of WidgetCardHeader: icon tile, label and title, and optionally the counter. */
export const WidgetHeaderSkeleton = ({
  withCounter = false,
}: WidgetHeaderSkeletonProps): JSX.Element => (
  <CardHeader className="flex items-center gap-3">
    <Skeleton className="size-10 shrink-0 rounded-lg" />
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-48 max-w-full" />
    </div>
    {withCounter && <Skeleton className="h-4 w-7 shrink-0" />}
  </CardHeader>
);
