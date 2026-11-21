/** Applies validated proposals and checks title-search completeness without executing. */
import type { LlmConfig } from './llm';
import { parseSearchProposal } from './parser';
import type { ParserInput } from './parser';
type SearchCriteria = ParserInput['currentFilters'];
type SearchDecision =
  | { status: 'needs_clarification'; field: 'title'; message: string }
  | { status: 'needs_clarification'; field: 'mediaType'; options: ('movie' | 'tv')[] }
  | { status: 'ready'; path: 'title'; criteria: SearchCriteria & { title: string } };

export function decideSearch(criteria: SearchCriteria): SearchDecision {
  const title = criteria.title?.trim();
  if (!title) {
    return {
      status: 'needs_clarification',
      field: 'title',
      message: 'Welchen Titel möchtest du suchen?',
    };
  }
  if (criteria.year !== undefined && criteria.mediaType === 'all') {
    return { status: 'needs_clarification', field: 'mediaType', options: ['movie', 'tv'] };
  }
  return { status: 'ready', path: 'title', criteria: { ...criteria, title } };
}
export async function submitSearch(
  config: LlmConfig,
  input: ParserInput,
  parse: typeof parseSearchProposal = parseSearchProposal,
) {
  const proposal = await parse(config, input);
  const criteria = { ...input.currentFilters };
  if (proposal.status !== 'ready') return { criteria, decision: proposal };
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
