import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readBody, setResponseHeader } from 'h3';
import { createNuxtHandlerMocks } from '@test-mocks/nuxt-handler';

vi.mock(import('h3'), async (importOriginal) => ({
  ...(await importOriginal()),
  readBody: vi.fn(),
  setResponseHeader: vi.fn(),
}));

const mocks = createNuxtHandlerMocks();
const readBodyMock = vi.mocked(readBody);
const event = { node: { res: {} } } as never;

beforeEach(() => {
  mocks.fetchMock.mockReset();
  readBodyMock.mockReset();
  mocks.install();
  vi.stubGlobal('readBody', readBodyMock);
  vi.stubGlobal('setResponseHeader', setResponseHeader);
});

afterEach(() => vi.unstubAllGlobals());

async function runTitleHandler() {
  const { default: handler } = await import('@server/api/search/title.post');
  return handler(event);
}

it('TMDB-INT-021: sends the normalized title and returns only movie and TV cards', async () => {
  readBodyMock.mockResolvedValue({ title: ' The Matrix ' });
  mocks.fetchMock.mockResolvedValue({
    page: 1,
    total_pages: 2,
    total_results: 21,
    results: [
      { id: 1, media_type: 'movie', title: 'The Matrix', release_date: '1999-03-31' },
      { id: 2, media_type: 'person', name: 'Synthetic Person' },
      { id: 3, media_type: 'tv', name: 'Synthetic Series', first_air_date: '2000-01-01' },
    ],
  });

  const result = await runTitleHandler();

  expect(mocks.fetchMock).toHaveBeenCalledExactlyOnceWith(
    'https://api.themoviedb.org/3/search/multi',
    expect.objectContaining({ query: { query: 'The Matrix' }, redirect: 'error' }),
  );
  expect(result).toEqual({
    page: 1,
    totalPages: 2,
    totalResults: 21,
    results: [
      { id: 1, mediaType: 'movie', title: 'The Matrix', releaseDate: '1999-03-31' },
      { id: 3, mediaType: 'tv', name: 'Synthetic Series', firstAirDate: '2000-01-01' },
    ],
  });
});

it.each([
  { id: 'TMDB-INT-022', label: 'a missing title', body: {} },
  { id: 'TMDB-INT-023', label: 'a blank title', body: { title: '   ' } },
  { id: 'TMDB-INT-024', label: 'a non-string title', body: { title: 42 } },
  {
    id: 'TMDB-INT-025',
    label: 'extra TMDb parameters',
    body: { title: 'The Matrix', query: 'other' },
  },
  {
    id: 'TMDB-INT-026',
    label: 'raw model output',
    body: {
      status: 'ready',
      changes: [{ field: 'title', operation: 'set', value: 'The Matrix' }],
    },
  },
])('$id: rejects $label before calling TMDb', async ({ body }) => {
  readBodyMock.mockResolvedValue(body);
  await expect(runTitleHandler()).rejects.toMatchObject({ statusCode: 400 });
  expect(mocks.fetchMock).not.toHaveBeenCalled();
});
