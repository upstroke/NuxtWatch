/** Executes directly supported submissions; clarification never triggers a TMDb request. */
import type { TmdbHttpClient } from '../tmdb/http';
import { searchTitles } from '../tmdb/title-search';
import { submitSearch } from './coordinator';
import { generateLlmText } from './llm';
import type { LlmConfig } from './llm';
import { parseSearchProposal } from './parser';
import type { ParserInput } from './parser';

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
  // The current transport path cannot preserve a specific media type or year.
  if (criteria.mediaType !== 'all' || criteria.year !== undefined) {
    return {
      status: 'not_executed' as const,
      criteria,
      decision: {
        status: 'unsupported' as const,
        reason: 'unsupported_title_criteria' as const,
      },
    };
  }

  const results = await searchTitles(http, criteria.title);
  return { status: 'completed' as const, criteria, results };
}
