/** Evaluates supported execution paths and runs title searches without session storage access. */
import type { SearchCriteria } from '@lib/schemas/search-criteria';
import type { TmdbHttpClient } from '../tmdb/http';
import { searchTitles } from '../tmdb/title-search';
import { decideSearch, submitSearch } from './coordinator';
import { generateLlmText } from './llm';
import type { LlmConfig } from './llm';
import { parseSearchProposal } from './parser';
import type { ParserInput } from './parser';

/** Supports each ready title search; a year without a media type still needs clarification. */
export function decideSearchExecution(criteria: SearchCriteria) {
  return decideSearch(criteria);
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

  const confirmed = decision.criteria;
  const options = confirmed.mediaType === 'all'
    ? undefined
    : { mediaType: confirmed.mediaType, year: confirmed.year };
  const results = await searchTitles(http, confirmed.title, options);
  return { status: 'completed' as const, criteria: confirmed, results };
}
