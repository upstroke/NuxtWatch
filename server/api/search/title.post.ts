import { z } from 'zod';
import { toTmdbHttpError } from '@server/services/tmdb/errors';
import { createTmdbHttpClient } from '@server/services/tmdb/http';
import { searchMultiByTitle } from '@server/services/tmdb/search/multi';
import { searchTypedByTitle } from '@server/services/tmdb/search/typed';
import { getTmdbConfig } from '@server/utils/tmdb';

const TitleSearchBodySchema = z.object({
  title: z.string().trim().min(1),
  mediaType: z.enum(['all', 'movie', 'tv']).default('all'),
  year: z.number().int().min(1).max(9999).optional(),
}).strict();

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  const criteria = TitleSearchBodySchema.safeParse(await readBody(event));
  if (!criteria.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid title search criteria' });
  }

  const { title, mediaType, year } = criteria.data;
  if (mediaType === 'all' && year !== undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Year requires mediaType movie or tv' });
  }

  const http = createTmdbHttpClient(getTmdbConfig(event), (url, options) =>
    $fetch<unknown>(url, { ...options, redirect: 'error' }),
  );

  try {
    return mediaType === 'all'
      ? await searchMultiByTitle(http, title)
      : await searchTypedByTitle(http, title, mediaType, year);
  } catch (error) {
    throw createError(toTmdbHttpError(error));
  }
});
