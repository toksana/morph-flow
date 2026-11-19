import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildTaskList, buildTasks } from '@/core/test/factories/taskList.factory';
import { TASK_LIST_ENDPOINT } from '@/hooks/useTaskListStream';

import { TaskListGenerator } from './TaskListGenerator';

// Not UTC and not the machine's zone, so a hard-coded or server-side zone cannot pass.
const USER_TIME_ZONE = 'Pacific/Kiritimati';

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

const mockFetch = (response: Response) => {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const typePrompt = (prompt: string) => {
  fireEvent.change(screen.getByLabelText('What do you want to get done?'), {
    target: { value: prompt },
  });
};

const clickGenerate = () => fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

describe('TaskListGenerator', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the prompt with the user's time zone to the task list endpoint", async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    const stream = controlledResponse();
    const fetchMock = mockFetch(stream.response);
    render(<TaskListGenerator />);

    // Act
    typePrompt(prompt);
    clickGenerate();

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(TASK_LIST_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ prompt, timeZone: USER_TIME_ZONE });
    stream.close();
  });

  it('renders tasks as they stream in and returns to Generate when done', async () => {
    // Arrange
    const taskList = buildTaskList({ tasks: buildTasks(3) });
    const json = JSON.stringify(taskList);
    const secondTaskStart = json.indexOf(JSON.stringify(taskList.tasks[1]));
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<TaskListGenerator />);
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

  it('shows a busy card before the first chunk and stops on demand', async () => {
    // Arrange
    const stream = controlledResponse();
    mockFetch(stream.response);
    render(<TaskListGenerator />);
    typePrompt(faker.lorem.sentence());

    // Act
    clickGenerate();

    // Assert
    expect(await screen.findByText('Generating tasks…')).toBeInTheDocument();
    expect(screen.getByText('Generating tasks…').closest('[data-slot=card]')).toHaveAttribute(
      'aria-busy',
      'true',
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    // Assert
    expect(await screen.findByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('shows a generic error and no card when the request fails', async () => {
    // Arrange
    mockFetch(new Response('upstream detail that must not leak', { status: HTTP_SERVER_ERROR }));
    render(<TaskListGenerator />);
    typePrompt(faker.lorem.sentence());

    // Act
    clickGenerate();

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
    expect(screen.queryByText(/upstream detail/)).toBeNull();
    expect(screen.queryByText('No tasks yet')).toBeNull();
  });

  it.each([[''], ['   \n']])('keeps Generate disabled for prompt %j', (prompt) => {
    // Arrange
    const fetchMock = mockFetch(controlledResponse().response);
    render(<TaskListGenerator />);

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
    render(<TaskListGenerator />);
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
    container.innerHTML = renderToString(<TaskListGenerator />);
    document.body.append(container);
    const field = container.querySelector('textarea') as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setValue?.call(field, prompt);
    field.dispatchEvent(new Event('input', { bubbles: true }));

    // Act
    await act(async () => {
      hydrateRoot(container, <TaskListGenerator />);
    });
    fireEvent.click(within(container).getByRole('button', { name: 'Generate' }));

    // Assert
    expect(field.value).toBe(prompt);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ prompt });
    stream.close();
    container.remove();
  });
});
