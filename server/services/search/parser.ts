/** Generates and validates proposals without applying criteria or executing searches. */
import { PARSER_INSTRUCTIONS } from '@lib/parser/instructions';
import { CLARIFICATION_INSTRUCTIONS } from '@lib/parser/clarification-instructions';
import { searchMediaTypeSchema as mediaType } from '@lib/schemas/search-criteria';
import type { SearchCriteria } from '@lib/schemas/search-criteria';
import { searchProposalSchema } from '@lib/schemas/search';
import type { SearchProposal } from '@lib/schemas/search';
import { generateLlmText } from './llm';
import type { LlmConfig } from './llm';

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
    ...(clarification
      ? {
          originalUserText: clarification.originalUserText,
          clarificationTurns: clarification.turns,
          openQuestion: { message: clarification.question },
        }
      : {}),
  };
  const userContent = JSON.stringify({ context, userText: input.userText });
  const text = await generate(config, {
    system: clarification
      ? PARSER_INSTRUCTIONS + '\n\n' + CLARIFICATION_INSTRUCTIONS
      : PARSER_INSTRUCTIONS,
    userContent,
  });
  return searchProposalSchema.parse(JSON.parse(text));
}
