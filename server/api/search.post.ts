/** Validates HTTP intent and responses, resolves storage, and delegates request transitions. */
import { randomUUID } from 'node:crypto';
import { searchRequestSchema } from '@lib/schemas/search-request';
import { searchResponseSchema } from '@lib/schemas/search-response';
import { LlmRuntimeConfigSchema } from '@lib/schemas/runtime-config';
import { submitForSession } from '@server/services/search/workflow';
import { createTmdbHttpClient } from '@server/services/tmdb/http';
import { isTmdbError, toTmdbHttpError } from '@server/services/tmdb/errors';
import { getTmdbConfig } from '@server/utils/tmdb';
import { getSearchSession } from '@server/utils/search-session';

/** Prevents invalid internal response shapes from crossing the HTTP boundary. */
function parseSearchResponse(value: unknown) {
  const response = searchResponseSchema.safeParse(value);
  if (!response.success) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid search response' });
  }
  return response.data;
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const request = searchRequestSchema.safeParse(await readBody(event));
  if (!request.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid search request' });
  }

  const context = getSearchSession(event, request.data.action === 'reset');
  const session = context.session;
  if (request.data.action === 'reset') {
    return parseSearchResponse({ status: 'reset', criteria: session.criteria });
  }

  const runtime = useRuntimeConfig(event);
  const llmConfig = LlmRuntimeConfigSchema.safeParse(runtime.llm);
  if (!llmConfig.success) {
    throw createError({ statusCode: 503, statusMessage: 'Search configuration unavailable' });
  }
  const llm = llmConfig.data;

  let tmdb;
  try {
    tmdb = getTmdbConfig(event);
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Search configuration unavailable' });
  }
  const http = createTmdbHttpClient(tmdb, (url, options): Promise<unknown> =>
    $fetch<unknown>(url, { ...options, redirect: 'error' }),
  );

  context.touch();
  let result: Awaited<ReturnType<typeof submitForSession>>;
  try {
    result = await submitForSession(
      session,
      randomUUID(),
      request.data.userText,
      llm,
      http,
      context.isCurrent,
      randomUUID,
    );
  } catch (error) {
    if (isTmdbError(error)) throw createError(toTmdbHttpError(error));
    throw createError({ statusCode: 502, statusMessage: 'Search processing failed' });
  }

  if (result.status === 'superseded') {
    throw createError({ statusCode: 409, statusMessage: 'Search request replaced or session expired' });
  }
  context.touch();
  return parseSearchResponse(result);
});
