/**
 * Applies validated search proposals and decides whether a title search is
 * ready or needs clarification. Does not call TMDb or execute searches.
 */
import type { LlmConfig } from './llm';
import { parseSearchProposal } from './parser';
import type { ParserInput } from './parser';

type SearchCriteria = ParserInput['currentFilters'];

type SearchDecision =
  | { status: 'unsupported'; reason: 'missing_title' }
  | { status: 'needs_clarification'; field: 'mediaType'; options: ('movie' | 'tv')[] }
  | { status: 'ready'; path: 'title'; criteria: SearchCriteria & { title: string } };

/** Requires a specific media type when a title search includes a year. */
export function decideSearch(criteria: SearchCriteria): SearchDecision {
  const title = criteria.title?.trim();
  if (!title) {
    return { status: 'unsupported', reason: 'missing_title' };
  }

  if (criteria.year !== undefined && criteria.mediaType === 'all') {
    return { status: 'needs_clarification', field: 'mediaType', options: ['movie', 'tv'] };
  }

  return { status: 'ready', path: 'title', criteria: { ...criteria, title } };
}

/** Applies accepted edits to a copy of the draft and evaluates it without executing a search. */
export async function submitSearch(
  config: LlmConfig,
  input: ParserInput,
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
        if (change.value === null) {
          delete criteria.year;
        } else {
          criteria.year = change.value;
        }
        break;
    }
  }

  return { criteria, decision: decideSearch(criteria) };
}
