import type { JSX } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetHeaderSkeleton } from '@/components/widgets/WidgetHeaderSkeleton';

import { PAIR_GRID_CLASS } from './StartCards';

export const SAVED_CARDS_SKELETON_LABEL = 'Loading your tasks and habits…';
/** Placeholder rows per card: what a phone shows of a collapsed task list. */
export const SKELETON_ROW_COUNT = 3;

/** Varied widths, so the rows read as text rather than as one block. */
const TITLE_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3'] as const;
const ROW_KEYS = Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => index);

const titleWidth = (index: number): string => TITLE_WIDTHS[index % TITLE_WIDTHS.length];

/** A "Your tasks" row: checkbox, title, priority badge; py-2 like TaskListItem. */
const TaskRowSkeleton = ({ index }: { index: number }): JSX.Element => (
  <li className="flex items-center gap-3 py-2">
    <Skeleton className="size-4 shrink-0 rounded-[4px]" />
    <Skeleton className={`h-4 ${titleWidth(index)}`} />
    <Skeleton className="ml-auto h-5 w-14 shrink-0 rounded-4xl" />
  </li>
);

/** A "Habits" row: title, streak badge, round check-in; py-2 like SavedHabitRow. */
const HabitRowSkeleton = ({ index }: { index: number }): JSX.Element => (
  <li className="flex items-center gap-3 py-2">
    <Skeleton className={`h-4 ${titleWidth(index + 1)}`} />
    <Skeleton className="ml-auto h-5 w-12 shrink-0 rounded-4xl" />
    <Skeleton className="size-9 shrink-0 rounded-full" />
  </li>
);

const TasksCardSkeleton = (): JSX.Element => (
  <Card>
    <WidgetHeaderSkeleton withCounter />
    <CardContent className="flex flex-col gap-3">
      <Skeleton className="h-1 w-full rounded-full" />
      <ul className="divide-y">
        {ROW_KEYS.map((index) => (
          <TaskRowSkeleton key={index} index={index} />
        ))}
      </ul>
    </CardContent>
  </Card>
);

const HabitsCardSkeleton = (): JSX.Element => (
  <Card>
    <WidgetHeaderSkeleton withCounter />
    <CardContent className="flex flex-col gap-3">
      <ul className="divide-y">
        {ROW_KEYS.map((index) => (
          <HabitRowSkeleton key={index} index={index} />
        ))}
      </ul>
    </CardContent>
  </Card>
);

/**
 * Shown under the field while the saved cards load, so they do not pop in out of nowhere. It
 * always takes the shape of the common case, both cards in the bento pair: the server only knows
 * how many there are after the read.
 */
export const SavedCardsSkeleton = (): JSX.Element => (
  <div role="status" aria-busy aria-label={SAVED_CARDS_SKELETON_LABEL} className={PAIR_GRID_CLASS}>
    <TasksCardSkeleton />
    <HabitsCardSkeleton />
  </div>
);
