import { z } from 'zod';
import type { TitleSearchCriteria } from './dispatch-title-search';

const MovieRefinementSchema = z
  .object({
    status: z.literal('ready'),
    changes: z
      .array(
        z.discriminatedUnion('field', [
          z
            .object({
              field: z.literal('mediaType'),
              operation: z.literal('set'),
              value: z.literal('movie'),
            })
            .strict(),
          z
            .object({
              field: z.literal('year'),
              operation: z.literal('set'),
              value: z.number().int().min(1).max(9999),
            })
            .strict(),
        ]),
      )
      .length(2),
  })
  .strict();

export function refineTitleSearch(current: Readonly<TitleSearchCriteria>, proposal: unknown) {
  const parsed = MovieRefinementSchema.safeParse(proposal);
  if (!parsed.success || !current.title.trim()) return { status: 'unchanged' } as const;

  const mediaType = parsed.data.changes.find((change) => change.field === 'mediaType');
  const year = parsed.data.changes.find((change) => change.field === 'year');
  if (!mediaType || !year) return { status: 'unchanged' } as const;

  return {
    status: 'refined',
    criteria: { title: current.title, mediaType: mediaType.value, year: year.value },
  } as const;
}
