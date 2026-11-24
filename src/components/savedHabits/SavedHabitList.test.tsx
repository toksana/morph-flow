import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CheckInHabitResult, SavedHabitView } from '@/core/habits/habitCheckIn';
import { buildSavedHabitViews } from '@/core/test/factories/savedHabit.factory';
import { SAVE_FAILED_TEXT } from '@/components/savedTasks/SavedTaskList';

import { checkInLabel } from './HabitCheckInButton';
import { SAVED_HABITS_LABEL, SAVED_HABITS_TITLE, SavedHabitList } from './SavedHabitList';
import { streakLabel } from './StreakBadge';

/** Settles every action a test left pending: React keeps optimistic state while any is open. */
const pendingActions: Array<() => void> = [];

/** An action the test settles by hand, so the pending state can be observed. */
const deferredAction = () => {
  let settle: (result: CheckInHabitResult) => void = () => undefined;
  let fail: (error: Error) => void = () => undefined;
  const action = vi.fn(
    () =>
      new Promise<CheckInHabitResult>((resolve, reject) => {
        settle = resolve;
        fail = reject;
        pendingActions.push(() => resolve({ ok: true }));
      }),
  );
  return {
    action,
    settle: (result: CheckInHabitResult) => settle(result),
    fail: (error: Error) => fail(error),
  };
};

const buttonFor = (habit: SavedHabitView): HTMLElement =>
  screen.getByRole('button', { name: checkInLabel(habit.title) });

const rowFor = (habit: SavedHabitView): HTMLElement => buttonFor(habit).closest('li')!;

const streakOf = (habit: SavedHabitView): HTMLElement =>
  within(rowFor(habit)).getByLabelText(/-day streak$/);

describe('SavedHabitList', () => {
  afterEach(async () => {
    await act(async () => pendingActions.splice(0).forEach((settle) => settle()));
    vi.restoreAllMocks();
  });

  it('shows the header, the done-today counter and every habit with its streak, in order', () => {
    // Arrange
    const habits = buildSavedHabitViews(4);
    const doneCount = habits.filter((habit) => habit.doneToday).length;

    // Act
    render(<SavedHabitList habits={habits} checkInAction={vi.fn()} />);

    // Assert
    expect(screen.getByText(SAVED_HABITS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(SAVED_HABITS_TITLE)).toBeInTheDocument();
    expect(screen.getByText(`${doneCount}/${habits.length}`)).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(
      habits.map((habit) => expect.stringContaining(habit.title)),
    );
    habits.forEach((habit) => {
      expect(streakOf(habit)).toHaveAccessibleName(streakLabel(habit.streakDays));
      expect(streakOf(habit)).toHaveTextContent(`🔥 ${habit.streakDays}d`);
      expect(buttonFor(habit)).toHaveAttribute('aria-pressed', String(habit.doneToday));
    });
  });

  it('checks a habit in at once, adding today to the streak and the counter', () => {
    // Arrange
    const [habit] = buildSavedHabitViews(1, { doneToday: false });
    const { action } = deferredAction();
    render(<SavedHabitList habits={[habit]} checkInAction={action} />);

    // Act
    fireEvent.click(buttonFor(habit));

    // Assert
    expect(action).toHaveBeenCalledWith({ habitId: habit.id, done: true });
    expect(buttonFor(habit)).toHaveAttribute('aria-pressed', 'true');
    expect(streakOf(habit)).toHaveAccessibleName(streakLabel(habit.streakDays + 1));
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it("undoes today's check-in with the same tap", () => {
    // Arrange
    const [habit] = buildSavedHabitViews(1, { doneToday: true, streakDays: 5 });
    const { action } = deferredAction();
    render(<SavedHabitList habits={[habit]} checkInAction={action} />);

    // Act
    fireEvent.click(buttonFor(habit));

    // Assert
    expect(action).toHaveBeenCalledWith({ habitId: habit.id, done: false });
    expect(buttonFor(habit)).toHaveAttribute('aria-pressed', 'false');
    expect(streakOf(habit)).toHaveAccessibleName(streakLabel(4));
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('rolls the check-in back and says so when the save fails', async () => {
    // Arrange
    const [habit] = buildSavedHabitViews(1, { doneToday: false });
    const { action, settle } = deferredAction();
    render(<SavedHabitList habits={[habit]} checkInAction={action} />);
    fireEvent.click(buttonFor(habit));

    // Act
    await act(async () => settle({ ok: false, error: 'failed' }));

    // Assert
    expect(buttonFor(habit)).toHaveAttribute('aria-pressed', 'false');
    expect(streakOf(habit)).toHaveAccessibleName(streakLabel(habit.streakDays));
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_FAILED_TEXT);
  });

  it('rolls back when the request itself fails, e.g. offline, and clears the error on the next tap', async () => {
    // Arrange
    const [habit] = buildSavedHabitViews(1, { doneToday: false });
    const { action, fail } = deferredAction();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<SavedHabitList habits={[habit]} checkInAction={action} />);
    fireEvent.click(buttonFor(habit));

    // Act
    await act(async () => fail(new Error('Failed to fetch')));
    const alertAfterFailure = screen.queryByRole('alert');
    fireEvent.click(buttonFor(habit));

    // Assert
    expect(alertAfterFailure).toHaveTextContent(SAVE_FAILED_TEXT);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the saved state once the refreshed list arrives', async () => {
    // Arrange
    const habits = buildSavedHabitViews(3, { doneToday: false });
    const target = habits[1];
    const { action, settle } = deferredAction();
    const { rerender } = render(<SavedHabitList habits={habits} checkInAction={action} />);
    fireEvent.click(buttonFor(target));

    // Act: the action succeeds and the refreshed Server Component passes the counted streak.
    await act(async () => settle({ ok: true }));
    const saved = habits.map((habit) =>
      habit === target ? { ...habit, doneToday: true, streakDays: habit.streakDays + 1 } : habit,
    );
    rerender(<SavedHabitList habits={saved} checkInAction={action} />);

    // Assert
    expect(buttonFor(target)).toHaveAttribute('aria-pressed', 'true');
    expect(streakOf(target)).toHaveAccessibleName(streakLabel(target.streakDays + 1));
    expect(screen.getAllByRole('listitem')[1]).toBe(rowFor(target));
  });
});
