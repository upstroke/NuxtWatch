/** Bound application and model questions; free text is interpreted by the parser. */
import { z } from 'zod';
import { searchMediaTypeSchema } from './search-criteria';

export const questionBindingSchema = z.strictObject({
  questionId: z.string().min(1),
  requestId: z.string().min(1),
  revision: z.number().int().min(1),
});
export const mediaTypeQuestionSchema = questionBindingSchema.extend({
  kind: z.literal('select_media_type'),
  field: z.literal('mediaType'),
  options: z.array(searchMediaTypeSchema.exclude(['all'])).min(1),
});
export const textQuestionSchema = questionBindingSchema.extend({
  kind: z.literal('free_text'),
  source: z.enum(['application', 'llm']),
  message: z.string().trim().min(1),
});
export const searchQuestionSchema = z.discriminatedUnion('kind', [
  mediaTypeQuestionSchema, textQuestionSchema,
]);
export type MediaTypeQuestion = z.infer<typeof mediaTypeQuestionSchema>;
export type SearchQuestion = z.infer<typeof searchQuestionSchema>;
