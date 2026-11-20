/** Owns request opening and replacement independently of HTTP and session storage. */
import type { TmdbHttpClient } from '../tmdb/http';
import type { LlmConfig } from './llm';
import type { ParserInput } from './parser';
import { submitAndSearch } from './submit';

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

/** Opens a request before interpretation and prevents replaced work from committing criteria. */
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
  const result = await submitAndSearch(config, { currentFilters, userText }, http);

  if (!isSessionCurrent() || state.currentRequest !== request) {
    return { status: 'superseded' as const };
  }

  state.criteria = { ...result.criteria };
  return result;
}
