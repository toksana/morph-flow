import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';

const MAX_DELTA_LENGTH = 12;

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

/** A model that streams `text` split into the given deltas, like a provider would. */
export const mockStreamingModel = (deltas: string[]): MockLanguageModelV4 =>
  new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 'text-1' },
          ...deltas.map((delta) => ({ type: 'text-delta' as const, id: 'text-1', delta })),
          { type: 'text-end', id: 'text-1' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            logprobs: undefined,
            usage: USAGE,
          },
        ],
      }),
    }),
  });

/** A model whose provider call fails before any output is produced. */
export const mockFailingModel = (error: Error): MockLanguageModelV4 =>
  new MockLanguageModelV4({
    doStream: async () => {
      throw error;
    },
  });

/** Splits text into random-length pieces to mimic token deltas. */
export const splitIntoDeltas = (text: string, pick: (max: number) => number): string[] => {
  const deltas: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    const size = Math.max(1, pick(Math.min(rest.length, MAX_DELTA_LENGTH)));
    deltas.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  return deltas;
};
