import { afterEach, expect, it, vi } from 'vitest';
import { createNuxtHandlerMocks } from '@test-mocks/nuxt-handler';

function setupTitleSearch(body: object) {
  const mocks = createNuxtHandlerMocks();
  mocks.install();
  vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body));

  async function run() {
    const { default: handler } = await import('@server/api/search/title.post');
    return handler({ node: { res: {} } } as never);
  }

  return { ...mocks, run };
}

afterEach(() => vi.unstubAllGlobals());

it.each([
  {
    id: 'TMDB-INT-031',
    body: { title: 'The Matrix', mediaType: 'movie', year: 1999 },
    path: 'movie',
    query: { query: 'The Matrix', primary_release_year: '1999' },
    hit: { id: 603, title: 'The Matrix', release_date: '1999-03-31' },
    card: { id: 603, mediaType: 'movie', title: 'The Matrix', releaseDate: '1999-03-31' },
  },
  {
    id: 'TMDB-INT-032',
    body: { title: 'Breaking Bad', mediaType: 'tv', year: 2008 },
    path: 'tv',
    query: { query: 'Breaking Bad', first_air_date_year: '2008' },
    hit: { id: 1396, name: 'Breaking Bad', first_air_date: '2008-01-20' },
    card: { id: 1396, mediaType: 'tv', name: 'Breaking Bad', firstAirDate: '2008-01-20' },
  },
])('$id: sends the year filter to TMDB search/$path and maps the response', async ({ body, path, query, hit, card }) => {
  // Branch coverage: selects the typed endpoint and its corresponding year parameter.
  const { fetchMock, run } = setupTitleSearch(body);
  fetchMock.mockResolvedValue({ page: 1, total_pages: 2, total_results: 21, results: [hit] });

  await expect(run()).resolves.toEqual({ page: 1, totalPages: 2, totalResults: 21, results: [card] });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    `https://api.themoviedb.org/3/search/${path}`,
    expect.objectContaining({ query, redirect: 'error' }),
  );
});

it('TMDB-INT-033: omits the year parameter for a typed search without a year', async () => {
  // Branch coverage: sends only the title query when no year is present.
  const { fetchMock, run } = setupTitleSearch({ title: 'The Matrix', mediaType: 'movie' });
  fetchMock.mockResolvedValue({ page: 1, total_pages: 0, total_results: 0, results: [] });

  await expect(run()).resolves.toEqual({ page: 1, totalPages: 0, totalResults: 0, results: [] });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    'https://api.themoviedb.org/3/search/movie',
    expect.objectContaining({ query: { query: 'The Matrix' }, redirect: 'error' }),
  );
});

it('TMDB-INT-034: rejects a year without a concrete media type', async () => {
  // Branch coverage: rejects an unsupported filter combination without calling TMDB.
  const { fetchMock, run } = setupTitleSearch({ title: 'The Matrix', year: 1999 });
  await expect(run()).rejects.toMatchObject({ statusCode: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});
