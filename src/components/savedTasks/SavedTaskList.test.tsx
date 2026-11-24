import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildTaskViews } from '@/core/test/factories/taskList.factory';
import type { ToggleTaskResult } from '@/core/tasks/taskToggle';
import { COLLAPSED_LIMIT, COLLAPSED_LIMIT_MOBILE } from '@/core/tasks/taskUrgency';
import type { TaskView } from '@/core/widgets/taskList.view';

import { SAVE_FAILED_TEXT, SavedTaskList } from './SavedTaskList';
import { ALL_DONE_TEXT, MOBILE_HIDDEN_CLASS } from './SavedTaskRows';
import { SHOW_LESS_TEXT, showAllText } from './ShowAllButton';

const MANY_OPEN = 8;
const FEW_OPEN = 4;

/** An action the test settles by hand, so the pending state can be observed. */
const deferredAction = () => {
  let settle: (result: ToggleTaskResult) => void = () => undefined;
  let fail: (error: Error) => void = () => undefined;
  const action = vi.fn(
    () =>
      new Promise<ToggleTaskResult>((resolve, reject) => {
        settle = resolve;
        fail = reject;
      }),
  );
  return {
    action,
    settle: (result: ToggleTaskResult) => settle(result),
    fail: (e: Error) => fail(e),
  };
};

/** Undated, equal priority: urgency ties, so the rows keep the given order. */
const tiedTasks = (count: number, done: boolean): TaskView[] =>
  buildTaskViews(count, { done, due: undefined, priority: 'medium' });

const openTasks = (count: number): TaskView[] => tiedTasks(count, false);

const checkboxFor = (task: TaskView): HTMLElement =>
  screen.getByRole('checkbox', { name: task.title });

describe('SavedTaskList', () => {
  it('ticks a task at once, then rolls it back and says so when the save fails', async () => {
    // Arrange
    const [task] = openTasks(1);
    const { action, settle } = deferredAction();
    render(<SavedTaskList tasks={[task]} toggleAction={action} />);

    // Act
    fireEvent.click(checkboxFor(task));

    // Assert
    expect(checkboxFor(task)).toBeChecked();
    expect(action).toHaveBeenCalledWith({ taskId: task.id, done: true });
    expect(screen.queryByRole('alert')).toBeNull();

    await act(async () => settle({ ok: false, error: 'failed' }));

    expect(checkboxFor(task)).not.toBeChecked();
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_FAILED_TEXT);
  });

  it('rolls back when the request itself fails, e.g. offline', async () => {
    // Arrange
    const [task] = openTasks(1);
    const { action, fail } = deferredAction();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<SavedTaskList tasks={[task]} toggleAction={action} />);
    fireEvent.click(checkboxFor(task));

    // Act
    await act(async () => fail(new Error('Failed to fetch')));

    // Assert
    expect(checkboxFor(task)).not.toBeChecked();
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_FAILED_TEXT);
  });

  it('clears the error on the next tick', async () => {
    // Arrange
    const [task] = openTasks(1);
    const { action, settle } = deferredAction();
    render(<SavedTaskList tasks={[task]} toggleAction={action} />);
    fireEvent.click(checkboxFor(task));
    await act(async () => settle({ ok: false, error: 'failed' }));

    // Act
    fireEvent.click(checkboxFor(task));

    // Assert
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps a saved tick in place, struck through, in the collapsed view', async () => {
    // Arrange
    const tasks = openTasks(MANY_OPEN);
    const target = tasks[1];
    const { action, settle } = deferredAction();
    const { rerender } = render(<SavedTaskList tasks={tasks} toggleAction={action} />);
    fireEvent.click(checkboxFor(target));

    // Act: the action succeeds and the refreshed Server Component passes the saved state.
    await act(async () => settle({ ok: true }));
    const saved = tasks.map((task) => (task === target ? { ...task, done: true } : task));
    rerender(<SavedTaskList tasks={saved} toggleAction={action} />);

    // Assert
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(COLLAPSED_LIMIT);
    expect(within(rows[1]).getByRole('checkbox')).toBeChecked();
    expect(within(rows[1]).getByText(target.title)).toHaveClass('line-through');
  });

  it('shows the most urgent open tasks, hides the extra ones on a phone, and offers all', () => {
    // Arrange
    const tasks = openTasks(MANY_OPEN);

    // Act
    render(<SavedTaskList tasks={tasks} toggleAction={vi.fn()} />);

    // Assert
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(COLLAPSED_LIMIT);
    rows.forEach((row, index) =>
      expect(row.classList.contains(MOBILE_HIDDEN_CLASS)).toBe(index >= COLLAPSED_LIMIT_MOBILE),
    );
    const button = screen.getByRole('button', { name: showAllText(MANY_OPEN) });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveClass('sm:hidden');
  });

  it('shows every task on Show all, open before done, and collapses again on Show less', () => {
    // Arrange
    const open = openTasks(MANY_OPEN);
    const done = tiedTasks(2, true);
    render(<SavedTaskList tasks={[...done, ...open]} toggleAction={vi.fn()} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: showAllText(MANY_OPEN + done.length) }));

    // Assert
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(
      [...open, ...done].map((task) => expect.stringContaining(task.title)),
    );
    rows.forEach((row) => expect(row).not.toHaveClass(MOBILE_HIDDEN_CLASS));
    const less = screen.getByRole('button', { name: SHOW_LESS_TEXT });
    expect(less).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(less);
    expect(screen.getAllByRole('listitem')).toHaveLength(COLLAPSED_LIMIT);
  });

  it('offers Show all on a phone only when a wider screen already shows every task', () => {
    // Act
    render(<SavedTaskList tasks={openTasks(FEW_OPEN)} toggleAction={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: showAllText(FEW_OPEN) })).toHaveClass('sm:hidden');
  });

  it('says all done and offers Show all when every task is done', () => {
    // Arrange
    const done = buildTaskViews(2, { done: true });

    // Act
    render(<SavedTaskList tasks={done} toggleAction={vi.fn()} />);

    // Assert
    expect(screen.getByText(ALL_DONE_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.getByRole('button', { name: showAllText(done.length) })).toBeInTheDocument();
  });
});
