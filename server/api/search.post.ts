/** Validates HTTP intent and delegates bound flow transitions. */
import { randomUUID } from 'node:crypto';
import { searchRequestSchema } from '@lib/schemas/search-request';
import { searchResponseSchema } from '@lib/schemas/search-response';
import { LlmRuntimeConfigSchema } from '@lib/schemas/runtime-config';
import {
  clarifySearch,
  clarifySearchText,
  executeSearch,
  submitForSession,
} from '@server/services/search/flow';
import { createTmdbHttpClient } from '@server/services/tmdb/http';
import { isTmdbError, toTmdbHttpError } from '@server/services/tmdb/errors';
import { getTmdbConfig } from '@server/utils/tmdb';
import { getSearchSession } from '@server/utils/search-session';

function parseSearchResponse(value: unknown) {
  const response = searchResponseSchema.safeParse(value);
  if (!response.success)
    throw createError({ statusCode: 500, statusMessage: 'Invalid search response' });
  return response.data;
}
function throwSearchHttpError(error: unknown): never {
  if (isTmdbError(error)) throw createError(toTmdbHttpError(error));
  throw createError({ statusCode: 502, statusMessage: 'Search processing failed' });
}
function executionResponse(
  result:
    | Awaited<ReturnType<typeof executeSearch>>
    | Awaited<ReturnType<typeof submitForSession>>,
) {
  if (result.status === 'rejected')
    throw createError({ statusCode: 409, statusMessage: 'Search execution not applicable' });
  if (result.status === 'superseded')
    throw createError({
      statusCode: 409,
      statusMessage: 'Search request replaced or session expired',
    });
  return parseSearchResponse(result);
}
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const request = searchRequestSchema.safeParse(await readBody(event));
  if (!request.success)
    throw createError({ statusCode: 400, statusMessage: 'Invalid search request' });
  const context = getSearchSession(event, request.data.action === 'reset');
  const session = context.session;
  if (request.data.action === 'reset')
    return parseSearchResponse({ status: 'reset', criteria: session.criteria });

  const getLlm = () => {
    const config = LlmRuntimeConfigSchema.safeParse(useRuntimeConfig(event).llm);
    if (!config.success)
      throw createError({ statusCode: 503, statusMessage: 'Search configuration unavailable' });
    return config.data;
  };
  if (request.data.action === 'clarify') {
    const input = request.data;
    const llm = input.answer.type === 'text' ? getLlm() : undefined;
    context.touch();
    let result: Awaited<ReturnType<typeof clarifySearchText>> | ReturnType<typeof clarifySearch>;
    try {
      result = llm
        ? await clarifySearchText(session, input, llm, context.isCurrent, randomUUID)
        : clarifySearch(session, input, context.isCurrent);
    } catch (error) {
      throwSearchHttpError(error);
    }
    if (result.status === 'rejected')
      throw createError({ statusCode: 409, statusMessage: 'Clarification no longer applicable' });
    context.touch();
    return parseSearchResponse(result);
  }
  let tmdb;
  try {
    tmdb = getTmdbConfig(event);
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Search configuration unavailable' });
  }
  const http = createTmdbHttpClient(tmdb, (url, options): Promise<unknown> =>
    $fetch<unknown>(url, { ...options, redirect: 'error' }),
  );
  if (request.data.action === 'execute') {
    context.touch();
    let result: Awaited<ReturnType<typeof executeSearch>>;
    try {
      result = await executeSearch(session, request.data, http, context.isCurrent);
    } catch (error) {
      throwSearchHttpError(error);
    }
    const response = executionResponse(result);
    context.touch();
    return response;
  }
  const llm = getLlm();
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
    throwSearchHttpError(error);
  }
  const response = executionResponse(result);
  context.touch();
  return response;
});
