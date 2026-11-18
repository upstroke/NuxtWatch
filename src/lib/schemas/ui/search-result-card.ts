import { z } from 'zod';

/** Normalized data for a movie or TV search result card, before display fallbacks. */
export const SearchResultCardSchema = z.object({
  id: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
  title: z.string().trim().min(1),
  backdropPath: z.string().min(1).nullable(),
  date: z.string().date().nullable(),
  genreIds: z.array(z.number().int().positive()),
  rating: z.number().min(0).max(10).nullable(),
});

export type SearchResultCard = z.infer<typeof SearchResultCardSchema>;
