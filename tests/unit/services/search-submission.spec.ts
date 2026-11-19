/** Exercises parser, coordination and title mapping with controlled external boundaries. */
import { describe, expect, it, vi } from 'vitest';
import { submitAndSearch } from '@server/services/search/submit';
import type { ParserInput } from '@server/services/search/parser';

const config = { provider: 'test', baseUrl: 'http://localhost:1234/v1', model: 'test' };

function setup(proposal: unknown) {
  const generate = vi.fn().mockResolvedValue(JSON.stringify(proposal));
  const http = {
    get: vi.fn().mockResolvedValue({
      results: [{ media_type: 'movie', id: 1, title: 'The Matrix', genre_ids: [] }],
    }),
  };
  return { generate, http };
}

function input(currentFilters: ParserInput['currentFilters'] = { mediaType: 'all' }): ParserInput {
  return { currentFilters, userText: 'The Matrix' };
}

describe('direct search submission', () => {
  it('applies a validated title proposal and fetches mapped results exactly once', async () => {
    const { generate, http } = setup({
      status: 'ready',
      changes: [{ field: 'title', operation: 'set', value: ' The Matrix ' }],
    });
    const request = input();
    await expect(submitAndSearch(config, request, http, generate)).resolves.toEqual({
      status: 'completed',
      criteria: { title: 'The Matrix', mediaType: 'all' },
      results: [{
        id: 1, mediaType: 'movie', title: 'The Matrix', genreIds: [],
        backdropPath: null, date: null, rating: null,
      }],
    });
    expect(http.get).toHaveBeenCalledExactlyOnceWith('/search/multi', { query: 'The Matrix' });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(request.currentFilters).toEqual({ mediaType: 'all' });
  });

  it.each(['needs_clarification', 'unsupported'] as const)(
    'does not execute when the parser reports %s',
    async (status) => {
      const proposal = { status, message: 'Please refine the request.' };
      const { generate, http } = setup(proposal);
      const request = input({ title: 'Existing title', mediaType: 'all' });
      await expect(submitAndSearch(config, request, http, generate)).resolves.toEqual({
        status: 'not_executed', criteria: request.currentFilters, decision: proposal,
      });
      expect(http.get).not.toHaveBeenCalled();
    },
  );

  it('returns the coordinator clarification when a year has no specific media type', async () => {
    const { generate, http } = setup({ status: 'ready' });
    await expect(submitAndSearch(config, input({
      title: 'The Office', mediaType: 'all', year: 2005,
    }), http, generate)).resolves.toMatchObject({
      status: 'not_executed',
      criteria: { title: 'The Office', mediaType: 'all', year: 2005 },
      decision: { status: 'needs_clarification', field: 'mediaType', options: ['movie', 'tv'] },
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it.each([
    { title: 'The Matrix', mediaType: 'movie' as const },
    { title: 'The Office', mediaType: 'tv' as const, year: 2005 },
  ])('preserves unsupported criteria without executing: %j', async (criteria) => {
    const { generate, http } = setup({ status: 'ready' });
    await expect(submitAndSearch(config, input(criteria), http, generate)).resolves.toEqual({
      status: 'not_executed', criteria,
      decision: { status: 'unsupported', reason: 'unsupported_title_criteria' },
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('does not execute without a title', async () => {
    const { generate, http } = setup({ status: 'ready' });
    await expect(submitAndSearch(config, input(), http, generate)).resolves.toMatchObject({
      status: 'not_executed', decision: { status: 'unsupported', reason: 'missing_title' },
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it.each(['not json', '{"status":"ready","changes":[{"field":"year","operation":"set","value":"2005"}]}'])(
    'rejects invalid model output without a request: %s',
    async (text) => {
      const { generate, http } = setup(null);
      generate.mockResolvedValue(text);
      await expect(submitAndSearch(config, input(), http, generate)).rejects.toThrow();
      expect(http.get).not.toHaveBeenCalled();
    },
  );

  it('preserves upstream failures', async () => {
    const { generate, http } = setup({ status: 'ready' });
    const failure = new Error('upstream failure');
    http.get.mockRejectedValue(failure);
    await expect(submitAndSearch(config, input({
      title: 'The Matrix', mediaType: 'all',
    }), http, generate)).rejects.toBe(failure);
  });
});
