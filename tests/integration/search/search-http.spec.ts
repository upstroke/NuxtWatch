/** Exercises the real search handler and sessions over an isolated H3 HTTP server. */
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import {
  createApp,
  createError,
  defineEventHandler,
  readBody,
  setResponseHeader,
  toNodeListener,
} from 'h3';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchResponseSchema } from '@lib/schemas/search';
import type {
  MediaTypeQuestion,
  SearchClarifyRequest,
  SearchExecuteRequest,
  SearchProposal,
} from '@lib/schemas/search';

const model = vi.hoisted(() => ({
  generate: vi.fn<(...args: unknown[]) => Promise<{ text: string }>>(),
}));
vi.mock('ai', () => ({ generateText: model.generate }));
const upstream = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const runtime = vi.fn<() => unknown>();
let server: Server | undefined;
let origin: string;

function installGlobals() {
  vi.stubGlobal('defineEventHandler', defineEventHandler);
  vi.stubGlobal('createError', createError);
  vi.stubGlobal('readBody', readBody);
  vi.stubGlobal('setResponseHeader', setResponseHeader);
  vi.stubGlobal('useRuntimeConfig', runtime);
  vi.stubGlobal('$fetch', upstream);
}

/** Maintains only this client's cookie; never reads or modifies the session store. */
function client(initialCookie = '') {
  let cookie = initialCookie;
  return {
    get cookie() {
      return cookie;
    },
    async post(body: unknown) {
      const response = await fetch(`${origin}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify(body),
      });
      const received = response.headers.get('set-cookie');
      if (received) cookie = received.split(';', 1)[0] ?? '';
      return response;
    },
  };
}

async function success(response: Response) {
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('content-type')).toContain('application/json');
  return searchResponseSchema.parse(await response.json());
}

async function failure(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('content-type')).toContain('application/json');
  const body: unknown = await response.json();
  expect(body).toMatchObject({ statusCode: status, statusMessage: expect.any(String) });
  expect(JSON.stringify(body)).not.toContain('http-test-token');
  expect(JSON.stringify(body)).not.toContain('Bearer ');
}

function propose(proposal: SearchProposal) {
  model.generate.mockResolvedValueOnce({ text: JSON.stringify(proposal) });
}

async function openQuestion(c: ReturnType<typeof client>) {
  propose({
    status: 'ready',
    changes: [
      { field: 'title', operation: 'set', value: 'Synthetic Film' },
      { field: 'year', operation: 'set', value: 2021 },
    ],
  });
  const result = await success(await c.post({ action: 'submit', userText: 'Synthetic Film 2021' }));
  if (result.status !== 'not_executed' || result.question?.kind !== 'select_media_type') {
    throw new Error('Expected a bound media question');
  }
  return result.question;
}

function selection(question: MediaTypeQuestion): SearchClarifyRequest {
  return {
    action: 'clarify',
    requestId: question.requestId,
    revision: question.revision,
    questionId: question.questionId,
    answer: { type: 'selection', value: 'movie' },
  };
}

function execution(
  binding: Pick<SearchExecuteRequest, 'requestId' | 'revision'>,
): SearchExecuteRequest {
  return { action: 'execute', requestId: binding.requestId, revision: binding.revision };
}

beforeAll(async () => {
  installGlobals();
  const { default: handler } = await import('@server/api/search/index.post');
  const app = createApp({ debug: false });
  app.use('/api/search', handler);
  const instance = createServer(toNodeListener(app));
  server = instance;
  await new Promise<void>((resolve, reject) => {
    instance.once('error', reject);
    instance.listen(0, '127.0.0.1', () => {
      instance.off('error', reject);
      resolve();
    });
  });
  const address = instance.address();
  if (!address || typeof address === 'string') throw new Error('Missing HTTP test address');
  origin = `http://127.0.0.1:${address.port}`;
}, 10000);

beforeEach(() => {
  model.generate.mockReset();
  upstream.mockReset().mockResolvedValue({ results: [], total_results: 0 });
  runtime.mockReset().mockReturnValue({
    tmdb: { apiReadAccessToken: 'http-test-token', baseUrl: 'https://api.themoviedb.org/3' },
    llm: { provider: 'test', baseUrl: 'http://127.0.0.1:9/v1', model: 'test' },
  });
  installGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});
afterAll(async () => {
  const instance = server;
  try {
    if (instance)
      await new Promise<void>((resolve, reject) => {
        instance.close((error) => {
          if (error) reject(error);
          else resolve();
        });
        instance.closeAllConnections();
      });
  } finally {
    vi.unstubAllGlobals();
  }
});

describe('Search HTTP and session boundary', () => {
  // Branch coverage: invalid intent is rejected before session creation or configuration access.
  it.each([
    { label: 'unknown action', body: { action: 'unknown' } },
    { label: 'blank submit', body: { action: 'submit', userText: ' ' } },
    { label: 'missing execute binding', body: { action: 'execute' } },
    {
      label: 'missing question binding',
      body: { action: 'clarify', answer: { type: 'selection', value: 'movie' } },
    },
    {
      label: 'client-owned criteria',
      body: { action: 'submit', userText: 'Synthetic Film', criteria: { mediaType: 'movie' } },
    },
  ])('SEARCH-HTTP-001: rejects $label', async ({ body }) => {
    const c = client();
    const response = await c.post(body);
    await failure(response, 400);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(c.cookie).toBe('');
    expect(runtime).not.toHaveBeenCalled();
    expect(model.generate).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
  });

  // Statement coverage: reset initializes cookie-bound defaults without any provider configuration.
  it('SEARCH-HTTP-002: creates default criteria and the HTTP session cookie', async () => {
    runtime.mockImplementation(() => {
      throw new Error('Configuration must not be read');
    });
    const c = client();
    const response = await c.post({ action: 'reset' });
    expect(await success(response)).toEqual({ status: 'reset', criteria: { mediaType: 'all' } });
    expect(c.cookie).toMatch(/^nuxtwatch-search=[a-f0-9]{64}$/);
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/; Path=\/api\/search(?:;|$)/i);
    expect(cookie).toMatch(/; HttpOnly(?:;|$)/i);
    expect(cookie).toMatch(/; SameSite=Strict(?:;|$)/i);
    expect(cookie).not.toMatch(/; Secure(?:;|$)/i);
    expect(runtime).not.toHaveBeenCalled();
    expect(model.generate).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
  });

  // Statement coverage: real HTTP serialization preserves bound clarification and explicit execution.
  it('SEARCH-HTTP-003: clarifies without searching, executes once and maps repeats to 409', async () => {
    const c = client();
    const question = await openQuestion(c);
    const cookie = c.cookie;
    expect(upstream).not.toHaveBeenCalled();
    await failure(await c.post(execution(question)), 409);
    const clarified = await success(await c.post(selection(question)));
    if (clarified.status !== 'clarified') throw new Error('Expected clarification response');
    expect(clarified.criteria).toEqual({ title: 'Synthetic Film', mediaType: 'movie', year: 2021 });
    expect(clarified.requestId).toBe(question.requestId);
    expect(clarified.revision).toBeGreaterThan(question.revision);
    expect(clarified.question).toBeUndefined();
    expect(c.cookie).toBe(cookie);
    expect(model.generate).toHaveBeenCalledTimes(1);
    expect(upstream).not.toHaveBeenCalled();
    const body = execution(clarified);
    expect(await success(await c.post(body))).toMatchObject({
      status: 'completed',
      requestId: clarified.requestId,
      revision: clarified.revision,
      criteria: clarified.criteria,
      results: [],
      totalResults: 0,
    });
    await failure(await c.post(body), 409);
    expect(model.generate).toHaveBeenCalledTimes(1);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  // Branch coverage: independent cookie contexts cannot answer or execute each other's requests.
  it('SEARCH-HTTP-004: isolates criteria and bindings between two clients', async () => {
    const a = client();
    const b = client();
    const question = await openQuestion(a);
    expect(await success(await b.post({ action: 'reset' }))).toEqual({
      status: 'reset',
      criteria: { mediaType: 'all' },
    });
    expect(a.cookie).not.toBe(b.cookie);
    await failure(await b.post(selection(question)), 409);
    await failure(await b.post(execution(question)), 409);
    expect(await success(await a.post(selection(question)))).toMatchObject({
      status: 'clarified',
      criteria: { title: 'Synthetic Film', mediaType: 'movie', year: 2021 },
    });
    propose({ status: 'ready', changes: [] });
    expect(
      await success(await b.post({ action: 'submit', userText: 'Synthetic empty edit' })),
    ).toMatchObject({
      status: 'not_executed',
      criteria: { mediaType: 'all' },
      decision: { status: 'needs_clarification', field: 'title' },
    });
    expect(model.generate).toHaveBeenCalledTimes(2);
    expect(upstream).not.toHaveBeenCalled();
  });

  // Branch coverage: reset rotates the session; old cookies yield 410, old bindings yield 409.
  it('SEARCH-HTTP-005: resets criteria and invalidates the former session', async () => {
    const c = client();
    const question = await openQuestion(c);
    const oldCookie = c.cookie;
    expect(await success(await c.post({ action: 'reset' }))).toEqual({
      status: 'reset',
      criteria: { mediaType: 'all' },
    });
    expect(c.cookie).not.toBe(oldCookie);
    await failure(await c.post(selection(question)), 409);
    await failure(await c.post(execution(question)), 409);
    const old = client(oldCookie);
    await failure(await old.post(execution(question)), 410);
    expect(await success(await old.post({ action: 'reset' }))).toEqual({
      status: 'reset',
      criteria: { mediaType: 'all' },
    });
    expect(old.cookie).not.toBe(oldCookie);
    expect(old.cookie).not.toBe(c.cookie);
    expect(model.generate).toHaveBeenCalledTimes(1);
    expect(upstream).not.toHaveBeenCalled();
  });

  // Branch coverage: conflicting question bindings are translated to 409 without consuming the question.
  it('SEARCH-HTTP-006: rejects wrong and consumed clarification bindings', async () => {
    const c = client();
    const question = await openQuestion(c);
    const answer = selection(question);
    await failure(await c.post({ ...answer, questionId: 'wrong-question' }), 409);
    await failure(await c.post({ ...answer, revision: answer.revision + 1 }), 409);
    expect(await success(await c.post(answer))).toMatchObject({ status: 'clarified' });
    await failure(await c.post(answer), 409);
    await failure(await c.post(execution(question)), 409);
    expect(model.generate).toHaveBeenCalledTimes(1);
    expect(upstream).not.toHaveBeenCalled();
  });
});
