import { z } from 'zod';
import { refineTitleSearch, TITLE_REFINEMENT_INSTRUCTIONS } from '@lib/parser/refine-title-search';

const BodySchema = z
  .object({
    currentFilters: z
      .object({
        title: z.string().trim().min(1).max(500),
        mediaType: z.enum(['all', 'movie', 'tv']),
        year: z.number().int().min(1).max(9999).optional(),
      })
      .strict(),
    userText: z.string().trim().min(1).max(2000),
  })
  .strict();
const CompletionSchema = z.object({
  choices: z.tuple([z.object({ message: z.object({ content: z.string().min(1), reasoning: z.unknown().optional() }) })]).rest(z.unknown()),
});
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

  const { currentFilters, userText } = body.data;
  let proposal: unknown;
  let phase: 'fetch' | 'response-schema' | 'model-json' = 'fetch';
  try {
    const response = await $fetch<unknown>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: 'error',
      retry: 0,
      timeout: 30000,
      body: {
        model,
        messages: [
          { role: 'system', content: TITLE_REFINEMENT_INSTRUCTIONS },
          { role: 'user', content: JSON.stringify({ currentFilters, userText }) },
        ],
      },
    });
    phase = 'response-schema';
    const { content, reasoning } = CompletionSchema.parse(response).choices[0].message;
    if (process.env.TITLE_REFINE_DEBUG_REASONING === '1') {
      const preview = typeof reasoning === 'string'
        ? reasoning.split(apiKey).join('[redacted]').replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim().slice(0, 500)
        : '';
      console.info('[title-refine] Reasoning', preview || '(not returned)');
    }
    phase = 'model-json';
    proposal = JSON.parse(content);
  } catch (error: unknown) {
    const upstreamStatus =
      phase === 'fetch' &&
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined;

    console.warn('[title-refine] Parser provider failed', {
      phase,
      ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
    });
    throw createError({ statusCode: 502, statusMessage: 'Parser provider failed' });
  }

  return refineTitleSearch(currentFilters, proposal);
});
