import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildTaskList } from '@/core/test/factories/taskList.factory';
import { taskListSchema } from '@/core/widgets/taskList.schema';

import { mockFailingModel, mockStreamingModel, splitIntoDeltas } from '../test/mockLanguageModel';
import { buildTaskListSystemPrompt } from './streamTaskList';
import { createTaskListHandler } from './taskListHandler';

const RANDOM_RUNS = 5;
const ENDPOINT = 'http://localhost/api/task-list';
const TIME_ZONE = 'Europe/Moscow';

const postJson = (body: string): Request =>
  new Request(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

const postPrompt = (prompt: string, timeZone = TIME_ZONE): Request =>
  postJson(JSON.stringify({ prompt, timeZone }));

const pickLength = (max: number): number => faker.number.int({ min: 1, max });

describe('createTaskListHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(Array.from({ length: RANDOM_RUNS }, (_, run) => run))(
    'streams text that parses back into the generated task list for random deltas (run %i)',
    async () => {
      // Arrange
      const taskList = buildTaskList();
      const model = mockStreamingModel(splitIntoDeltas(JSON.stringify(taskList), pickLength));
      const handler = createTaskListHandler({ model });

      // Act
      const response = await handler(postPrompt(faker.lorem.sentence()));
      const text = await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(taskListSchema.parse(JSON.parse(text))).toEqual(taskList);
    },
  );

  it("sends the trimmed prompt and a system prompt dated in the user's time zone", async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    // Still Thursday in UTC, already Friday in Moscow: the server's day would be wrong.
    const lateThursdayUtc = new Date('2026-11-19T22:30:00Z');
    const model = mockStreamingModel([JSON.stringify(buildTaskList())]);
    const handler = createTaskListHandler({ model, now: () => lateThursdayUtc });

    // Act
    const response = await handler(postPrompt(`  ${prompt}  `, 'Europe/Moscow'));
    await response.text();

    // Assert
    const [call] = model.doStreamCalls;
    expect(call.prompt).toEqual([
      { role: 'system', content: buildTaskListSystemPrompt('Friday, 2026-11-20') },
      { role: 'user', content: [{ type: 'text', text: prompt }] },
    ]);
  });

  it('asks the model for JSON that follows the TaskList schema', async () => {
    // Arrange
    const model = mockStreamingModel([JSON.stringify(buildTaskList())]);

    // Act
    const response = await createTaskListHandler({ model })(postPrompt(faker.lorem.sentence()));
    await response.text();

    // Assert
    const [{ responseFormat }] = model.doStreamCalls;
    const expectedFields = Object.keys(taskListSchema.shape);
    expect(responseFormat).toMatchObject({
      type: 'json',
      schema: {
        type: 'object',
        required: expectedFields,
        properties: Object.fromEntries(expectedFields.map((field) => [field, expect.any(Object)])),
      },
    });
  });

  it.each([
    ['malformed JSON', '{"prompt":'],
    ['a missing prompt', JSON.stringify({ timeZone: TIME_ZONE })],
    ['a blank prompt', JSON.stringify({ prompt: '   ', timeZone: TIME_ZONE })],
    ['a missing time zone', JSON.stringify({ prompt: 'Plan my day' })],
    ['an unknown time zone', JSON.stringify({ prompt: 'Plan my day', timeZone: 'Mars/Olympus' })],
  ])('rejects %s with 400 without calling the model', async (_case, body) => {
    // Arrange
    const model = mockStreamingModel([]);

    // Act
    const response = await createTaskListHandler({ model })(postJson(body));

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it('logs a provider failure instead of crashing the stream', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = createTaskListHandler({ model: mockFailingModel(new Error(message)) });

    // Act
    const response = await handler(postPrompt(faker.lorem.sentence()));
    const text = await response.text();

    // Assert
    expect(text).toBe('');
    expect(consoleError).toHaveBeenCalledWith('[task-list] stream failed:', message);
  });
});
