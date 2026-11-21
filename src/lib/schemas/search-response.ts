/** Regular HTTP responses; technical errors use the HTTP error boundary. */
import { z } from 'zod';
import { searchCriteriaSchema, searchTitleSchema } from './search-criteria';
import {
  mediaTypeQuestionSchema,
  questionBindingSchema,
  searchQuestionSchema,
} from './search-question';
import { SearchResultCardSchema } from './ui/search-result-card';

const requestBinding = questionBindingSchema.pick({ requestId: true, revision: true });
const message = z.string().trim().min(1);
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
export const searchResponseSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('completed'),
    ...requestBinding.shape,
    criteria: searchCriteriaSchema,
    results: z.array(SearchResultCardSchema),
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
