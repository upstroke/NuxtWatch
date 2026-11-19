/** Validates the TMDb multi-search fields consumed by the title search service. */
import { z } from 'zod';

const date = z.union([z.iso.date(), z.literal('')]).nullish();
const mediaFields = {
  id: z.number().int().positive(),
  backdrop_path: z.string().min(1).nullish(),
  genre_ids: z.array(z.number().int().positive()),
  vote_average: z.number().min(0).max(10).nullish(),
};

const result = z.discriminatedUnion('media_type', [
  z.object({
    ...mediaFields,
    media_type: z.literal('movie'),
    title: z.string().trim().min(1),
    release_date: date,
  }),
  z.object({
    ...mediaFields,
    media_type: z.literal('tv'),
    name: z.string().trim().min(1),
    first_air_date: date,
  }),
  z.object({ media_type: z.literal('person') }),
]);

export const TmdbTitleSearchResponseSchema = z.object({
  results: z.array(result),
});
