import { z } from 'zod';
import { PARSER_INSTRUCTIONS } from '@lib/parser/instructions';
import { refineTitleSearch } from '@lib/parser/refine-title-search';

const BodySchema = z.object({ title: z.string().trim().min(1).max(500), userText: z.string().trim().min(1).max(2000) }).strict();
const CompletionSchema = z.object({ choices: z.tuple([z.object({ message: z.object({ content: z.string().min(1) }) })]).rest(z.unknown()) });
const OpenRouterConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  model: z.string().trim().min(1),
});

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 });
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const body = BodySchema.safeParse(await readBody(event));
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid refinement input' });

  const config = OpenRouterConfigSchema.safeParse(useRuntimeConfig(event).openrouter);
  if (!config.success) {
    throw createError({ statusCode: 503, statusMessage: 'Parser is not configured' });
  }
  const { apiKey, model } = config.data;

  const { title, userText } = body.data;
  let proposal: unknown;
  try {
    const response = await $fetch<unknown>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: 'error',
      retry: 0,
      timeout: 30000,
      body: {
        model,
        reasoning: { enabled: false },
        messages: [
          { role: 'system', content: PARSER_INSTRUCTIONS },
          {
            role: 'user',
            content: JSON.stringify({
              context: {
                currentFilters: { mediaType: 'all', title },
                capabilities: {
                  changes: [
                    { field: 'title', operations: ['set'] },
                    { field: 'mediaType', operations: ['set'] },
                    { field: 'year', operations: ['set'] },
                  ],
                },
                pendingTargets: [],
              },
              userText,
            }),
          },
        ],
      },
    });
    proposal = JSON.parse(CompletionSchema.parse(response).choices[0].message.content);
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Parser provider failed' });
  }

  return refineTitleSearch({ title }, proposal);
});
