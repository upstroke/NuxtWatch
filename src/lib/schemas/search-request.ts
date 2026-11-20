/** Clients submit intent or bound answers, never replacement server criteria. */
import { z } from 'zod';
import { mediaTypeQuestionSchema } from './search-question';

export const searchSubmitRequestSchema = z.strictObject({
  action: z.literal('submit'),
  userText: z.string().trim().min(1).max(4000),
});

export const searchClarifyRequestSchema = z.strictObject({
  action: z.literal('clarify'),
  ...mediaTypeQuestionSchema.pick({ requestId: true, questionId: true, revision: true }).shape,
  answer: z.strictObject({
    type: z.literal('selection'),
    value: mediaTypeQuestionSchema.shape.options.element,
  }),
});

export const searchRequestSchema = z.discriminatedUnion('action', [
  searchSubmitRequestSchema,
  searchClarifyRequestSchema,
  z.strictObject({ action: z.literal('reset') }),
]);

export type SearchSubmitRequest = z.infer<typeof searchSubmitRequestSchema>;
export type SearchClarifyRequest = z.infer<typeof searchClarifyRequestSchema>;
