/**
 * Calls the configured language model with separate system instructions
 * and user content. Returns text without interpreting search criteria
 * or validating search proposals.
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import type { LlmRuntimeConfig } from '@lib/schemas/runtime-config';

export type LlmConfig = LlmRuntimeConfig;

type LlmInput = {
  system: string;
  userContent: string;
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
