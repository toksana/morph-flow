import type { JSX } from 'react';

import { COLLAPSED_LIMIT_MOBILE } from '@/core/tasks/taskUrgency';
import type { TaskView } from '@/core/widgets/taskList.view';
import { DEFAULT_LOCALE } from '@/components/widgets/taskList/TaskList';
import { TaskListItem } from '@/components/widgets/taskList/TaskListItem';

export const ALL_DONE_TEXT = 'All done';
/** Rows past the phone limit, hidden below `sm` while the card is collapsed. */
export const MOBILE_HIDDEN_CLASS = 'max-sm:hidden';

interface SavedTaskRowsProps {
  tasks: TaskView[];
  isExpanded: boolean;
  onToggle: (taskId: string, done: boolean) => void;
}

/** Clickable rows. Collapsed, a phone shows fewer of them; by CSS, so no hydration mismatch. */
export const SavedTaskRows = ({ tasks, isExpanded, onToggle }: SavedTaskRowsProps): JSX.Element =>
  tasks.length === 0 ? (
    <p className="text-sm text-muted-foreground">{ALL_DONE_TEXT}</p>
  ) : (
    <ul className="divide-y">
      {tasks.map((task, index) => (
        <TaskListItem
          key={task.id}
          task={task}
          locale={DEFAULT_LOCALE}
          onToggle={onToggle}
          className={
            !isExpanded && index >= COLLAPSED_LIMIT_MOBILE ? MOBILE_HIDDEN_CLASS : undefined
          }
        />
      ))}
    </ul>
  );
