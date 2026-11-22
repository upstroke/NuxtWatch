/** External search contracts, starting with validated LLM proposals. */
import { z } from 'zod';
import {
  searchTitleSchema,
  searchMediaTypeSchema,
  searchYearSchema,
} from './search-criteria';

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

const message = z.string().trim().min(1);

export const searchProposalSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('ready'), changes: searchChangesSchema.optional() }),
  z.strictObject({ status: z.literal('needs_clarification'), message }),
  z.strictObject({ status: z.literal('unsupported'), message }),
]);

export type SearchProposal = z.infer<typeof searchProposalSchema>;
