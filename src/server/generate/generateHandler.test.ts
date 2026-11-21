import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { buildTaskList } from '@/core/test/factories/taskList.factory';
import { GUEST_PROMPT_LIMIT, USER_PROMPT_LIMIT } from '@/core/constants';
import { widgetResponseSchema } from '@/core/widgets/widget.schema';
import type { CheckRateLimit } from '@/server/rateLimit/caller';

import { mockFailingModel, mockStreamingModel, splitIntoDeltas } from '../test/mockLanguageModel';
import { createGenerateHandler } from './generateHandler';
import { buildWidgetSystemPrompt, MAX_OUTPUT_TOKENS } from './streamWidget';

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

  it('caps the length of the model output', async () => {
    // Arrange
    const model = mockStreamingModel([JSON.stringify(buildRandomResponse())]);

    // Act
    const response = await createGenerateHandler({ model })(postPrompt(faker.lorem.sentence()));
    await response.text();

    // Assert
    const [call] = model.doStreamCalls;
    expect(call.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
  });

  it('cancels the model call when the client aborts the request', async () => {
    // Arrange
    const model = mockStreamingModel([JSON.stringify(buildRandomResponse())]);
    const controller = new AbortController();
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: faker.lorem.sentence(), timeZone: TIME_ZONE }),
      signal: controller.signal,
    });

    // Act
    const response = await createGenerateHandler({ model })(request);
    controller.abort();
    await response.text().catch(() => undefined);

    // Assert
    const [call] = model.doStreamCalls;
    expect(call.abortSignal?.aborted).toBe(true);
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

  describe('signed-in user', () => {
    const buildClerkUserId = (): string => `user_${faker.string.alphanumeric(24)}`;
    const streamingModel = () => mockStreamingModel([JSON.stringify(buildRandomResponse())]);

    it("saves the caller with the request's time zone", async () => {
      // Arrange
      const clerkUserId = buildClerkUserId();
      const timeZone = faker.helpers.arrayElement([
        'Asia/Tokyo',
        'America/New_York',
        'Asia/Kolkata',
      ]);
      const saveUser = vi.fn(async () => undefined);
      const handler = createGenerateHandler({
        model: streamingModel(),
        identify: async () => clerkUserId,
        saveUser,
      });

      // Act
      const response = await handler(postPrompt(faker.lorem.sentence(), timeZone));
      await response.text();

      // Assert
      expect(saveUser).toHaveBeenCalledExactlyOnceWith({ clerkUserId, timeZone });
    });

    it('does not save a guest', async () => {
      // Arrange
      const saveUser = vi.fn(async () => undefined);
      const handler = createGenerateHandler({
        model: streamingModel(),
        identify: async () => null,
        saveUser,
      });

      // Act
      const response = await handler(postPrompt(faker.lorem.sentence()));
      await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(saveUser).not.toHaveBeenCalled();
    });

    it('does not identify the caller when the request is invalid', async () => {
      // Arrange
      const identify = vi.fn(async () => buildClerkUserId());
      const handler = createGenerateHandler({ model: streamingModel(), identify });

      // Act
      const response = await handler(postJson('not json'));

      // Assert
      expect(response.status).toBe(400);
      expect(identify).not.toHaveBeenCalled();
    });

    it('still streams the widget when saving the user fails', async () => {
      // Arrange
      const message = faker.lorem.sentence();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const widget = buildRandomResponse();
      const handler = createGenerateHandler({
        model: mockStreamingModel([JSON.stringify(widget)]),
        identify: async () => buildClerkUserId(),
        saveUser: async () => {
          throw new Error(message);
        },
      });

      // Act
      const response = await handler(postPrompt(faker.lorem.sentence()));
      const text = await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(widgetResponseSchema.parse(JSON.parse(text))).toEqual(widget);
      expect(consoleError).toHaveBeenCalledWith('[generate] saving the user failed:', message);
    });
  });

  describe('prompt limit', () => {
    const promptOf = (length: number): string => faker.string.alpha({ length });
    const signedIn = async (): Promise<string> => `user_${faker.string.alphanumeric(24)}`;

    it("rejects a guest's prompt past the guest limit with 413 without calling the model", async () => {
      // Arrange
      const model = mockStreamingModel([]);
      const length = faker.number.int({ min: GUEST_PROMPT_LIMIT + 1, max: USER_PROMPT_LIMIT });

      // Act
      const response = await createGenerateHandler({ model })(postPrompt(promptOf(length)));

      // Assert
      expect(response.status).toBe(413);
      expect(await response.json()).toEqual({
        error: 'Prompt too long',
        limit: GUEST_PROMPT_LIMIT,
      });
      expect(model.doStreamCalls).toHaveLength(0);
    });

    it("accepts a guest's prompt exactly at the guest limit", async () => {
      // Arrange
      const model = mockStreamingModel([JSON.stringify(buildRandomResponse())]);

      // Act
      const response = await createGenerateHandler({ model })(
        postPrompt(promptOf(GUEST_PROMPT_LIMIT)),
      );
      await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(model.doStreamCalls).toHaveLength(1);
    });

    it("rejects a signed-in user's prompt past the user limit with 413", async () => {
      // Arrange
      const model = mockStreamingModel([]);
      const saveUser = vi.fn(async () => undefined);
      const length = faker.number.int({ min: USER_PROMPT_LIMIT + 1, max: USER_PROMPT_LIMIT * 2 });
      const handler = createGenerateHandler({ model, identify: signedIn, saveUser });

      // Act
      const response = await handler(postPrompt(promptOf(length)));

      // Assert
      expect(response.status).toBe(413);
      expect(await response.json()).toEqual({ error: 'Prompt too long', limit: USER_PROMPT_LIMIT });
      expect(model.doStreamCalls).toHaveLength(0);
      expect(saveUser).not.toHaveBeenCalled();
    });

    it('lets a signed-in user send a prompt up to the user limit', async () => {
      // Arrange
      const model = mockStreamingModel([JSON.stringify(buildRandomResponse())]);
      const length = faker.number.int({ min: GUEST_PROMPT_LIMIT + 1, max: USER_PROMPT_LIMIT });
      const handler = createGenerateHandler({ model, identify: signedIn });

      // Act
      const response = await handler(postPrompt(promptOf(length)));
      await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(model.doStreamCalls).toHaveLength(1);
    });
  });

  describe('rate limit', () => {
    const buildClerkUserId = (): string => `user_${faker.string.alphanumeric(24)}`;
    const streamingModel = () => mockStreamingModel([JSON.stringify(buildRandomResponse())]);
    const allow = () =>
      vi.fn<CheckRateLimit>(async () => ({ success: true, limit: 10, reset: Date.now() }));
    const postFrom = (ip: string, prompt = faker.lorem.sentence()): Request =>
      new Request(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ prompt, timeZone: TIME_ZONE }),
      });

    it('checks the caller by account and IP before streaming', async () => {
      // Arrange
      const clerkUserId = buildClerkUserId();
      const ip = faker.internet.ipv4();
      const checkRateLimit = allow();
      const handler = createGenerateHandler({
        model: streamingModel(),
        identify: async () => clerkUserId,
        checkRateLimit,
      });

      // Act
      const response = await handler(postFrom(ip));
      await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(checkRateLimit).toHaveBeenCalledExactlyOnceWith({ clerkUserId, ip });
    });

    it('answers 429 with the reset time when the allowance is used up', async () => {
      // Arrange
      const now = faker.date.recent();
      const waitSeconds = faker.number.int({ min: 1, max: 3600 });
      const reset = now.getTime() + waitSeconds * 1000;
      const limit = faker.number.int({ min: 1, max: 50 });
      const model = mockStreamingModel([]);
      const saveUser = vi.fn(async () => undefined);
      const handler = createGenerateHandler({
        model,
        now: () => now,
        identify: async () => buildClerkUserId(),
        saveUser,
        checkRateLimit: async () => ({ success: false, limit, reset }),
      });

      // Act
      const response = await handler(postFrom(faker.internet.ipv4()));

      // Assert
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe(String(waitSeconds));
      expect(await response.json()).toEqual({ error: 'Too many requests', limit, reset });
      expect(model.doStreamCalls).toHaveLength(0);
      expect(saveUser).not.toHaveBeenCalled();
    });

    it('does not count rejected requests against the allowance', async () => {
      // Arrange
      const checkRateLimit = allow();
      const handler = createGenerateHandler({ model: streamingModel(), checkRateLimit });
      const tooLong = faker.string.alpha({ length: GUEST_PROMPT_LIMIT + 1 });

      // Act
      const invalid = await handler(postJson('not json'));
      const overLimit = await handler(postFrom(faker.internet.ipv4(), tooLong));

      // Assert
      expect(invalid.status).toBe(400);
      expect(overLimit.status).toBe(413);
      expect(checkRateLimit).not.toHaveBeenCalled();
    });

    it('still streams the widget when the limiter fails', async () => {
      // Arrange
      const message = faker.lorem.sentence();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const widget = buildRandomResponse();
      const handler = createGenerateHandler({
        model: mockStreamingModel([JSON.stringify(widget)]),
        checkRateLimit: async () => {
          throw new Error(message);
        },
      });

      // Act
      const response = await handler(postFrom(faker.internet.ipv4()));
      const text = await response.text();

      // Assert
      expect(response.status).toBe(200);
      expect(widgetResponseSchema.parse(JSON.parse(text))).toEqual(widget);
      expect(consoleError).toHaveBeenCalledWith('[generate] rate limit check failed:', message);
    });
  });
});
