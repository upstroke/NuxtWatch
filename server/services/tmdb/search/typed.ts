import { z } from 'zod';
import type { TmdbHttpClient } from '../http';
import { mapMultiToTitleCards } from './map-multi-to-title-cards';

const TypedResponseSchema = z.object({
  page: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  results: z.array(z.object({}).passthrough()),
});

export async function searchTypedByTitle(
  http: Pick<TmdbHttpClient, 'get'>,
  title: string,
  mediaType: 'movie' | 'tv',
  year?: number,
) {
  const path = mediaType === 'movie' ? '/search/movie' : '/search/tv';
  const yearParameter = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
  const query = { query: title, ...(year === undefined ? {} : { [yearParameter]: String(year) }) };
  const response = TypedResponseSchema.parse(await http.get(path, query));

  return mapMultiToTitleCards({
    ...response,
    results: response.results.map((item) => ({ ...item, media_type: mediaType })),
  });
}
