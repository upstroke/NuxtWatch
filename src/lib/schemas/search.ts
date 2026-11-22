/** Shared external criteria, proposal, question, action and response contracts. */
import { z } from 'zod';
import { SearchResultCardSchema } from './ui/search-result-card';

export const searchTitleSchema = z.string().trim().min(1).max(500);
export const searchMediaTypeSchema = z.enum(['all', 'movie', 'tv']);
export const searchYearSchema = z.number().int().min(1).max(9999);

export const searchCriteriaSchema = z.strictObject({
  title: searchTitleSchema.optional(),
  mediaType: searchMediaTypeSchema,
  year: searchYearSchema.optional(),
});
export type SearchCriteria = z.infer<typeof searchCriteriaSchema>;

const message = z.string().trim().min(1);

const searchChangeSchema = z.discriminatedUnion('field', [
  z.strictObject({
    field: z.literal('title'),
    operation: z.literal('set'),
    value: searchTitleSchema,
  }),
  z.strictObject({
    field: z.literal('mediaType'),
    operation: z.literal('set'),
    value: searchMediaTypeSchema,
  }),
  z.strictObject({
    field: z.literal('year'),
    operation: z.literal('set'),
    value: searchYearSchema.nullable(),
  }),
]);
const searchChangesSchema = z
  .array(searchChangeSchema)
  .max(3)
  .refine(
    (edits) => new Set(edits.map((edit) => edit.field)).size === edits.length,
    'A field may only be edited once',
  );
export const searchProposalSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('ready'), changes: searchChangesSchema.optional() }),
  z.strictObject({ status: z.literal('needs_clarification'), message }),
  z.strictObject({ status: z.literal('unsupported'), message }),
]);
export type SearchProposal = z.infer<typeof searchProposalSchema>;

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
  mediaTypeQuestionSchema,
  textQuestionSchema,
]);
export type MediaTypeQuestion = z.infer<typeof mediaTypeQuestionSchema>;
export type SearchQuestion = z.infer<typeof searchQuestionSchema>;

/** Clients submit intent or bound actions, never replacement server criteria. */
export const searchSubmitRequestSchema = z.strictObject({
  action: z.literal('submit'),
  userText: z.string().trim().min(1).max(4000),
});
export const searchClarifyRequestSchema = z.strictObject({
  action: z.literal('clarify'),
  ...questionBindingSchema.shape,
  answer: z.discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('selection'),
      value: mediaTypeQuestionSchema.shape.options.element,
    }),
    z.strictObject({ type: z.literal('text'), text: z.string().trim().min(1).max(4000) }),
  ]),
});
export const searchExecuteRequestSchema = z.strictObject({
  action: z.literal('execute'),
  ...questionBindingSchema.pick({ requestId: true, revision: true }).shape,
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

const requestBinding = questionBindingSchema.pick({ requestId: true, revision: true });
const decision = z.union([
  z.strictObject({
    status: z.literal('unsupported'),
    reason: z.enum(['missing_title', 'unsupported_title_criteria']),
  }),
  z.strictObject({ status: z.literal('unsupported'), message }),
  z.strictObject({ status: z.literal('needs_clarification'), message }),
  z.strictObject({ status: z.literal('needs_clarification'), field: z.literal('title'), message }),
  z.strictObject({
    status: z.literal('needs_clarification'),
    field: mediaTypeQuestionSchema.shape.field,
    options: mediaTypeQuestionSchema.shape.options,
  }),
]);
const clarifiedDecision = z.union([
  decision,
  z.strictObject({
    status: z.literal('ready'),
    path: z.literal('title'),
    criteria: searchCriteriaSchema.extend({ title: searchTitleSchema }),
  }),
]);

/** Regular HTTP responses; technical errors use the HTTP error boundary. */
export const searchResponseSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('completed'),
    ...requestBinding.shape,
    criteria: searchCriteriaSchema,
    results: z.array(SearchResultCardSchema),
    // null means unavailable, never zero or the unfiltered multi total.
    totalResults: z.number().int().nonnegative().nullable(),
  }),
  z.strictObject({
    status: z.literal('not_executed'),
    ...requestBinding.shape,
    criteria: searchCriteriaSchema,
    decision,
    question: searchQuestionSchema.optional(),
  }),
  z.strictObject({
    status: z.literal('clarified'),
    ...requestBinding.shape,
    criteria: searchCriteriaSchema,
    decision: clarifiedDecision,
    question: searchQuestionSchema.optional(),
  }),
  z.strictObject({ status: z.literal('reset'), criteria: searchCriteriaSchema }),
]);
export type SearchResponse = z.infer<typeof searchResponseSchema>;
