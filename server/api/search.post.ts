/** Validates direct submissions and delegates interpretation and execution to the search flow. */
import { searchSubmitRequestSchema } from '@lib/schemas/search-request';
import { submitAndSearch } from '@server/services/search/submit';
import { createTmdbHttpClient } from '@server/services/tmdb/http';
import { isTmdbError, toTmdbHttpError } from '@server/services/tmdb/errors';
import { getTmdbConfig } from '@server/utils/tmdb';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const body: unknown = await readBody(event);
  const request = searchSubmitRequestSchema.safeParse(body);
  if (!request.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid search request' });
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

  try {
    return await submitAndSearch(llm, {
      currentFilters: request.data.currentFilters,
      userText: request.data.userText,
    }, http);
  } catch (error) {
    if (isTmdbError(error)) {
      throw createError(toTmdbHttpError(error));
    }
    // Do not expose SDK errors, prompts, model output or configuration values.
    throw createError({ statusCode: 502, statusMessage: 'Search processing failed' });
  }
});
