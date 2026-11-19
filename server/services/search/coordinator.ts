/**
 * Shared decision point for all search paths. Applies validated proposals and
 * determines whether criteria are ready or need clarification. Does not call
 * TMDb or execute searches. The first implementation supports title search only.
 */
import { parseSearchProposal } from './parser';

type SearchCriteria = Parameters<typeof parseSearchProposal>[1]['currentFilters'];

type SearchDecision =
  | { status: 'unsupported'; reason: 'missing_title' }
  | { status: 'needs_clarification'; field: 'mediaType'; options: readonly ['movie', 'tv'] }
  | { status: 'ready'; path: 'title'; criteria: SearchCriteria & { title: string } };

/** Evaluates criteria without dropping a year that requires a specific media type. */
export function decideSearch(criteria: SearchCriteria): SearchDecision {
  const title = criteria.title?.trim();
  if (!title) return { status: 'unsupported', reason: 'missing_title' };

  if (criteria.year !== undefined && criteria.mediaType === 'all') {
    return { status: 'needs_clarification', field: 'mediaType', options: ['movie', 'tv'] };
  }

  return { status: 'ready', path: 'title', criteria: { ...criteria, title } };
}

/** Parses a submission and evaluates the updated draft without executing a search. */
export async function submitSearch(
  config: Parameters<typeof parseSearchProposal>[0],
  input: Parameters<typeof parseSearchProposal>[1],
  parse: typeof parseSearchProposal = parseSearchProposal,
) {
  const proposal = await parse(config, input);
  const criteria = { ...input.currentFilters };

  if (proposal.status !== 'ready') {
    return { criteria, decision: proposal };
  }

  for (const change of proposal.changes ?? []) {
    switch (change.field) {
      case 'title':
        criteria.title = change.value;
        break;
      case 'mediaType':
        criteria.mediaType = change.value;
        break;
      case 'year':
        if (change.value === null) delete criteria.year;
        else criteria.year = change.value;
        break;
    }
  }

  return { criteria, decision: decideSearch(criteria) };
}
