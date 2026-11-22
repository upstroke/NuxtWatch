/** Validates the TMDb title search results and separately consumed count metadata. */
import { z } from 'zod';

/** Count metadata is independent so invalid counts do not discard valid title cards. */
export const TmdbSearchCountSchema = z.object({
  total_results: z.number().int().nonnegative(),
});

const date = z.union([z.iso.date(), z.literal('')]).nullish();
const mediaFields = {
  id: z.number().int().positive(),
  backdrop_path: z.string().min(1).nullish(),
  genre_ids: z.array(z.number().int().positive()),
  vote_average: z.number().min(0).max(10).nullish(),
};

const movie = z.object({
  ...mediaFields,
  media_type: z.literal('movie'),
  title: z.string().trim().min(1),
  release_date: date,
});
const tv = z.object({
  ...mediaFields,
  media_type: z.literal('tv'),
  name: z.string().trim().min(1),
  first_air_date: date,
});

export const TmdbTitleSearchResponseSchema = z.object({
  results: z.array(
    z.discriminatedUnion('media_type', [movie, tv, z.object({ media_type: z.literal('person') })]),
  ),
});

// Single-media endpoints omit the discriminator; their endpoint supplies it.
export const TmdbMovieSearchResponseSchema = z.object({
  results: z.array(movie.extend({ media_type: z.literal('movie').default('movie') })),
});

export const TmdbTvSearchResponseSchema = z.object({
  results: z.array(tv.extend({ media_type: z.literal('tv').default('tv') })),
});
