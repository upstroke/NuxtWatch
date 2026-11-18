import { describe, expect, it } from 'vitest';
import { SearchResultCardSchema } from '@lib/schemas/ui/search-result-card';

const card = {
  id: 101,
  mediaType: 'movie',
  title: 'Synthetic Film',
  backdropPath: null,
  date: null,
  genreIds: [28],
  rating: null,
};

describe('SearchResultCardSchema', () => {
  // Statement coverage: trims the title and preserves null display values.
  it('trims the title and preserves null display values', () => {
    expect(SearchResultCardSchema.parse({ ...card, title: '  Synthetic Film  ' })).toEqual(card);
  });

  // Branch coverage: rejects a title that is empty after trimming.
  it('rejects a whitespace-only title', () => {
    expect(SearchResultCardSchema.safeParse({ ...card, title: '   ' }).success).toBe(false);
  });
});
