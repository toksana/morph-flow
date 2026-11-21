import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { GUEST_PROMPT_LIMIT, USER_PROMPT_LIMIT } from '@/core/constants';
import { COUNTER_VISIBLE_RATIO } from '@/core/widgets/promptLimit';
import { SIGN_IN_TEXT } from '@/components/auth/SignInLink';

import { GENERATE_LABEL } from './PromptAction';
import { PROMPT_LABEL, PromptForm } from './PromptForm';
import { guestLimitText, userLimitText } from './PromptLimitNotice';

// The real button needs <ClerkProvider>; here it only has to render its trigger.
vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: ReactNode }) => children,
}));

const countFormat = new Intl.NumberFormat('en-US');
const counterText = (length: number, limit: number): string =>
  `${countFormat.format(length)} / ${countFormat.format(limit)}`;

const renderForm = ({
  value,
  limit = GUEST_PROMPT_LIMIT,
  isSignedIn = false,
}: {
  value: string;
  limit?: number;
  isSignedIn?: boolean;
}) => {
  const onSubmit = vi.fn();
  render(
    <PromptForm
      value={value}
      placeholder={faker.lorem.sentence()}
      isDocked={false}
      onValueChange={() => undefined}
      onSubmit={onSubmit}
      onStop={() => undefined}
      isStreaming={false}
      limit={limit}
      isSignedIn={isSignedIn}
    />,
  );
  return { onSubmit };
};

const promptOf = (length: number): string => faker.string.alpha({ length });
const generateButton = () => screen.getByRole('button', { name: GENERATE_LABEL });
const counter = (length: number, limit: number) => screen.getByText(counterText(length, limit));

describe('PromptForm length limit', () => {
  it('keeps the counter hidden below 80% of the limit', () => {
    // Arrange
    const length = faker.number.int({
      min: 1,
      max: GUEST_PROMPT_LIMIT * COUNTER_VISIBLE_RATIO - 1,
    });

    // Act
    renderForm({ value: promptOf(length) });

    // Assert
    expect(counter(length, GUEST_PROMPT_LIMIT)).toHaveAttribute('aria-hidden', 'true');
    expect(generateButton()).toBeEnabled();
  });

  it('shows the counter from 80% of the limit and still allows sending', () => {
    // Arrange
    const length = faker.number.int({
      min: GUEST_PROMPT_LIMIT * COUNTER_VISIBLE_RATIO,
      max: GUEST_PROMPT_LIMIT,
    });

    // Act
    renderForm({ value: promptOf(length) });

    // Assert
    expect(counter(length, GUEST_PROMPT_LIMIT)).toHaveAttribute('aria-hidden', 'false');
    expect(generateButton()).toBeEnabled();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('counts the trimmed prompt, as the server does', () => {
    // Arrange
    const prompt = promptOf(GUEST_PROMPT_LIMIT);

    // Act
    renderForm({ value: `  ${prompt}\n\n` });

    // Assert
    expect(counter(GUEST_PROMPT_LIMIT, GUEST_PROMPT_LIMIT)).toBeInTheDocument();
    expect(generateButton()).toBeEnabled();
  });

  it('blocks sending past the guest limit, keeps the text and offers to sign in', () => {
    // Arrange
    const length = faker.number.int({ min: GUEST_PROMPT_LIMIT + 1, max: USER_PROMPT_LIMIT });
    const value = promptOf(length);

    // Act
    const { onSubmit } = renderForm({ value });
    fireEvent.keyDown(screen.getByLabelText(PROMPT_LABEL), { key: 'Enter' });

    // Assert
    expect(generateButton()).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(PROMPT_LABEL)).toHaveValue(value);
    expect(screen.getByLabelText(PROMPT_LABEL)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(guestLimitText(GUEST_PROMPT_LIMIT));
    expect(screen.getByRole('button', { name: SIGN_IN_TEXT })).toBeInTheDocument();
  });

  it('asks a signed-in user past the limit to shorten or split the prompt, without sign-in', () => {
    // Arrange
    const length = faker.number.int({ min: USER_PROMPT_LIMIT + 1, max: USER_PROMPT_LIMIT * 2 });

    // Act
    renderForm({ value: promptOf(length), limit: USER_PROMPT_LIMIT, isSignedIn: true });

    // Assert
    expect(generateButton()).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(userLimitText(USER_PROMPT_LIMIT));
    expect(screen.getByRole('status')).toHaveTextContent('Character limit reached (2,000 max).');
    expect(screen.queryByRole('button', { name: SIGN_IN_TEXT })).toBeNull();
  });
});
