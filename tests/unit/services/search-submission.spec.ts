/** Checks proposal application at the coordinator boundary. */
import { describe, expect, it } from 'vitest';
import { submitSearch } from '@server/services/search/coordinator';

const config = { provider: 'test', baseUrl: 'http://localhost:1234/v1', model: 'test' };

describe('search proposal application', () => {
  // Statement coverage: applies coupled edits without mutating the original criteria.
  it('applies title, media type and year edits to a copy', async () => {
    const currentFilters = { title: 'Old title', mediaType: 'all' as const };
    const result = await submitSearch(
      config,
      { currentFilters, userText: 'change criteria' },
      async () => ({
        status: 'ready',
        changes: [
          { field: 'title', operation: 'set', value: 'The Office' },
          { field: 'mediaType', operation: 'set', value: 'tv' },
          { field: 'year', operation: 'set', value: 2005 },
        ],
      }),
    );
    expect(result.criteria).toEqual({ title: 'The Office', mediaType: 'tv', year: 2005 });
    expect(currentFilters).toEqual({ title: 'Old title', mediaType: 'all' });
  });

  // Branch coverage: a null year removes the criterion rather than persisting null.
  it('removes a year without losing independent criteria', async () => {
    const currentFilters = { title: 'The Office', mediaType: 'tv' as const, year: 2005 };
    const result = await submitSearch(
      config,
      { currentFilters, userText: 'without year' },
      async () => ({
        status: 'ready',
        changes: [{ field: 'year', operation: 'set', value: null }],
      }),
    );
    expect(result.criteria).toEqual({ title: 'The Office', mediaType: 'tv' });
    expect(result.criteria).not.toHaveProperty('year');
    expect(currentFilters.year).toBe(2005);
  });
});
