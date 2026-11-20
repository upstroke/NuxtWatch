/** Owns request opening, questions, revisions, and freshness checks independently of HTTP and storage. */
import type { MediaTypeQuestion } from '@lib/schemas/search-question';
import type { TmdbHttpClient } from '../tmdb/http';
import { submitSearch } from './coordinator';
import type { LlmConfig } from './llm';
import type { ParserInput } from './parser';
import { searchSubmission } from './submit';

type SearchRequest = {
  requestId: string;
  revision: number;
  question?: MediaTypeQuestion;
};

export type SearchState = {
  criteria: ParserInput['currentFilters'];
  currentRequest?: SearchRequest;
};

/** Replaces the current request and its question without changing confirmed criteria. */
export function openSearchRequest(state: SearchState, requestId: string): SearchRequest {
  const request = { requestId, revision: 1 };
  state.currentRequest = request;
  return request;
}

/** Commits criteria and a concrete question together, or executes a current direct search. */
export async function submitForSession(
  state: SearchState,
  requestId: string,
  userText: string,
  config: LlmConfig,
  http: Pick<TmdbHttpClient, 'get'>,
  isSessionCurrent: () => boolean,
  createQuestionId: () => string,
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

  const decision = outcome.decision;
  let question: MediaTypeQuestion | undefined;
  if (
    decision.status === 'needs_clarification' &&
    'field' in decision &&
    decision.field === 'mediaType'
  ) {
    question = {
      questionId: createQuestionId(),
      requestId: request.requestId,
      revision: request.revision + 1,
      kind: 'select_media_type',
      field: 'mediaType',
      options: [...decision.options],
    };
  }

  // Criteria edits and question opening form one synchronous domain transition.
  if (criteriaChanged || question !== undefined) {
    if (criteriaChanged) state.criteria = { ...criteria };
    request.revision += 1;
    if (question !== undefined) request.question = question;
  }

  if (question !== undefined) {
    return {
      status: 'not_executed' as const,
      ...outcome,
      requestId: request.requestId,
      revision: request.revision,
      question,
    };
  }

  const result = await searchSubmission(outcome, http);

  if (!isSessionCurrent() || state.currentRequest !== request) {
    return { status: 'superseded' as const };
  }

  return { ...result, requestId: request.requestId, revision: request.revision };
}
