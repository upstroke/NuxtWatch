/** Owns request opening, replacement, revisions, and freshness checks independently of HTTP and storage. */
import type { TmdbHttpClient } from '../tmdb/http';
import { submitSearch } from './coordinator';
import type { LlmConfig } from './llm';
import type { ParserInput } from './parser';
import { searchSubmission } from './submit';

type SearchRequest = { requestId: string; revision: number };

export type SearchState = {
  criteria: ParserInput['currentFilters'];
  currentRequest?: SearchRequest;
};

/** Replaces the current request without changing the confirmed criteria. */
export function openSearchRequest(state: SearchState, requestId: string): SearchRequest {
  const request = { requestId, revision: 1 };
  state.currentRequest = request;
  return request;
}

/** Commits current criteria and their revision before searching, then checks result freshness. */
export async function submitForSession(
  state: SearchState,
  requestId: string,
  userText: string,
  config: LlmConfig,
  http: Pick<TmdbHttpClient, 'get'>,
  isSessionCurrent: () => boolean,
) {
  const request = openSearchRequest(state, requestId);
  const currentFilters = { ...state.criteria };
  const outcome = await submitSearch(config, { currentFilters, userText });

  if (!isSessionCurrent() || state.currentRequest !== request) {
    return { status: 'superseded' as const };
  }

  const criteria = outcome.criteria;
  const criteriaChanged =
    state.criteria.title !== criteria.title ||
    state.criteria.mediaType !== criteria.mediaType ||
    state.criteria.year !== criteria.year;

  if (criteriaChanged) {
    state.criteria = { ...criteria };
    request.revision += 1;
  }

  const result = await searchSubmission(outcome, http);

  if (!isSessionCurrent() || state.currentRequest !== request) {
    return { status: 'superseded' as const };
  }

  return { ...result, requestId: request.requestId, revision: request.revision };
}
