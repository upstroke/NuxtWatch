/** Clients submit intent, never replacement server criteria. */
import { z } from 'zod';

export const searchSubmitRequestSchema = z.strictObject({
  action: z.literal('submit'),
  userText: z.string().trim().min(1).max(4000),
});

export const searchRequestSchema = z.discriminatedUnion('action', [
  searchSubmitRequestSchema,
  z.strictObject({ action: z.literal('reset') }),
]);

export type SearchSubmitRequest = z.infer<typeof searchSubmitRequestSchema>;
