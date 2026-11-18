import { z } from 'zod';
import { TmdbPagedResponseSchema } from '@lib/schemas/tmdb';

const MultiResponseSchema = z.object({
  page: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
  results: z.array(z.object({ media_type: z.string() }).passthrough()),
});

export function mapMultiToTitleCards(response: unknown) {
  const raw = MultiResponseSchema.parse(response);
  return TmdbPagedResponseSchema.parse({
    page: raw.page,
    totalPages: raw.total_pages,
    totalResults: raw.total_results,
    results: raw.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        id: item.id,
        mediaType: item.media_type,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        voteAverage: item.vote_average,
        ...(item.media_type === 'movie'
          ? { title: item.title, releaseDate: item.release_date }
          : { name: item.name, firstAirDate: item.first_air_date }),
      })),
  });
}
