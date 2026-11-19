import { useObject } from '@ai-sdk/react';

import { currentTimeZone } from '@/core/widgets/promptDate';
import type { GenerateRequest } from '@/core/widgets/generate.request';
import { type TaskList, taskListSchema } from '@/core/widgets/taskList.schema';
import { type TaskListView, toTaskListView } from '@/core/widgets/taskList.view';

export const TASK_LIST_ENDPOINT = '/api/task-list';

export interface TaskListStream {
  /** Render-ready view of the list so far; empty until the first chunk arrives. */
  view: TaskListView;
  /** True once a request is in flight or data has arrived, so the card can show before the first chunk. */
  hasStarted: boolean;
  isStreaming: boolean;
  hasError: boolean;
  generate: (prompt: string) => void;
  stop: () => void;
}

/** Streams a TaskList for a prompt, resolving relative dates in the user's time zone. */
export const useTaskListStream = (): TaskListStream => {
  const { object, submit, stop, isLoading, error } = useObject<
    typeof taskListSchema,
    TaskList,
    GenerateRequest
  >({ api: TASK_LIST_ENDPOINT, schema: taskListSchema });

  return {
    view: toTaskListView(object),
    hasStarted: object !== undefined || isLoading,
    isStreaming: isLoading,
    hasError: error !== undefined,
    generate: (prompt) => submit({ prompt, timeZone: currentTimeZone() }),
    stop,
  };
};
