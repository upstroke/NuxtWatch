/**
 * Shared entry point for search proposals, independent of the search path.
 * Generates and validates model proposals without applying criteria,
 * selecting a TMDb endpoint, or executing a search.
 * The first implementation supports title, media type, and year only.
 */
import { z } from 'zod';
import { PARSER_INSTRUCTIONS } from '@lib/parser/instructions';
import { generateLlmText } from './llm';

const title = z.string().trim().min(1).max(500);
const mediaType = z.enum(['all', 'movie', 'tv']);
const year = z.number().int().min(1).max(9999);

const change = z.discriminatedUnion('field', [
  z.strictObject({ field: z.literal('title'), operation: z.literal('set'), value: title }),
  z.strictObject({ field: z.literal('mediaType'), operation: z.literal('set'), value: mediaType }),
  z.strictObject({ field: z.literal('year'), operation: z.literal('set'), value: year.nullable() }),
]);

const changes = z.array(change).max(3).refine(
  (edits) => new Set(edits.map((edit) => edit.field)).size === edits.length,
  'A field may only be edited once',
);
const message = z.string().trim().min(1);
const proposal = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('ready'), changes: changes.optional() }),
  z.strictObject({ status: z.literal('needs_clarification'), message }),
  z.strictObject({ status: z.literal('unsupported'), message }),
]);

type SearchDraft = { title?: string; mediaType: z.infer<typeof mediaType>; year?: number };
type SearchProposal = z.infer<typeof proposal>;

export async function parseSearchProposal(
  config: Parameters<typeof generateLlmText>[0],
  input: { currentFilters: SearchDraft; userText: string },
  generate: typeof generateLlmText = generateLlmText,
): Promise<SearchProposal> {
  const text = await generate(config, {
    system: PARSER_INSTRUCTIONS,
    userContent: JSON.stringify({
      context: {
        currentFilters: input.currentFilters,
        capabilities: {
          changes: { title: ['set'], mediaType: ['set'], year: ['set'] },
          mediaTypes: mediaType.options,
          yearRange: { min: 1, max: 9999 },
        },
      },
      userText: input.userText,
    }),
  });

  return proposal.parse(JSON.parse(text));
}
