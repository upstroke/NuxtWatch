import type { TmdbHttpClient } from '../http';
import { mapMultiToTitleCards } from './map-multi-to-title-cards';

export async function searchMultiByTitle(http: Pick<TmdbHttpClient, 'get'>, title: string) {
  const response = await http.get('/search/multi', { query: title });
  return mapMultiToTitleCards(response);
}
