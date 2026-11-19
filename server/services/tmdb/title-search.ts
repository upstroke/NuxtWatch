/** Fetches TMDb title matches and maps them to search result cards. */
import { TmdbTitleSearchResponseSchema } from '@lib/schemas/tmdb-title-search';
import type { SearchResultCard } from '@lib/schemas/ui/search-result-card';
import { createTmdbError } from './errors';
import type { TmdbHttpClient } from './http';

/** Searches the first page of mixed movie and TV matches without a year filter. */
export async function searchTitles(
  http: Pick<TmdbHttpClient, 'get'>,
  title: string,
): Promise<SearchResultCard[]> {
  const raw = await http.get('/search/multi', { query: title });
  const response = TmdbTitleSearchResponseSchema.safeParse(raw);
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
