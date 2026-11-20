import { faker } from '@faker-js/faker';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildTask, buildTaskList } from '@/core/test/factories/taskList.factory';
import { formatDueDate } from '@/core/widgets/formatDueDate';
import type { TaskPriority } from '@/core/widgets/taskList.schema';
import { toTaskListView } from '@/core/widgets/taskList.view';

import { DEFAULT_LOCALE, TaskList } from './TaskList';
import { TASK_LIST_LABEL } from './TaskListHeader';

const RANDOM_RUNS = 10;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

const renderList = (tasks = buildTaskList().tasks) => {
  const view = toTaskListView(buildTaskList({ tasks }));
  const { unmount } = render(<TaskList view={view} />);
  return { view, unmount };
};

describe('TaskList', () => {
  it('mirrors every task of random lists as a read-only checkbox in view order', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const { view, unmount } = renderList();

      // Act
      const checkboxes = screen.getAllByRole('checkbox');

      // Assert
      expect(checkboxes).toHaveLength(view.totalCount);
      checkboxes.forEach((checkbox, index) => {
        const task = view.tasks[index];
        expect(checkbox).toHaveAccessibleName(task.title);
        expect(checkbox).toHaveAttribute('aria-checked', String(task.done));
        expect(checkbox).toBeDisabled();
      });

      unmount();
    });
  });

  it('shows the title, the done counter and the completion percent', () => {
    // Arrange
    const { view } = renderList();

    // Act
    const progress = screen.getByRole('progressbar', { name: 'Completion' });

    // Assert
    expect(screen.getByText(view.title)).toBeInTheDocument();
    expect(screen.getByText(`${view.doneCount}/${view.totalCount}`)).toBeInTheDocument();
    expect(progress).toHaveAttribute('aria-valuenow', String(view.completionPercent));
  });

  it('shows an empty state instead of a list when no task has streamed yet', () => {
    // Act
    render(<TaskList view={toTaskListView(undefined)} />);

    // Assert
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText('0/0')).toBeNull();
  });

  it('names the card as a task list before its title or tasks have streamed', () => {
    // Act
    render(<TaskList view={toTaskListView(undefined)} isStreaming />);

    // Assert
    expect(screen.getByText(TASK_LIST_LABEL)).toBeInTheDocument();
  });

  it('shows the streamed title before any task has arrived', () => {
    // Arrange
    const title = faker.lorem.words(3);

    // Act
    render(<TaskList view={toTaskListView({ title })} />);

    // Assert
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('renders the due date as a machine-readable, formatted time', () => {
    // Arrange
    const due = faker.date.soon({ days: 30 }).toISOString().slice(0, ISO_DATE_LENGTH);
    renderList([buildTask({ due })]);

    // Act
    const time = screen.getByText(formatDueDate(due, DEFAULT_LOCALE));

    // Assert
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', due);
  });

  it('omits the due date when the task has none', () => {
    // Arrange
    const task = buildTask({ due: undefined });
    renderList([task]);

    // Act
    const item = screen.getByRole('listitem');

    // Assert
    expect(item.querySelector('time')).toBeNull();
  });

  it.each<[TaskPriority, string]>([
    ['high', 'High'],
    ['medium', 'Medium'],
    ['low', 'Low'],
  ])('labels %s priority as %s', (priority, label) => {
    // Arrange
    renderList([buildTask({ priority })]);

    // Act
    const item = screen.getByRole('listitem');

    // Assert
    expect(within(item).getByText(label)).toBeInTheDocument();
  });
});
