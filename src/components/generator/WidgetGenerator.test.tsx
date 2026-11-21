import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { buildTaskList, buildTasks } from '@/core/test/factories/taskList.factory';
import { WIDGETS } from '@/core/widgets/widget.schema';
import { CHECK_IN_TEXT, UNDO_TEXT } from '@/components/widgets/habitStreakCard/CheckInButton';

import { NEW_CARD_LABEL } from './NewCardButton';
import { PROMPT_LABEL } from './PromptForm';
import { PRESETS_LABEL } from './PromptPresets';
import { NEXT_PLACEHOLDER, START_PLACEHOLDER, WidgetGenerator } from './WidgetGenerator';
import { WIDGET_SKELETON_LABEL } from './WidgetSkeleton';

// Not UTC and not the machine's zone, so a hard-coded or server-side zone cannot pass.
const USER_TIME_ZONE = 'Pacific/Kiritimati';

// Clerk needs its provider; the generator only cares about the resulting limit.
vi.mock('@/hooks/usePromptLimit', async () => {
  const { GUEST_PROMPT_LIMIT } = await import('@/core/constants');
  return { usePromptLimit: () => ({ limit: GUEST_PROMPT_LIMIT, isSignedIn: false }) };
});

vi.mock('@/core/widgets/promptDate', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/core/widgets/promptDate')>()),
  currentTimeZone: () => USER_TIME_ZONE,
}));

const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;

/** A streaming response the test feeds chunk by chunk, like a model would. */
const controlledResponse = () => {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const body = new ReadableStream<Uint8Array>({
    start: (streamController) => {
      controller = streamController;
    },
  });
  return {
    response: new Response(body, { status: HTTP_OK }),
    push: (text: string) => controller?.enqueue(encoder.encode(text)),
    close: () => controller?.close(),
  };
};

/** Answers each request with the next response, in order. */
const mockFetch = (...responses: Response[]) => {
  const queue = [...responses];
  const fetchMock = vi.fn(async () => queue.shift() ?? new Response(null, { status: HTTP_OK }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

/** The JSON the endpoint streams for one widget. */
const responseJson = (widget: object): string => JSON.stringify({ widget });

const typePrompt = (prompt: string) => {
  fireEvent.change(screen.getByLabelText(PROMPT_LABEL), {
    target: { value: prompt },
  });
};

const promptField = () => screen.getByLabelText(PROMPT_LABEL);

const clickGenerate = () => fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

describe('WidgetGenerator', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the prompt with the user's time zone to the generate endpoint", async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    const stream = controlledResponse();
    const fetchMock = mockFetch(stream.response);
    render(<WidgetGenerator />);

    // Act
    typePrompt(prompt);
    clickGenerate();

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/generate');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ prompt, timeZone: USER_TIME_ZONE });
    stream.close();
  });

  it('renders tasks as they stream in and returns to Generate when done', async () => {
    // Arrange
    const taskList = buildTaskList({ tasks: buildTasks(3) });
    const json = responseJson(taskList);
    const secondTaskStart = json.indexOf(JSON.stringify(taskList.tasks[1]));
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());
    clickGenerate();

    // Act
    stream.push(json.slice(0, secondTaskStart));

    // Assert
    expect(await screen.findByText(taskList.tasks[0].title)).toBeInTheDocument();
    expect(screen.queryByText(taskList.tasks[1].title)).toBeNull();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();

    // Act
    stream.push(json.slice(secondTaskStart));
    stream.close();

    // Assert
    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
    taskList.tasks.forEach((task) => expect(screen.getByText(task.title)).toBeInTheDocument());
    expect(screen.getAllByRole('checkbox')).toHaveLength(taskList.tasks.length);
  });

  it('shows a busy skeleton until the widget type is complete, then stops on demand', async () => {
    // Arrange
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());

    // Act
    clickGenerate();

    // Assert
    const skeleton = await screen.findByLabelText(WIDGET_SKELETON_LABEL);
    expect(skeleton).toHaveAttribute('aria-busy', 'true');

    // Act: a half-written type must not pick a component yet.
    stream.push('{"widget":{"type":"Habit');

    // Assert
    await waitFor(() => expect(screen.getByLabelText(WIDGET_SKELETON_LABEL)).toBeInTheDocument());

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    // Assert
    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.queryByLabelText(WIDGET_SKELETON_LABEL)).toBeNull();
  });

  it('renders a HabitStreakCard when the model picks one', async () => {
    // Arrange
    const card = buildHabitStreakCard({ completedToday: false });
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());
    clickGenerate();

    // Act
    stream.push(responseJson(card));
    stream.close();

    // Assert
    expect(await screen.findByText(card.title)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: CHECK_IN_TEXT })).toBeEnabled();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('drops the local check-in when a new card is generated', async () => {
    // Arrange
    const card = buildHabitStreakCard({ completedToday: false });
    const first = controlledResponse();
    const second = controlledResponse();
    mockFetch(first.response, second.response);
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());
    clickGenerate();
    first.push(responseJson(card));
    first.close();
    fireEvent.click(await screen.findByRole('button', { name: CHECK_IN_TEXT }));
    expect(screen.getByRole('button', { name: UNDO_TEXT })).toBeInTheDocument();

    // Act
    typePrompt(faker.lorem.sentence());
    clickGenerate();
    second.push(responseJson(card));
    second.close();

    // Assert
    expect(await screen.findByRole('button', { name: CHECK_IN_TEXT })).toBeEnabled();
    expect(screen.queryByRole('button', { name: UNDO_TEXT })).toBeNull();
  });

  it.each(WIDGETS.map((widget) => [widget.type, widget.examplePrompt] as const))(
    'sends the %s example at once and leaves the field ready for the next one',
    async (_type, examplePrompt) => {
      // Arrange
      const stream = controlledResponse();
      const fetchMock = mockFetch(stream.response);
      render(<WidgetGenerator />);
      const presets = screen.getByRole('group', { name: PRESETS_LABEL });

      // Act
      fireEvent.click(within(presets).getByRole('button', { name: examplePrompt }));

      // Assert
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(JSON.parse(String(init.body))).toMatchObject({ prompt: examplePrompt });
      expect(promptField()).toHaveValue('');
      expect(promptField()).toHaveAttribute('placeholder', NEXT_PLACEHOLDER);
      within(presets)
        .getAllByRole('button')
        .forEach((button) => expect(button).toBeDisabled());
      stream.close();
    },
  );

  it('clears the field on send and switches to the next-card placeholder', async () => {
    // Arrange
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator />);
    expect(promptField()).toHaveAttribute('placeholder', START_PLACEHOLDER);
    typePrompt(faker.lorem.sentence());

    // Act
    clickGenerate();

    // Assert
    expect(promptField()).toHaveValue('');
    expect(promptField()).toHaveAttribute('placeholder', NEXT_PLACEHOLDER);

    // Act: stopping keeps the half-built card, so the text does not come back.
    fireEvent.click(await screen.findByRole('button', { name: 'Stop' }));

    // Assert
    expect(promptField()).toHaveValue('');
    stream.close();
  });

  it('puts the sent text back in the field when the request fails', async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    mockFetch(new Response(null, { status: HTTP_SERVER_ERROR }));
    render(<WidgetGenerator />);
    typePrompt(prompt);

    // Act
    clickGenerate();

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(promptField()).toHaveValue(prompt);
  });

  it('treats a stream cut off mid-card as a failure and puts the text back', async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    const json = responseJson(buildTaskList({ tasks: buildTasks(3) }));
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator />);
    typePrompt(prompt);
    clickGenerate();

    // Act: the connection ends before the JSON is complete, still with status 200.
    stream.push(json.slice(0, json.length / 2));
    stream.close();

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(promptField()).toHaveValue(prompt);
    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('keeps text typed during a request that then fails', async () => {
    // Arrange
    const typedLater = faker.lorem.sentence();
    let failRequest: (response: Response) => void = () => {};
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (failRequest = resolve)));
    vi.stubGlobal('fetch', fetchMock);
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());
    clickGenerate();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    typePrompt(typedLater);

    // Act
    await act(async () => failRequest(new Response(null, { status: HTTP_SERVER_ERROR })));

    // Assert
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(promptField()).toHaveValue(typedLater);
  });

  it('swaps the intro and examples for the card once a request is sent', async () => {
    // Arrange
    const introText = faker.lorem.sentence();
    const card = buildHabitStreakCard();
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator intro={<p>{introText}</p>} />);
    expect(screen.getByText(introText)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: NEW_CARD_LABEL })).toBeNull();
    typePrompt(faker.lorem.sentence());

    // Act
    clickGenerate();
    stream.push(responseJson(card));
    stream.close();

    // Assert
    expect(await screen.findByText(card.title)).toBeInTheDocument();
    expect(screen.queryByText(introText)).toBeNull();
    expect(screen.queryByRole('group', { name: PRESETS_LABEL })).toBeNull();
    expect(screen.getByRole('button', { name: NEW_CARD_LABEL })).toBeInTheDocument();
  });

  it('returns to the start screen on New, dropping the card mid-stream', async () => {
    // Arrange
    const introText = faker.lorem.sentence();
    const card = buildHabitStreakCard();
    const json = responseJson(card);
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<WidgetGenerator intro={<p>{introText}</p>} />);
    typePrompt(faker.lorem.sentence());
    clickGenerate();
    stream.push(json.slice(0, json.indexOf('"streakDays"')));
    expect(await screen.findByText(card.title)).toBeInTheDocument();

    // Act
    fireEvent.click(screen.getByRole('button', { name: NEW_CARD_LABEL }));

    // Assert: the request is stopped, not left running behind the start screen.
    expect(await screen.findByText(introText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    stream.push(json.slice(json.indexOf('"streakDays"')));
    stream.close();
    expect(screen.getByRole('group', { name: PRESETS_LABEL })).toBeInTheDocument();
    expect(screen.queryByText(card.title)).toBeNull();
    expect(screen.queryByRole('button', { name: NEW_CARD_LABEL })).toBeNull();
    expect(promptField()).toHaveAttribute('placeholder', START_PLACEHOLDER);
  });

  it('shows a generic error and no card when the request fails', async () => {
    // Arrange
    mockFetch(new Response('upstream detail that must not leak', { status: HTTP_SERVER_ERROR }));
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());

    // Act
    clickGenerate();

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
    expect(screen.queryByText(/upstream detail/)).toBeNull();
    expect(screen.queryByText('No tasks yet')).toBeNull();
    expect(screen.queryByLabelText(WIDGET_SKELETON_LABEL)).toBeNull();
  });

  it.each([[''], ['   \n']])('keeps Generate disabled for prompt %j', (prompt) => {
    // Arrange
    const fetchMock = mockFetch(controlledResponse().response);
    render(<WidgetGenerator />);

    // Act
    typePrompt(prompt);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    // Assert
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits on Enter but not on Shift+Enter', async () => {
    // Arrange
    const stream = controlledResponse();
    const fetchMock = mockFetch(stream.response);
    render(<WidgetGenerator />);
    typePrompt(faker.lorem.sentence());

    // Act
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });

    // Assert: submitting flips the form to streaming synchronously; fetch itself is async.
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    // Act
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    stream.close();
  });

  it('keeps a prompt typed before hydration and lets the user submit it', async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    const stream = controlledResponse();
    const fetchMock = mockFetch(stream.response);
    const container = document.createElement('div');
    container.innerHTML = renderToString(<WidgetGenerator />);
    document.body.append(container);
    const field = container.querySelector('textarea') as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setValue?.call(field, prompt);
    field.dispatchEvent(new Event('input', { bubbles: true }));

    // Act
    await act(async () => {
      hydrateRoot(container, <WidgetGenerator />);
    });
    fireEvent.click(within(container).getByRole('button', { name: 'Generate' }));

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ prompt });
    stream.close();
    container.remove();
  });
});
