/** Validates intent and obtains authoritative criteria from the server session. */
import { searchRequestSchema } from '@lib/schemas/search-request';
import { submitAndSearch } from '@server/services/search/submit';
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
  if (session.busy) {
    throw createError({ statusCode: 409, statusMessage: 'Search submission already running' });
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

  session.busy = true;
  context.touch();
  let result: Awaited<ReturnType<typeof submitAndSearch>>;
  try {
    result = await submitAndSearch(
      llm,
      { currentFilters: { ...session.criteria }, userText: request.data.userText },
      http,
    );
  } catch (error) {
    if (isTmdbError(error)) throw createError(toTmdbHttpError(error));
    throw createError({ statusCode: 502, statusMessage: 'Search processing failed' });
  } finally {
    session.busy = false;
  }

  if (!context.isCurrent()) {
    throw createError({ statusCode: 409, statusMessage: 'Search context replaced or expired' });
  }
  session.criteria = { ...result.criteria };
  context.touch();
  return result;
});
