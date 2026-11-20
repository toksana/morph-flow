import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const ANY_ORIGIN = '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ANY_ORIGIN,
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** One request to the mocked endpoint; the test decides when each chunk reaches the browser. */
export interface MockStream {
  /** The parsed JSON body the app sent. */
  body: unknown;
  /** Writes a chunk now, like the model producing more of the widget. */
  push: (text: string) => void;
  end: () => void;
  /** True once the browser dropped the connection (Stop, New, navigation). */
  isClosedByClient: () => boolean;
}

export interface MockStreamServer {
  url: string;
  /** Resolves with the next request the app makes; its response stays open until `end`. */
  nextStream: () => Promise<MockStream>;
  close: () => Promise<void>;
}

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const openStream = async (
  request: IncomingMessage,
  response: ServerResponse,
): Promise<MockStream> => {
  const body = await readBody(request);
  let closedByClient = false;
  response.on('close', () => {
    closedByClient = !response.writableEnded;
  });
  response.writeHead(HTTP_OK, { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
  response.flushHeaders();
  return {
    body,
    push: (text) => response.write(text),
    end: () => response.end(),
    isClosedByClient: () => closedByClient,
  };
};

const listen = async (server: Server): Promise<string> => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
};

/**
 * A stand-in for `/api/generate` that streams exactly what the test pushes. The browser is pointed
 * at it with `page.route(...).continue({ url })`, since `route.fulfill` cannot send a body in pieces.
 */
export const startMockStreamServer = async (): Promise<MockStreamServer> => {
  const waiting: Array<(stream: MockStream) => void> = [];
  const opened: MockStream[] = [];

  const server = createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(HTTP_NO_CONTENT, CORS_HEADERS).end();
      return;
    }
    const stream = await openStream(request, response);
    const resolveNext = waiting.shift();
    if (resolveNext) resolveNext(stream);
    else opened.push(stream);
  });
  const url = await listen(server);

  return {
    url,
    nextStream: async () => {
      const ready = opened.shift();
      if (ready) return ready;
      return new Promise<MockStream>((resolve) => waiting.push(resolve));
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
};
