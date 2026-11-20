/** Clients submit intent or bound actions, never replacement server criteria. */
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

export const searchExecuteRequestSchema = z.strictObject({
  action: z.literal('execute'),
  ...mediaTypeQuestionSchema.pick({ requestId: true, revision: true }).shape,
});

export const searchRequestSchema = z.discriminatedUnion('action', [
  searchSubmitRequestSchema,
  searchClarifyRequestSchema,
  searchExecuteRequestSchema,
  z.strictObject({ action: z.literal('reset') }),
]);

export type SearchSubmitRequest = z.infer<typeof searchSubmitRequestSchema>;
export type SearchClarifyRequest = z.infer<typeof searchClarifyRequestSchema>;
export type SearchExecuteRequest = z.infer<typeof searchExecuteRequestSchema>;
