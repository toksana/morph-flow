import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { buildTaskList } from '@/core/test/factories/taskList.factory';
import { widgetResponseSchema } from '@/core/widgets/widget.schema';

import { mockFailingModel, mockStreamingModel, splitIntoDeltas } from '../test/mockLanguageModel';
import { createGenerateHandler } from './generateHandler';
import { buildWidgetSystemPrompt } from './streamWidget';

const RANDOM_RUNS = 5;
const ENDPOINT = 'http://localhost/api/generate';
const WIDGET_VARIANT_COUNT = 2;
const TIME_ZONE = 'Europe/Berlin';

const postJson = (body: string): Request =>
  new Request(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

const postPrompt = (prompt: string, timeZone = TIME_ZONE): Request =>
  postJson(JSON.stringify({ prompt, timeZone }));

const pickLength = (max: number): number => faker.number.int({ min: 1, max });

const buildRandomResponse = () => ({
  widget: faker.helpers.arrayElement([buildTaskList, buildHabitStreakCard])(),
});

describe('createGenerateHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(Array.from({ length: RANDOM_RUNS }, (_, run) => run))(
    'streams text that parses back into the generated widget for random deltas (run %i)',
    async () => {
      // Arrange
      const response = buildRandomResponse();
      const model = mockStreamingModel(splitIntoDeltas(JSON.stringify(response), pickLength));
      const handler = createGenerateHandler({ model });

      // Act
      const streamed = await handler(postPrompt(faker.lorem.sentence()));
      const text = await streamed.text();

      // Assert
      expect(streamed.status).toBe(200);
      expect(widgetResponseSchema.parse(JSON.parse(text))).toEqual(response);
    },
  );

  it("sends the trimmed prompt and a system prompt dated in the user's time zone", async () => {
    // Arrange
    const prompt = faker.lorem.sentence();
    // Still Thursday in UTC, already Friday in Tokyo: the server's day would be wrong.
    const lateThursdayUtc = new Date('2026-11-19T22:30:00Z');
    const model = mockStreamingModel([JSON.stringify(buildRandomResponse())]);
    const handler = createGenerateHandler({ model, now: () => lateThursdayUtc });

    // Act
    const response = await handler(postPrompt(`  ${prompt}  `, 'Asia/Tokyo'));
    await response.text();

    // Assert
    const [call] = model.doStreamCalls;
    expect(call.prompt).toEqual([
      { role: 'system', content: buildWidgetSystemPrompt('Friday, 2026-11-20') },
      { role: 'user', content: [{ type: 'text', text: prompt }] },
    ]);
  });

  it('asks the model for one widget out of every supported type', async () => {
    // Arrange
    const model = mockStreamingModel([JSON.stringify(buildRandomResponse())]);

    // Act
    const response = await createGenerateHandler({ model })(postPrompt(faker.lorem.sentence()));
    await response.text();

    // Assert
    const [{ responseFormat }] = model.doStreamCalls;
    expect(responseFormat).toMatchObject({
      type: 'json',
      schema: { type: 'object', required: ['widget'] },
    });
    // The union becomes `oneOf` or `anyOf`, depending on the schema converter.
    const schema = responseFormat?.type === 'json' ? responseFormat.schema : undefined;
    const widget = schema?.properties?.widget;
    const variants = typeof widget === 'object' ? (widget.oneOf ?? widget.anyOf) : undefined;
    expect(variants).toHaveLength(WIDGET_VARIANT_COUNT);
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
    const response = await createGenerateHandler({ model })(postJson(body));

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it('logs a provider failure instead of crashing the stream', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = createGenerateHandler({ model: mockFailingModel(new Error(message)) });

    // Act
    const response = await handler(postPrompt(faker.lorem.sentence()));
    const text = await response.text();

    // Assert
    expect(text).toBe('');
    expect(consoleError).toHaveBeenCalledWith('[generate] stream failed:', message);
  });
});
