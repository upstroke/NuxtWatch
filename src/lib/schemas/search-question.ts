/** Defines the concrete media-type question returned by the search workflow. */
import { z } from 'zod';
import { searchMediaTypeSchema } from './search-criteria';

export const mediaTypeQuestionSchema = z.strictObject({
  questionId: z.string().min(1),
  requestId: z.string().min(1),
  revision: z.number().int().min(1),
  kind: z.literal('select_media_type'),
  field: z.literal('mediaType'),
  options: z.array(searchMediaTypeSchema.exclude(['all'])).min(1),
});

export type MediaTypeQuestion = z.infer<typeof mediaTypeQuestionSchema>;
