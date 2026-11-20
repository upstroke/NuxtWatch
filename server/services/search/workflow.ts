/** Owns requests, questions, revisions, and execution reservations independently of HTTP and storage. */
import type { SearchCriteria } from '@lib/schemas/search-criteria';
import type { MediaTypeQuestion } from '@lib/schemas/search-question';
import type { SearchClarifyRequest, SearchExecuteRequest } from '@lib/schemas/search-request';
import type { TmdbHttpClient } from '../tmdb/http';
import { decideSearch, submitSearch } from './coordinator';
import type { LlmConfig } from './llm';
import { decideSearchExecution, searchSubmission } from './submit';

type SearchExecution = {
  revision: number;
  status: 'running' | 'completed' | 'failed';
};

type SearchRequest = {
  requestId: string;
  revision: number;
  question?: MediaTypeQuestion;
  decision?: Awaited<ReturnType<typeof submitSearch>>['decision'];
  execution?: SearchExecution;
};

export type SearchState = {
  criteria: SearchCriteria;
  currentRequest?: SearchRequest;
};

/** Replaces the current request and its question without changing confirmed criteria. */
export function openSearchRequest(state: SearchState, requestId: string): SearchRequest {
  const request = { requestId, revision: 1 };
  state.currentRequest = request;
  return request;
}

/** Applies an offered selection and closes its bound question without calling external services. */
export function clarifySearch(
  state: SearchState,
  input: SearchClarifyRequest,
  isSessionCurrent: () => boolean,
) {
  const request = state.currentRequest;
  const question = request?.question;
  if (
    !isSessionCurrent() ||
    !request ||
    request.requestId !== input.requestId ||
    request.revision !== input.revision ||
    !question ||
    question.requestId !== input.requestId ||
    question.questionId !== input.questionId ||
    question.revision !== input.revision
  ) {
    return { status: 'rejected' as const, reason: 'stale_clarification' as const };
  }

  if (!question.options.includes(input.answer.value)) {
    return { status: 'rejected' as const, reason: 'selection_not_offered' as const };
  }

  const criteria = { ...state.criteria, mediaType: input.answer.value };
  const decision = decideSearch(criteria);

  // Selection acceptance and question closure form one synchronous domain transition.
  state.criteria = criteria;
  delete request.question;
  request.revision += 1;
  request.decision = decision;

  return {
    status: 'clarified' as const,
    requestId: request.requestId,
    revision: request.revision,
    criteria: { ...criteria },
    decision,
  };
}

/** Reserves supported work synchronously and permits retries only after a technical failure. */
async function executeCurrentRequest(
  state: SearchState,
  request: SearchRequest,
  http: Pick<TmdbHttpClient, 'get'>,
  isSessionCurrent: () => boolean,
) {
  const revision = request.revision;
  if (!isSessionCurrent() || state.currentRequest !== request) {
    return { status: 'superseded' as const };
  }
  if (!request.decision || request.question) {
    return { status: 'rejected' as const, reason: 'request_not_ready' as const };
  }
  if (
    request.execution?.revision === revision &&
    request.execution.status !== 'failed'
  ) {
    return { status: 'rejected' as const, reason: 'execution_already_reserved' as const };
  }

  const criteria = { ...state.criteria };
  if (request.decision.status !== 'ready') {
    return {
      status: 'not_executed' as const,
      requestId: request.requestId,
      revision,
      criteria,
      decision: request.decision,
    };
  }

  const decision = decideSearchExecution(criteria);
  if (decision.status !== 'ready') {
    return {
      status: 'not_executed' as const,
      requestId: request.requestId,
      revision,
      criteria,
      decision,
    };
  }

  const execution: SearchExecution = { revision, status: 'running' };
  request.execution = execution;
  try {
    const result = await searchSubmission({ criteria, decision }, http);
    execution.status = result.status === 'completed' ? 'completed' : 'failed';
    if (
      !isSessionCurrent() ||
      state.currentRequest !== request ||
      request.revision !== revision
    ) {
      return { status: 'superseded' as const };
    }
    return { ...result, requestId: request.requestId, revision };
  } catch (error) {
    execution.status = 'failed';
    if (
      !isSessionCurrent() ||
      state.currentRequest !== request ||
      request.revision !== revision
    ) {
      return { status: 'superseded' as const };
    }
    throw error;
  }
}

/** Executes only the bound confirmed server revision, without invoking the parser. */
export async function executeSearch(
  state: SearchState,
  input: SearchExecuteRequest,
  http: Pick<TmdbHttpClient, 'get'>,
  isSessionCurrent: () => boolean,
) {
  const request = state.currentRequest;
  if (
    !isSessionCurrent() ||
    !request ||
    request.requestId !== input.requestId ||
    request.revision !== input.revision
  ) {
    return { status: 'rejected' as const, reason: 'stale_execution' as const };
  }
  return executeCurrentRequest(state, request, http, isSessionCurrent);
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
  request.decision = decision;

  if (question !== undefined) {
    return {
      status: 'not_executed' as const,
      ...outcome,
      requestId: request.requestId,
      revision: request.revision,
      question,
    };
  }

  return executeCurrentRequest(state, request, http, isSessionCurrent);
}
