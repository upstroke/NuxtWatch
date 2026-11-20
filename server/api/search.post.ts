/** Validates HTTP intent, resolves session storage, and delegates request transitions. */
import { randomUUID } from 'node:crypto';
import { searchRequestSchema } from '@lib/schemas/search-request';
import { submitForSession } from '@server/services/search/workflow';
import { createTmdbHttpClient } from '@server/services/tmdb/http';
import { isTmdbError, toTmdbHttpError } from '@server/services/tmdb/errors';
import { getTmdbConfig } from '@server/utils/tmdb';
import { getSearchSession } from '@server/utils/search-session';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const request = searchRequestSchema.safeParse(await readBody(event));
  if (!request.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid search request' });
  }

  const context = getSearchSession(event, request.data.action === 'reset');
  const session = context.session;
  if (request.data.action === 'reset') {
    return { status: 'reset' as const, criteria: session.criteria };
  }

  const runtime = useRuntimeConfig(event);
  const llm = {
    provider: runtime.llm.provider.trim(),
    baseUrl: runtime.llm.baseUrl.trim(),
    model: runtime.llm.model.trim(),
  };
  if (!llm.provider || !llm.baseUrl || !llm.model) {
    throw createError({ statusCode: 503, statusMessage: 'Search configuration unavailable' });
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
    );
  } catch (error) {
    if (isTmdbError(error)) throw createError(toTmdbHttpError(error));
    throw createError({ statusCode: 502, statusMessage: 'Search processing failed' });
  }

  if (result.status === 'superseded') {
    throw createError({ statusCode: 409, statusMessage: 'Search request replaced or session expired' });
  }
  context.touch();
  return result;
});
