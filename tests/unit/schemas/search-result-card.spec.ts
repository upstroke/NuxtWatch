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

  // Statement coverage: accepts a TV card with a date and a rating at the upper bound.
  it('accepts a TV card with a date and a rating of 10', () => {
    const tvCard = { ...card, mediaType: 'tv', date: '2024-06-01', rating: 10 };

    expect(SearchResultCardSchema.parse(tvCard)).toEqual(tvCard);
  });

  // Branch coverage: rejects invalid identifiers, display fields and ratings.
  it.each([
    { label: 'a non-positive ID', input: { id: 0 } },
    { label: 'an unsupported media type', input: { mediaType: 'person' } },
    { label: 'a whitespace-only title', input: { title: '   ' } },
    { label: 'an empty backdrop path', input: { backdropPath: '' } },
    { label: 'a non-ISO date', input: { date: '01.06.2024' } },
    { label: 'a fractional genre ID', input: { genreIds: [1.5] } },
    { label: 'a rating above 10', input: { rating: 10.1 } },
  ])('rejects $label', ({ input }) => {
    expect(SearchResultCardSchema.safeParse({ ...card, ...input }).success).toBe(false);
  });
});
