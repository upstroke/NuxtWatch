/** Tests title search requests, card mapping and counts with a controlled client. */
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

    const page = await searchTitles(http, 'Synthetic Title');
    expect(page.results).toEqual([
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

    const { results: cards } = await searchTitles(http, 'Synthetic Title');
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card).toMatchObject({ date: null, backdropPath: null, rating: null });
    }
  });

  // Branch coverage: distinguishes a valid empty response from an invalid response.
  it('returns an empty list for a valid response without matches', async () => {
    const http = { get: vi.fn().mockResolvedValue({ results: [] }) };
    const page = await searchTitles(http, 'Synthetic Title');
    expect(page.results).toEqual([]);
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

const countedMovie = {
  media_type: 'movie',
  id: 401,
  title: 'Counted Film',
  genre_ids: [],
};
const countedCard = {
  id: 401,
  mediaType: 'movie',
  title: 'Counted Film',
  backdropPath: null,
  date: null,
  genreIds: [],
  rating: null,
};
const mixedCountResults = [countedMovie, { media_type: 'person' }];

describe('TMDb single-media requests and totals', () => {
  // Branch coverage: maps each explicit scope and optional year without a person-count call.
  it.each([
    { options: { mediaType: 'movie' }, path: '/search/movie', yearQuery: {} },
    {
      options: { mediaType: 'movie', year: 2021 },
      path: '/search/movie',
      yearQuery: { primary_release_year: '2021' },
    },
    { options: { mediaType: 'tv' }, path: '/search/tv', yearQuery: {} },
    {
      options: { mediaType: 'tv', year: 2017 },
      path: '/search/tv',
      yearQuery: { first_air_date_year: '2017' },
    },
  ] satisfies {
    options: NonNullable<Parameters<typeof searchTitles>[2]>;
    path: string;
    yearQuery: Record<string, string>;
  }[])(
    'requests $path with $yearQuery and uses its direct total',
    async ({ options, path, yearQuery }) => {
      const result =
        options.mediaType === 'movie'
          ? { id: 501, title: 'Synthetic Title', genre_ids: [] }
          : { id: 501, name: 'Synthetic Title', genre_ids: [] };
      const http = { get: vi.fn().mockResolvedValue({ results: [result], total_results: 42 }) };

      const page = await searchTitles(http, 'Synthetic Title', options);

      expect(http.get).toHaveBeenCalledExactlyOnceWith(path, {
        query: 'Synthetic Title',
        include_adult: 'true',
        ...yearQuery,
      });
      expect(page).toEqual({
        results: [
          {
            id: 501,
            mediaType: options.mediaType,
            title: 'Synthetic Title',
            backdropPath: null,
            date: null,
            genreIds: [],
            rating: null,
          },
        ],
        totalResults: 42,
      });
    },
  );
});

describe('TMDb multi title totals', () => {
  // Statement coverage: subtracts the separate person total with matching request parameters.
  it('returns title cards and the plausible total without mutating either response', async () => {
    const raw = { results: mixedCountResults, total_results: 10 };
    const people = { total_results: 3 };
    const before = structuredClone({ raw, people });
    const http = { get: vi.fn().mockResolvedValueOnce(raw).mockResolvedValueOnce(people) };

    await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual({
      results: [countedCard],
      totalResults: 7,
    });
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get).toHaveBeenNthCalledWith(1, '/search/multi', {
      query: 'Synthetic Title',
      include_adult: 'true',
    });
    expect(http.get).toHaveBeenNthCalledWith(2, '/search/person', {
      query: 'Synthetic Title',
      include_adult: 'true',
    });
    expect({ raw, people }).toEqual(before);
  });

  // Branch coverage: keeps valid cards when primary count metadata is absent or unusable.
  it.each([
    { label: 'missing', metadata: {} },
    { label: 'wrong type', metadata: { total_results: '10' } },
    { label: 'negative', metadata: { total_results: -1 } },
    { label: 'smaller than the raw page', metadata: { total_results: 1 } },
  ])(
    'uses an unknown total for $label primary count without a person request',
    async ({ metadata }) => {
      const http = { get: vi.fn().mockResolvedValue({ results: mixedCountResults, ...metadata }) };

      await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual({
        results: [countedCard],
        totalResults: null,
      });
      expect(http.get).toHaveBeenCalledExactlyOnceWith('/search/multi', {
        query: 'Synthetic Title',
        include_adult: 'true',
      });
    },
  );

  // Branch coverage: refuses invalid person metadata and implausible title-count differences.
  it.each([
    { label: 'missing count', response: {} },
    { label: 'wrong count type', response: { total_results: '3' } },
    { label: 'fewer people than visible', response: { total_results: 0 } },
    { label: 'fewer titles than visible', response: { total_results: 10 } },
    { label: 'negative difference', response: { total_results: 11 } },
  ])('preserves cards with an unknown total for $label', async ({ response }) => {
    const http = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ results: mixedCountResults, total_results: 10 })
        .mockResolvedValueOnce(response),
    };

    await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual({
      results: [countedCard],
      totalResults: null,
    });
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  // Branch coverage: isolates person-count transport errors from a successful primary search.
  it('keeps valid title cards when the person-count request fails without retrying', async () => {
    const http = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ results: mixedCountResults, total_results: 10 })
        .mockRejectedValueOnce(createTmdbError('UPSTREAM_FAILED')),
    };

    await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual({
      results: [countedCard],
      totalResults: null,
    });
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  // Branch coverage: distinguishes an empty first page, a known zero and an unavailable total.
  it.each([
    { total: 0, people: 0, expected: 0 },
    { total: 10, people: 3, expected: 7 },
  ])(
    'keeps the computed total $expected for an empty first page',
    async ({ total, people, expected }) => {
      const http = {
        get: vi
          .fn()
          .mockResolvedValueOnce({ results: [], total_results: total })
          .mockResolvedValueOnce({ total_results: people }),
      };

      await expect(searchTitles(http, 'Synthetic Title')).resolves.toEqual({
        results: [],
        totalResults: expected,
      });
      expect(http.get).toHaveBeenCalledTimes(2);
    },
  );
});
