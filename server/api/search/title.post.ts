import { z } from 'zod';
import { toTmdbHttpError } from '@server/services/tmdb/errors';
import { createTmdbHttpClient } from '@server/services/tmdb/http';
import { searchMultiByTitle } from '@server/services/tmdb/search/multi';
import { getTmdbConfig } from '@server/utils/tmdb';

const TitleSearchBodySchema = z.object({ title: z.string().trim().min(1) }).strict();

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const criteria = TitleSearchBodySchema.safeParse(await readBody(event));
  if (!criteria.success) {
    throw createError({ statusCode: 400, statusMessage: 'Expected a non-empty title' });
  }

  const http = createTmdbHttpClient(getTmdbConfig(event), (url, options) =>
    $fetch<unknown>(url, { ...options, redirect: 'error' }),
  );

  try {
    return await searchMultiByTitle(http, criteria.data.title);
  } catch (error) {
    throw createError(toTmdbHttpError(error));
  }
});
