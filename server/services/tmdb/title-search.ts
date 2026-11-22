/** Fetches TMDb title matches and maps mixed or single-media results to search cards. */
import type { SearchCriteria } from '@lib/schemas/search';
import {
  TmdbMovieSearchResponseSchema,
  TmdbTitleSearchResponseSchema,
  TmdbTvSearchResponseSchema,
} from '@lib/schemas/tmdb-title-search';
import type { SearchResultCard } from '@lib/schemas/ui/search-result-card';
import { createTmdbError } from './errors';
import type { TmdbHttpClient } from './http';

/** Searches the first page, applying a year only through a specific media endpoint. */
export async function searchTitles(
  http: Pick<TmdbHttpClient, 'get'>,
  title: string,
  options?: {
    mediaType: Exclude<SearchCriteria['mediaType'], 'all'>;
    year?: SearchCriteria['year'];
  },
): Promise<SearchResultCard[]> {
  const query: Record<string, string> = { query: title, include_adult: 'true' };
  let path = '/search/multi';
  const schema = TmdbTitleSearchResponseSchema;

  if (options?.mediaType === 'movie') {
    path = '/search/movie';
    if (options.year !== undefined) query.primary_release_year = String(options.year);
  } else if (options?.mediaType === 'tv') {
    path = '/search/tv';
    if (options.year !== undefined) query.first_air_date_year = String(options.year);
  }

  const raw = await http.get(path, query);
  // Normalize endpoint-specific responses into the shared validated result union.
  const response =
    options?.mediaType === 'movie'
      ? TmdbMovieSearchResponseSchema.safeParse(raw)
      : options?.mediaType === 'tv'
        ? TmdbTvSearchResponseSchema.safeParse(raw)
        : schema.safeParse(raw);
  if (!response.success) {
    throw createTmdbError('INVALID_RESPONSE');
  }

  const cards: SearchResultCard[] = [];
  for (const result of response.data.results) {
    if (result.media_type === 'person') {
      continue;
    }

    const date = result.media_type === 'movie' ? result.release_date : result.first_air_date;
    cards.push({
      id: result.id,
      mediaType: result.media_type,
      title: result.media_type === 'movie' ? result.title : result.name,
      backdropPath: result.backdrop_path ?? null,
      date: date || null,
      genreIds: result.genre_ids,
      rating: result.vote_average ?? null,
    });
  }

  return cards;
}
