import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

type LlmConfig = {
    provider: string;
    baseUrl: string;
    model: string;
};

export async function generateLlmText(
    config: LlmConfig,
    prompt: string,
): Promise<string> {
    const providerName = config.provider.trim();
    const baseUrl = config.baseUrl.trim();
    const modelId = config.model.trim();

    if (!providerName || !baseUrl || !modelId) {
        throw new Error(
            'Incomplete LLM configuration: NUXT_LLM_PROVIDER, '
            + 'NUXT_LLM_BASE_URL, and NUXT_LLM_MODEL must be set.',
        );
    }

    const provider = createOpenAICompatible({
        name: providerName,
        baseURL: baseUrl,
    });

    const { text } = await generateText({
        model: provider.chatModel(modelId),
        prompt,
        maxOutputTokens: 256,
        maxRetries: 0,
    });

    const result = text.trim();

    if (!result) {
        throw new Error('The configured language model returned no text.');
    }

    return result;
}
