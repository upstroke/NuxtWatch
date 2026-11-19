/**
 * Shared decision point for all search paths. Determines whether confirmed
 * criteria can be executed or need clarification. Does not call providers
 * or start searches. The first implementation supports title search only.
 */

type SearchCriteria = {
  title?: string;
  mediaType: 'all' | 'movie' | 'tv';
  year?: number;
};

type SearchDecision =
  | { status: 'unsupported'; reason: 'missing_title' }
  | { status: 'needs_clarification'; field: 'mediaType'; options: readonly ['movie', 'tv'] }
  | { status: 'ready'; path: 'title'; criteria: SearchCriteria & { title: string } };

export function decideSearch(criteria: SearchCriteria): SearchDecision {
  const title = criteria.title?.trim();
  if (!title) return { status: 'unsupported', reason: 'missing_title' };

  if (criteria.year !== undefined && criteria.mediaType === 'all') {
    return { status: 'needs_clarification', field: 'mediaType', options: ['movie', 'tv'] };
  }

  return { status: 'ready', path: 'title', criteria: { ...criteria, title } };
}
