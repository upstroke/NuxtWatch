/** Tests real search coordination with controlled model and TMDb boundaries. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clarifySearch, clarifySearchText, executeSearch, submitForSession } from '@server/services/search/flow';
import type { SearchState } from '@server/services/search/flow';
import type { SearchClarifyRequest, SearchCriteria, SearchProposal } from '@lib/schemas/search';

const model = vi.hoisted(() => ({
  generate: vi.fn<(...args: unknown[]) => Promise<{ text: string }>>(),
}));
vi.mock('ai', () => ({ generateText: model.generate }));

const config = { provider: 'test', baseUrl: 'http://localhost:1234/v1', model: 'test' };

/** Creates independent application state and an injected provider transport. */
function setup(criteria: SearchCriteria = { mediaType: 'all' }) {
  const state: SearchState = { criteria };
  const http = { get: vi.fn<Parameters<typeof executeSearch>[2]['get']>()
    .mockResolvedValue({ results: [], total_results: 0 }) };
  let sequence = 0;
  let active = true;
  const isCurrent = () => active;
  const createId = () => `question-${++sequence}`;
  return {
    state, http, isCurrent, createId,
    invalidate() { active = false; },
    submit(proposal: SearchProposal) {
      model.generate.mockResolvedValueOnce({ text: JSON.stringify(proposal) });
      return submitForSession(state, `request-${++sequence}`, 'Synthetic request',
        config, http, isCurrent, createId);
    },
  };
}

/** Opens the application-owned media question without reserving a search. */
async function openMediaQuestion(h: ReturnType<typeof setup>) {
  const result = await h.submit({ status: 'ready', changes: [
    { field: 'title', operation: 'set', value: 'Synthetic Film' },
    { field: 'year', operation: 'set', value: 2021 },
  ] });
  if (!('question' in result) || result.question?.kind !== 'select_media_type') {
    throw new Error('Expected a bound media selection');
  }
  const question = result.question;
  const answer = {
    action: 'clarify', requestId: question.requestId, revision: question.revision,
    questionId: question.questionId, answer: { type: 'selection', value: 'movie' },
  } satisfies SearchClarifyRequest;
  return { result, question, answer };
}

/** Prepares an executable request through the public clarification transition. */
async function prepare(h: ReturnType<typeof setup>) {
  const opened = await openMediaQuestion(h);
  const result = clarifySearch(h.state, opened.answer, h.isCurrent);
  if (result.status !== 'clarified') throw new Error('Expected successful clarification');
  return { action: 'execute', requestId: result.requestId, revision: result.revision } satisfies Parameters<typeof executeSearch>[1];
}

beforeEach(() => { model.generate.mockReset(); });

describe('Shared search criteria and decisions', () => {
  // Branch coverage: executable scopes start directly through the shared real matrix.
  it.each(['all', 'movie', 'tv'] satisfies SearchCriteria['mediaType'][])(
    'executes a title-only submit with scope %s', async (mediaType) => {
      const h = setup({ mediaType });
      const result = await h.submit({ status: 'ready', changes: [
        { field: 'title', operation: 'set', value: 'Synthetic Film' },
      ] });
      expect(result).toMatchObject({ status: 'completed',
        criteria: { title: 'Synthetic Film', mediaType }, results: [], totalResults: 0 });
      expect(model.generate).toHaveBeenCalledTimes(1);
      expect(h.http.get).toHaveBeenCalled();
    },
  );

  // Branch coverage: a missing title requires clarification rather than a provider request.
  it('asks for a missing title without searching', async () => {
    const h = setup();
    const result = await h.submit({ status: 'ready', changes: [] });
    expect(result).toMatchObject({ status: 'not_executed',
      decision: { status: 'needs_clarification', field: 'title' },
      question: { kind: 'free_text', source: 'application', message: expect.any(String) } });
    expect(h.http.get).not.toHaveBeenCalled();
  });

  // Statement coverage: requested title/year changes preserve the confirmed media restriction.
  it('preserves unedited scope and does not mutate the previous criteria object', async () => {
    const original: SearchCriteria = { title: 'Original Film', mediaType: 'movie', year: 2021 };
    const before = structuredClone(original);
    const h = setup(original);
    const result = await h.submit({ status: 'ready', changes: [
      { field: 'title', operation: 'set', value: 'Replacement Film' },
      { field: 'year', operation: 'set', value: 2017 },
    ] });
    expect(result).toMatchObject({ status: 'completed',
      criteria: { title: 'Replacement Film', mediaType: 'movie', year: 2017 } });
    expect(original).toEqual(before);
    expect(h.state.criteria).not.toBe(original);
  });

  // Branch coverage: an explicit null edit removes the year without resetting other criteria.
  it('removes only the requested year restriction', async () => {
    const h = setup({ title: 'Synthetic Film', mediaType: 'movie', year: 2021 });
    const result = await h.submit({ status: 'ready', changes: [
      { field: 'year', operation: 'set', value: null },
    ] });
    expect(result).toMatchObject({ status: 'completed' });
    expect(h.state.criteria).toEqual({ title: 'Synthetic Film', mediaType: 'movie' });
  });

  // Branch coverage: explicitly broadening scope keeps the year and requires media selection.
  it('asks for media when both-media scope is explicitly requested with an existing year', async () => {
    const h = setup({ title: 'Synthetic Film', mediaType: 'movie', year: 2021 });
    const result = await h.submit({ status: 'ready', changes: [
      { field: 'mediaType', operation: 'set', value: 'all' },
    ] });
    expect(result).toMatchObject({ status: 'not_executed',
      criteria: { title: 'Synthetic Film', mediaType: 'all', year: 2021 },
      question: { kind: 'select_media_type' } });
    expect(h.http.get).not.toHaveBeenCalled();
  });

  // Branch coverage: model clarification or refusal cannot silently apply a supported subset.
  it.each(['needs_clarification', 'unsupported'] satisfies ('needs_clarification' | 'unsupported')[])(
    'keeps criteria unchanged for model decision %s', async (status) => {
      const original: SearchCriteria = { title: 'Original Film', mediaType: 'movie', year: 2021 };
      const h = setup(original);
      const result = await h.submit({ status, message: 'Synthetic explanation' });
      expect(result).toMatchObject({ status: 'not_executed',
        decision: { status, message: 'Synthetic explanation' }, criteria: original });
      expect(h.state.criteria).toEqual(original);
      expect(h.http.get).not.toHaveBeenCalled();
    },
  );
});

describe('Bound clarification and execution', () => {
  // Branch coverage: selections change only scope; clarification never starts a search or LLM call.
  it.each(['movie', 'tv'] satisfies Exclude<SearchCriteria['mediaType'], 'all'>[])(
    'requires explicit execute after selecting %s', async (mediaType) => {
      const h = setup();
      const opened = await openMediaQuestion(h);
      expect(h.http.get).not.toHaveBeenCalled();
      expect(opened.question).toMatchObject({ requestId: opened.result.requestId,
        revision: opened.result.revision, message: expect.any(String), options: ['movie', 'tv'] });
      expect(await executeSearch(h.state, { action: 'execute',
        requestId: opened.question.requestId, revision: opened.question.revision },
      h.http, h.isCurrent)).toMatchObject({ status: 'rejected' });
      const clarified = clarifySearch(h.state, { ...opened.answer,
        answer: { type: 'selection', value: mediaType } }, h.isCurrent);
      if (clarified.status !== 'clarified') throw new Error('Expected successful clarification');
      expect(clarified.criteria).toEqual({ title: 'Synthetic Film', mediaType, year: 2021 });
      expect(clarified.requestId).toBe(opened.question.requestId);
      expect(clarified.revision).toBeGreaterThan(opened.question.revision);
      expect(clarified.question).toBeUndefined();
      expect(h.http.get).not.toHaveBeenCalled();
      expect(model.generate).toHaveBeenCalledTimes(1);
      expect(await executeSearch(h.state, { action: 'execute', requestId: clarified.requestId,
        revision: clarified.revision }, h.http, h.isCurrent)).toMatchObject({
        status: 'completed', criteria: clarified.criteria });
      expect(model.generate).toHaveBeenCalledTimes(1);
      expect(h.http.get).toHaveBeenCalledTimes(1);
    },
  );

  // Branch coverage: wrong and consumed question bindings leave the usable state unchanged.
  it('rejects a wrong question ID and a duplicate answer without damaging the valid transition', async () => {
    const h = setup();
    const opened = await openMediaQuestion(h);
    const before = structuredClone(h.state);
    expect(clarifySearch(h.state, { ...opened.answer, questionId: 'wrong' }, h.isCurrent))
      .toMatchObject({ status: 'rejected' });
    expect(h.state).toEqual(before);
    const clarified = clarifySearch(h.state, opened.answer, h.isCurrent);
    expect(clarified.status).toBe('clarified');
    const after = structuredClone(h.state);
    expect(clarifySearch(h.state, opened.answer, h.isCurrent)).toMatchObject({ status: 'rejected' });
    expect(h.state).toEqual(after);
    expect(model.generate).toHaveBeenCalledTimes(1);
    expect(h.http.get).not.toHaveBeenCalled();
  });

  // Statement coverage: bound free text may correct multiple criteria but still cannot search.
  it('applies a free-text media/year correction without executing', async () => {
    const h = setup();
    const opened = await openMediaQuestion(h);
    model.generate.mockResolvedValueOnce({ text: JSON.stringify({ status: 'ready', changes: [
      { field: 'mediaType', operation: 'set', value: 'movie' },
      { field: 'year', operation: 'set', value: 2019 },
    ] }) });
    const result = await clarifySearchText(h.state, { ...opened.answer,
      answer: { type: 'text', text: 'Synthetic media and year correction' } },
    config, h.isCurrent, h.createId);
    expect(result).toMatchObject({ status: 'clarified',
      criteria: { title: 'Synthetic Film', mediaType: 'movie', year: 2019 },
      decision: { status: 'ready' } });
    expect(model.generate).toHaveBeenCalledTimes(2);
    expect(h.http.get).not.toHaveBeenCalled();
  });

  // Branch coverage: a newer submit invalidates the previous execution binding.
  it('rejects an old execute after a newer submit without another provider request', async () => {
    const h = setup();
    const old = await prepare(h);
    const current = await h.submit({ status: 'ready', changes: [
      { field: 'title', operation: 'set', value: 'Replacement Film' },
    ] });
    expect(current).toMatchObject({ status: 'completed', criteria: { mediaType: 'movie' } });
    expect(h.http.get).toHaveBeenCalledTimes(1);
    expect(await executeSearch(h.state, old, h.http, h.isCurrent))
      .toMatchObject({ status: 'rejected', reason: 'stale_execution' });
    expect(h.http.get).toHaveBeenCalledTimes(1);
  });

  // Branch coverage: invalid session lifetime blocks even an otherwise matching execute.
  it('rejects execution when the owning session is no longer current', async () => {
    const h = setup();
    const body = await prepare(h);
    h.invalidate();
    expect(await executeSearch(h.state, body, h.http, h.isCurrent))
      .toMatchObject({ status: 'rejected', reason: 'stale_execution' });
    expect(h.http.get).not.toHaveBeenCalled();
  });

  // Branch coverage: reservation blocks concurrent and completed repeats of the same revision.
  it('reserves before awaiting the provider and rejects repeated execution', async () => {
    const h = setup();
    const body = await prepare(h);
    let release: ((value: unknown) => void) | undefined;
    const pending = new Promise<unknown>((resolve) => { release = resolve; });
    h.http.get.mockReturnValueOnce(pending);
    const first = executeSearch(h.state, body, h.http, h.isCurrent);
    try {
      expect(h.http.get).toHaveBeenCalledTimes(1);
      expect(await executeSearch(h.state, body, h.http, h.isCurrent))
        .toMatchObject({ status: 'rejected', reason: 'execution_already_reserved' });
      expect(h.http.get).toHaveBeenCalledTimes(1);
    } finally {
      if (!release) throw new Error('Provider response gate was not initialized');
      release({ results: [], total_results: 0 });
    }
    expect(await first).toMatchObject({ status: 'completed' });
    expect(await executeSearch(h.state, body, h.http, h.isCurrent))
      .toMatchObject({ status: 'rejected', reason: 'execution_already_reserved' });
    expect(h.http.get).toHaveBeenCalledTimes(1);
    expect(model.generate).toHaveBeenCalledTimes(1);
  });

  // Branch coverage: a failed execution allows an explicit retry without changing criteria or reparsing.
  it('does not retry a provider failure automatically but accepts an explicit retry', async () => {
    const h = setup();
    const body = await prepare(h);
    const before = structuredClone(h.state.criteria);
    const failure = new Error('Synthetic provider failure');
    h.http.get.mockRejectedValueOnce(failure);
    await expect(executeSearch(h.state, body, h.http, h.isCurrent)).rejects.toBe(failure);
    expect(h.http.get).toHaveBeenCalledTimes(1);
    expect(h.state.criteria).toEqual(before);
    expect(await executeSearch(h.state, body, h.http, h.isCurrent))
      .toMatchObject({ status: 'completed', criteria: before });
    expect(h.http.get).toHaveBeenCalledTimes(2);
    expect(model.generate).toHaveBeenCalledTimes(1);
  });
});
