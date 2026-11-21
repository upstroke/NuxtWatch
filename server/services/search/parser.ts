/** Generates and validates proposals without applying criteria or executing searches. */
import { z } from 'zod';
import { PARSER_INSTRUCTIONS } from '@lib/parser/instructions';
import { CLARIFICATION_INSTRUCTIONS } from '@lib/parser/clarification-instructions';
import {
  searchTitleSchema as title,
  searchMediaTypeSchema as mediaType,
  searchYearSchema as year,
} from '@lib/schemas/search-criteria';
import type { SearchCriteria } from '@lib/schemas/search-criteria';
import { generateLlmText } from './llm';
import type { LlmConfig } from './llm';

const change = z.discriminatedUnion('field', [
  z.strictObject({ field: z.literal('title'), operation: z.literal('set'), value: title }),
  z.strictObject({ field: z.literal('mediaType'), operation: z.literal('set'), value: mediaType }),
  z.strictObject({ field: z.literal('year'), operation: z.literal('set'), value: year.nullable() }),
]);
const changes = z
  .array(change)
  .max(3)
  .refine(
    (edits) => new Set(edits.map((edit) => edit.field)).size === edits.length,
    'A field may only be edited once',
  );
const message = z.string().trim().min(1);
const proposal = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('ready'), changes: changes.optional() }),
  z.strictObject({ status: z.literal('needs_clarification'), message }),
  z.strictObject({ status: z.literal('unsupported'), message }),
]);
type SearchProposal = z.infer<typeof proposal>;
export type ClarificationTurn = { question: string; answer: string };
export type ParserInput = {
  currentFilters: SearchCriteria;
  userText: string;
  clarification?: { originalUserText: string; turns: ClarificationTurn[]; question: string };
};

export async function parseSearchProposal(
  config: LlmConfig,
  input: ParserInput,
  generate: typeof generateLlmText = generateLlmText,
): Promise<SearchProposal> {
  const clarification = input.clarification;
  const context = {
    currentFilters: input.currentFilters,
    capabilities: {
      changes: { title: ['set'], mediaType: ['set'], year: ['set'] },
      mediaTypes: mediaType.options,
      yearRange: { min: 1, max: 9999 },
    },
  };
  const userContent = clarification
    ? [
        'Confirmed search criteria (context.currentFilters):',
        JSON.stringify(context.currentFilters),
        '',
        'Supported edits and values (context.capabilities):',
        JSON.stringify(context.capabilities),
        '',
        'Original unresolved search request:',
        clarification.originalUserText,
        ...clarification.turns.flatMap((turn, index) => [
          '',
          `Earlier clarification turn ${index + 1} - question:`,
          turn.question,
          `Earlier clarification turn ${index + 1} - answer:`,
          turn.answer,
        ]),
        '',
        'Current clarification question:',
        clarification.question,
        '',
        'Latest answer (userText):',
        input.userText,
      ].join('\n')
    : JSON.stringify({ context, userText: input.userText });
  const text = await generate(config, {
    system: clarification
      ? PARSER_INSTRUCTIONS + '\n\n' + CLARIFICATION_INSTRUCTIONS
      : PARSER_INSTRUCTIONS,
    userContent,
  });
  return proposal.parse(JSON.parse(text));
}
