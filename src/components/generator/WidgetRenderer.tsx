import type { JSX } from 'react';

import type { DeepPartial } from '@/core/widgets/deepPartial';
import { toTaskListView } from '@/core/widgets/taskList.view';
import type { Widget } from '@/core/widgets/widget.schema';
import { HabitStreakCard } from '@/components/widgets/habitStreakCard/HabitStreakCard';
import { TaskList } from '@/components/widgets/taskList/TaskList';

import { WidgetSkeleton } from './WidgetSkeleton';

interface WidgetRendererProps {
  widget: DeepPartial<Widget> | undefined;
  isStreaming: boolean;
}

/** Picks the component by the streamed `type`; a skeleton until the type is complete. */
export const WidgetRenderer = ({
  widget,
  isStreaming,
}: WidgetRendererProps): JSX.Element | null => {
  switch (widget?.type) {
    case 'TaskList':
      return <TaskList view={toTaskListView(widget)} isStreaming={isStreaming} />;
    case 'HabitStreakCard':
      return <HabitStreakCard card={widget} isStreaming={isStreaming} />;
    default: {
      // Compile-time check: fails once a type in the registry has no case above.
      const unhandledType: undefined = widget?.type;
      void unhandledType;
      // At runtime the type may still be streaming (e.g. "Habit"), so wait for it.
      return isStreaming ? <WidgetSkeleton /> : null;
    }
  }
};
