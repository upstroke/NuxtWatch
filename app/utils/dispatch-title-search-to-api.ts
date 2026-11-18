import { dispatchTitleSearch } from '@lib/parser/dispatch-title-search';
import type { TmdbPagedResponse } from '@lib/schemas/tmdb';

export function dispatchTitleSearchToApi(proposal: unknown) {
  return dispatchTitleSearch(proposal, (criteria) =>
    $fetch<TmdbPagedResponse>('/api/search/title', {
      method: 'POST',
      body: criteria,
    }),
  );
}
