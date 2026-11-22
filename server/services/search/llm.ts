/** Generates and validates search proposals without applying criteria or executing. */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { PARSER_INSTRUCTIONS } from '@lib/parser/instructions';
import { CLARIFICATION_INSTRUCTIONS } from '@lib/parser/clarification-instructions';
import { searchMediaTypeSchema as mediaType, searchProposalSchema } from '@lib/schemas/search';
import type { SearchCriteria, SearchProposal } from '@lib/schemas/search';
import type { LlmRuntimeConfig } from '@lib/schemas/runtime-config';

export type LlmConfig = LlmRuntimeConfig;

type LlmInput = {
  system: string;
  userContent: string;
};

export type ClarificationTurn = { question: string; answer: string };
export type ParserInput = {
  currentFilters: SearchCriteria;
  userText: string;
  clarification?: { originalUserText: string; turns: ClarificationTurn[]; question: string };
};

/** Generates non-empty model text without interpreting or applying search criteria. */
export async function generateLlmText(
  config: LlmConfig,
  { system, userContent }: LlmInput,
): Promise<string> {
  const providerName = config.provider.trim();
  const baseUrl = config.baseUrl.trim();
  const modelId = config.model.trim();

  if (!providerName || !baseUrl || !modelId) {
    throw new Error(
      'Incomplete LLM configuration: NUXT_LLM_PROVIDER, ' +
        'NUXT_LLM_BASE_URL, and NUXT_LLM_MODEL must be set.',
    );
  }

  const provider = createOpenAICompatible({
    name: providerName,
    baseURL: baseUrl,
  });

  const { text } = await generateText({
    model: provider.chatModel(modelId),
    system,
    messages: [{ role: 'user', content: userContent }],
    maxOutputTokens: 256,
    maxRetries: 0,
  });

  const result = text.trim();

  if (!result) {
    throw new Error('The configured language model returned no text.');
  }

  return result;
}

/** Interprets submit or bound clarification using the same validated proposal contract. */
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
