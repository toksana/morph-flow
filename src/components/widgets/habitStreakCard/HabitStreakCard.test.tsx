import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { toHabitStreakView } from '@/core/widgets/habitStreakCard.view';

import { CHECK_IN_TEXT, UNDO_TEXT } from './CheckInButton';
import { HabitStreakCard } from './HabitStreakCard';
import { STREAK_PROGRESS_LABEL } from './StreakProgress';

const RANDOM_RUNS = 10;

const progressBar = () => screen.getByRole('progressbar', { name: STREAK_PROGRESS_LABEL });

describe('HabitStreakCard', () => {
  it('shows the title, streak, target and goal progress of random cards', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const card = buildHabitStreakCard();
      const view = toHabitStreakView(card);

      // Act
      const { unmount } = render(<HabitStreakCard card={card} />);

      // Assert
      expect(screen.getByText(view.title)).toBeInTheDocument();
      expect(screen.getByText(String(view.streakDays))).toBeInTheDocument();
      expect(screen.getByText(`Target: ${view.targetDays}d`)).toBeInTheDocument();
      expect(screen.getByText(`${view.goalPercent}% of goal`)).toBeInTheDocument();
      expect(progressBar()).toHaveAttribute('aria-valuenow', String(view.goalPercent));

      unmount();
    });
  });

  it('offers a check-in while today is pending', () => {
    // Arrange
    const card = buildHabitStreakCard({ completedToday: false });

    // Act
    render(<HabitStreakCard card={card} />);

    // Assert
    expect(screen.getByRole('button', { name: CHECK_IN_TEXT })).toBeEnabled();
    expect(screen.getByText("Pending today's check-in")).toBeInTheDocument();
    expect(progressBar()).toHaveAttribute('data-checked-in', 'false');
  });

  it('adds today to the streak on check-in and removes it on undo', () => {
    // Arrange
    const streakDays = faker.number.int({ min: 2, max: 100 });
    const card = buildHabitStreakCard({ streakDays, completedToday: false });
    render(<HabitStreakCard card={card} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: CHECK_IN_TEXT }));

    // Assert
    expect(screen.getByText(String(streakDays + 1))).toBeInTheDocument();
    expect(screen.getByText('Logged for today')).toBeInTheDocument();
    expect(progressBar()).toHaveAttribute('data-checked-in', 'true');

    // Act
    fireEvent.click(screen.getByRole('button', { name: UNDO_TEXT }));

    // Assert
    expect(screen.getByText(String(streakDays))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CHECK_IN_TEXT })).toBeInTheDocument();
  });

  it('lets the user undo a check-in the model reported', () => {
    // Arrange
    const streakDays = faker.number.int({ min: 2, max: 100 });
    render(<HabitStreakCard card={buildHabitStreakCard({ streakDays, completedToday: true })} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: UNDO_TEXT }));

    // Assert
    expect(screen.getByText(String(streakDays - 1))).toBeInTheDocument();
  });

  it('disables the check-in while the card is still streaming', () => {
    // Arrange
    const card = buildHabitStreakCard({ completedToday: false });

    // Act
    render(<HabitStreakCard card={card} isStreaming />);

    // Assert
    expect(screen.getByRole('button', { name: CHECK_IN_TEXT })).toBeDisabled();
  });

  it('shows a generating state instead of default counters before progress streams', () => {
    // Arrange
    const title = faker.lorem.words(3);

    // Act
    render(<HabitStreakCard card={{ title, streakDays: 3 }} isStreaming />);

    // Assert
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('Generating habit…')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/Target:/)).toBeNull();
  });

  it('shows an empty state when nothing has streamed', () => {
    // Act
    render(<HabitStreakCard card={undefined} />);

    // Assert
    expect(screen.getByText('No habit yet')).toBeInTheDocument();
  });

  it('uses the singular unit for a one-day streak', () => {
    // Act
    render(
      <HabitStreakCard card={buildHabitStreakCard({ streakDays: 1, completedToday: true })} />,
    );

    // Assert
    expect(screen.getByText('day streak')).toBeInTheDocument();
  });
});
