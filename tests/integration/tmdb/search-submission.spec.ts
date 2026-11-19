/** Verifies direct submission with real search modules and controlled external boundaries. */
import { describe, expect, it, vi } from 'vitest';
import { submitAndSearch } from '@server/services/search/submit';

const config = { provider: 'test', baseUrl: 'http://localhost:1234/v1', model: 'test' };

function setup(proposal: unknown) {
  return {
    generate: vi.fn().mockResolvedValue(JSON.stringify(proposal)),
    http: { get: vi.fn().mockResolvedValue({ results: [] }) },
  };
}

describe('direct search submission integration', () => {
  it('SEARCH-SUBMIT-INT-001 / AC1: executes an executable proposal once and returns the result', async () => {
    const { generate, http } = setup({
      status: 'ready', changes: [{ field: 'title', operation: 'set', value: 'The Matrix' }],
    });
    await expect(submitAndSearch(config, {
      currentFilters: { mediaType: 'all' }, userText: 'The Matrix',
    }, http, generate)).resolves.toEqual({
      status: 'completed', criteria: { title: 'The Matrix', mediaType: 'all' }, results: [],
    });
    expect(http.get).toHaveBeenCalledExactlyOnceWith('/search/multi', { query: 'The Matrix' });
  });

  it('SEARCH-SUBMIT-INT-002 / AC2: preserves parser clarification without executing', async () => {
    const proposal = { status: 'needs_clarification', message: 'Specify a title.' };
    const { generate, http } = setup(proposal);
    const currentFilters = { title: 'Existing title', mediaType: 'all' as const };
    await expect(submitAndSearch(config, {
      currentFilters, userText: 'something else',
    }, http, generate)).resolves.toEqual({
      status: 'not_executed', criteria: currentFilters, decision: proposal,
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('SEARCH-SUBMIT-INT-003 / AC3: respects the application clarification for a year with all media', async () => {
    const { generate, http } = setup({ status: 'ready' });
    const currentFilters = { title: 'The Office', mediaType: 'all' as const, year: 2005 };
    await expect(submitAndSearch(config, {
      currentFilters, userText: 'search',
    }, http, generate)).resolves.toEqual({
      status: 'not_executed', criteria: currentFilters,
      decision: { status: 'needs_clarification', field: 'mediaType', options: ['movie', 'tv'] },
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('SEARCH-SUBMIT-INT-004 / AC4: refuses an unsupported media type without dropping it', async () => {
    const { generate, http } = setup({ status: 'ready' });
    const currentFilters = { title: 'The Matrix', mediaType: 'movie' as const };
    await expect(submitAndSearch(config, {
      currentFilters, userText: 'search',
    }, http, generate)).resolves.toEqual({
      status: 'not_executed', criteria: currentFilters,
      decision: { status: 'unsupported', reason: 'unsupported_title_criteria' },
    });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('SEARCH-SUBMIT-INT-005 / AC5: rejects a specific year without silently discarding it', async () => {
    const { generate, http } = setup({ status: 'ready' });
    const currentFilters = { title: 'The Office', mediaType: 'tv' as const, year: 2005 };
    await expect(submitAndSearch(config, {
      currentFilters, userText: 'search',
    }, http, generate)).resolves.toEqual({
      status: 'not_executed', criteria: currentFilters,
      decision: { status: 'unsupported', reason: 'unsupported_title_criteria' },
    });
    expect(http.get).not.toHaveBeenCalled();
  });
});
