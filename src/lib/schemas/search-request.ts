/** HTTP input contract for the first direct-search slice. */
import { z } from 'zod';

export const searchSubmitRequestSchema = z.strictObject({
  action: z.literal('submit'),
  userText: z.string().trim().min(1).max(4000),
  currentFilters: z
    .strictObject({
      title: z.string().trim().min(1).max(500).optional(),
      mediaType: z.enum(['all', 'movie', 'tv']).default('all'),
      year: z.number().int().min(1).max(9999).optional(),
    })
    .default({ mediaType: 'all' }),
});

export type SearchSubmitRequest = z.infer<typeof searchSubmitRequestSchema>;
