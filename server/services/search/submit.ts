/** Evaluates supported execution paths and runs direct searches without session storage access. */
import type { SearchCriteria } from '@lib/schemas/search-criteria';
import type { TmdbHttpClient } from '../tmdb/http';
import { searchTitles } from '../tmdb/title-search';
import { decideSearch, submitSearch } from './coordinator';
import { generateLlmText } from './llm';
import type { LlmConfig } from './llm';
import { parseSearchProposal } from './parser';
import type { ParserInput } from './parser';

/** Evaluates domain requirements and the provider paths currently implemented. */
export function decideSearchExecution(criteria: SearchCriteria) {
  const decision = decideSearch(criteria);
  if (decision.status !== 'ready') return decision;

  if (criteria.mediaType !== 'all' || criteria.year !== undefined) {
    return {
      status: 'unsupported' as const,
      reason: 'unsupported_title_criteria' as const,
    };
  }

  return decision;
}

/** Interprets and executes a submission when no session-bound request lifecycle is required. */
export async function submitAndSearch(
  config: LlmConfig,
  input: ParserInput,
  http: Pick<TmdbHttpClient, 'get'>,
  generate: typeof generateLlmText = generateLlmText,
) {
  const outcome = await submitSearch(config, input, (parserConfig, parserInput) =>
    parseSearchProposal(parserConfig, parserInput, generate),
  );

  return searchSubmission(outcome, http);
}

/** Executes an evaluated submission without interpreting the user's intent again. */
export async function searchSubmission(
  outcome: Awaited<ReturnType<typeof submitSearch>>,
  http: Pick<TmdbHttpClient, 'get'>,
) {
  if (outcome.decision.status !== 'ready') {
    return { status: 'not_executed' as const, ...outcome };
  }

  const criteria = outcome.decision.criteria;
  const decision = decideSearchExecution(criteria);
  if (decision.status !== 'ready') {
    return { status: 'not_executed' as const, criteria, decision };
  }

  const results = await searchTitles(http, decision.criteria.title);
  return { status: 'completed' as const, criteria: decision.criteria, results };
}
