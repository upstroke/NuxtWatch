/** Tests title search requests, card mapping and failures with a controlled client. */
import { describe, expect, it, vi } from 'vitest';
import { searchTitles } from '@server/services/tmdb/title-search';
import { createTmdbError } from '@server/services/tmdb/errors';

describe('TMDb title search', () => {
  // Statement coverage: sends the title query and maps mixed results to cards.
  it('requests mixed title matches and returns movie and TV cards without people', async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        results: [
          {
            media_type: 'movie',
            id: 101,
            title: 'Synthetic Film',
            release_date: '2001-02-03',
            backdrop_path: '/synthetic.jpg',
            genre_ids: [28],
            vote_average: 7.5,
          },
          { media_type: 'person', id: 102, name: 'Synthetic Person' },
          {
            media_type: 'tv',
            id: 103,
            name: 'Synthetic Series',
            first_air_date: '2005-04-06',
            backdrop_path: null,
            genre_ids: [],
            vote_average: 0,
          },
        ],
      }),
    };

    await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual([
      {
        id: 101,
        mediaType: 'movie',
        title: 'Synthetic Film',
        date: '2001-02-03',
        backdropPath: '/synthetic.jpg',
        genreIds: [28],
        rating: 7.5,
      },
      {
        id: 103,
        mediaType: 'tv',
        title: 'Synthetic Series',
        date: '2005-04-06',
        backdropPath: null,
        genreIds: [],
        rating: 0,
      },
    ]);
    expect(http.get).toHaveBeenCalledExactlyOnceWith('/search/multi', {
      query: 'Synthetic Title',
      include_adult: 'true',
    });
  });

  // Branch coverage: normalizes absent optional values without inventing display data.
  it('maps missing images and ratings and empty or missing dates to null', async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        results: [
          {
            media_type: 'movie',
            id: 201,
            title: 'Synthetic Film',
            genre_ids: [],
            release_date: '',
          },
          {
            media_type: 'tv',
            id: 202,
            name: 'Synthetic Series',
            genre_ids: [],
            vote_average: null,
          },
        ],
      }),
    };

    const cards = await searchTitles(http, 'Synthetic Title');
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card).toMatchObject({ date: null, backdropPath: null, rating: null });
    }
  });

  // Branch coverage: distinguishes a valid empty response from an invalid response.
  it('returns an empty list for a valid response without matches', async () => {
    const http = { get: vi.fn().mockResolvedValue({ results: [] }) };
    await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual([]);
  });

  // Branch coverage: rejects missing results or incomplete media rather than hiding them.
  it.each([
    { results: undefined },
    { results: [{ media_type: 'movie', id: 301, title: 'Synthetic Film' }] },
  ])('reports an invalid response instead of empty or partial results: %j', async (response) => {
    const http = { get: vi.fn().mockResolvedValue(response) };
    await expect(searchTitles(http, 'Synthetic Title')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  // Branch coverage: preserves transport failures instead of reclassifying them as invalid data.
  it('propagates the original transport error', async () => {
    const failure = createTmdbError('UPSTREAM_FAILED');
    const http = { get: vi.fn().mockRejectedValue(failure) };
    await expect(searchTitles(http, 'Synthetic Title')).rejects.toBe(failure);
  });
});
