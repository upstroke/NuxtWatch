/** Fetches the first title page and its available movie/TV total. */
import type { SearchCriteria } from '@lib/schemas/search';
import {
  TmdbMovieSearchResponseSchema,
  TmdbSearchCountSchema,
  TmdbTitleSearchResponseSchema,
  TmdbTvSearchResponseSchema,
} from '@lib/schemas/tmdb-title-search';
import type { SearchResultCard } from '@lib/schemas/ui/search-result-card';
import { createTmdbError } from './errors';
import type { TmdbHttpClient } from './http';

/**
 * Returns a page object with cards and an available movie/TV total.
 * Multi totals subtract a separate person count (empirically checked, not an API guarantee).
 * Count failures must never discard otherwise valid title cards.
 */
export async function searchTitles(
  http: Pick<TmdbHttpClient, 'get'>,
  title: string,
  options?: {
    mediaType: Exclude<SearchCriteria['mediaType'], 'all'>;
    year?: SearchCriteria['year'];
  },
): Promise<{ results: SearchResultCard[]; totalResults: number | null }> {
  const query: Record<string, string> = { query: title, include_adult: 'true' };
  let path = '/search/multi';

  if (options?.mediaType === 'movie') {
    path = '/search/movie';
    if (options.year !== undefined) query.primary_release_year = String(options.year);
  } else if (options?.mediaType === 'tv') {
    path = '/search/tv';
    if (options.year !== undefined) query.first_air_date_year = String(options.year);
  }

  const raw = await http.get(path, query);
  const response =
    options?.mediaType === 'movie'
      ? TmdbMovieSearchResponseSchema.safeParse(raw)
      : options?.mediaType === 'tv'
        ? TmdbTvSearchResponseSchema.safeParse(raw)
        : TmdbTitleSearchResponseSchema.safeParse(raw);
  if (!response.success) throw createTmdbError('INVALID_RESPONSE');

  const cards: SearchResultCard[] = [];
  let peopleOnPage = 0;
  for (const result of response.data.results) {
    if (result.media_type === 'person') {
      peopleOnPage += 1;
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

  const providerCount = TmdbSearchCountSchema.safeParse(raw);
  let totalResults: number | null =
    providerCount.success && providerCount.data.total_results >= response.data.results.length
      ? providerCount.data.total_results
      : null;

  if (path === '/search/multi' && totalResults !== null) {
    try {
      // The same query and adult setting; both calls use the default first page/language.
      const personCount = TmdbSearchCountSchema.safeParse(await http.get('/search/person', { ...query }));
      if (!personCount.success) {
        totalResults = null;
      } else {
        const people = personCount.data.total_results;
        const titles = totalResults - people;
        totalResults = people >= peopleOnPage && titles >= cards.length ? titles : null;
      }
    } catch {
      totalResults = null;
    }
  }

  return { results: cards, totalResults };
}
