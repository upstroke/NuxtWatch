import { expect, it } from 'vitest';
import { refineTitleSearch } from '@lib/parser/refine-title-search';

const current = Object.freeze({ title: 'The Matrix' });
const movie = { field: 'mediaType', operation: 'set', value: 'movie' };
const year = { field: 'year', operation: 'set', value: 1999 };

// Statement coverage: applies both changes without replacing or mutating the title.
it.each([[movie, year], [year, movie]])('retains the title for a valid refinement (%#)', (first, second) => {
  expect(refineTitleSearch(current, { status: 'ready', changes: [first, second] })).toEqual({
    status: 'refined',
    criteria: { title: 'The Matrix', mediaType: 'movie', year: 1999 },
  });
  expect(current).toEqual({ title: 'The Matrix' });
});

// Branch coverage: rejects the entire proposal if any criterion or the status is unsupported.
it.each([
  { label: 'invalid year', proposal: { status: 'ready', changes: [movie, { ...year, value: '1999' }] } },
  { label: 'duplicate field', proposal: { status: 'ready', changes: [year, year] } },
  { label: 'clarification', proposal: { status: 'clarification_required', changes: [movie, year] } },
])('leaves the existing criteria unchanged for $label', ({ proposal }) => {
  expect(refineTitleSearch(current, proposal)).toEqual({ status: 'unchanged' });
  expect(current).toEqual({ title: 'The Matrix' });
});

// Branch coverage: does not apply a follow-up without an existing title.
it('rejects a refinement without a usable title', () => {
  expect(refineTitleSearch({ title: ' ' }, { status: 'ready', changes: [movie, year] })).toEqual({
    status: 'unchanged',
  });
});
