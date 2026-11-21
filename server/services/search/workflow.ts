/** Owns bound dialogue, revisions and execution independently of HTTP and storage. */
import type { SearchCriteria } from '@lib/schemas/search-criteria';
import type { SearchQuestion } from '@lib/schemas/search-question';
import type { SearchClarifyRequest, SearchExecuteRequest } from '@lib/schemas/search-request';
import type { TmdbHttpClient } from '../tmdb/http';
import { decideSearch, submitSearch } from './coordinator';
import type { LlmConfig } from './llm';
import type { ClarificationTurn } from './parser';
import { decideSearchExecution, searchSubmission } from './submit';

type Outcome = Awaited<ReturnType<typeof submitSearch>>;
type SearchExecution = { revision: number; status: 'running' | 'completed' | 'failed' };
type SearchRequest = {
  requestId: string;
  revision: number;
  originalUserText: string;
  turns: ClarificationTurn[];
  question?: SearchQuestion;
  decision?: Outcome['decision'];
  execution?: SearchExecution;
  clarifying?: boolean;
};
export type SearchState = { criteria: SearchCriteria; currentRequest?: SearchRequest };

export function openSearchRequest(state: SearchState, requestId: string): SearchRequest {
  const request: SearchRequest = { requestId, revision: 1, originalUserText: '', turns: [] };
  state.currentRequest = request;
  return request;
}
function questionText(question: SearchQuestion): string {
  return question.kind === 'free_text'
    ? question.message
    : 'Möchtest du einen Film oder eine Serie suchen?';
}
function bindQuestion(
  request: SearchRequest,
  decision: Outcome['decision'],
  createId: () => string,
): SearchQuestion | undefined {
  if (decision.status !== 'needs_clarification') return undefined;
  const binding = {
    requestId: request.requestId,
    revision: request.revision,
    questionId: createId(),
  };
  if ('field' in decision && decision.field === 'mediaType') {
    return {
      ...binding,
      kind: 'select_media_type',
      field: 'mediaType',
      options: [...decision.options],
    };
  }
  return {
    ...binding,
    kind: 'free_text',
    source: 'field' in decision ? 'application' : 'llm',
    message: decision.message,
  };
}
function matchesQuestion(
  state: SearchState,
  input: SearchClarifyRequest,
  isCurrent: () => boolean,
) {
  const request = state.currentRequest;
  const question = request?.question;
  return !!(
    isCurrent() &&
    request &&
    !request.clarifying &&
    question &&
    request.requestId === input.requestId &&
    request.revision === input.revision &&
    question.requestId === input.requestId &&
    question.revision === input.revision &&
    question.questionId === input.questionId
  );
}
function commitOutcome(
  state: SearchState,
  request: SearchRequest,
  outcome: Outcome,
  createId: () => string,
) {
  state.criteria = { ...outcome.criteria };
  request.decision = outcome.decision;
  request.revision += 1;
  request.question = bindQuestion(request, outcome.decision, createId);
}
function clarificationResponse(state: SearchState, request: SearchRequest) {
  return {
    status: 'clarified' as const,
    requestId: request.requestId,
    revision: request.revision,
    criteria: { ...state.criteria },
    decision: request.decision!,
    ...(request.question ? { question: request.question } : {}),
  };
}

/** Explicit offered selections need no language interpretation. */
export function clarifySearch(
  state: SearchState,
  input: SearchClarifyRequest,
  isCurrent: () => boolean,
) {
  if (!matchesQuestion(state, input, isCurrent)) {
    return { status: 'rejected' as const, reason: 'stale_clarification' as const };
  }
  const request = state.currentRequest!;
  const question = request.question!;
  if (
    input.answer.type !== 'selection' ||
    question.kind !== 'select_media_type' ||
    !question.options.includes(input.answer.value)
  ) {
    return { status: 'rejected' as const, reason: 'selection_not_offered' as const };
  }
  const criteria = { ...state.criteria, mediaType: input.answer.value };
  request.turns.push({ question: questionText(question), answer: input.answer.value });
  commitOutcome(
    state,
    request,
    { criteria, decision: decideSearch(criteria) },
    () => question.questionId,
  );
  return clarificationResponse(state, request);
}

/** Freely typed answers always go to the LLM with the bound dialogue. Never executes. */
export async function clarifySearchText(
  state: SearchState,
  input: SearchClarifyRequest,
  config: LlmConfig,
  isCurrent: () => boolean,
  createId: () => string,
) {
  if (!matchesQuestion(state, input, isCurrent) || input.answer.type !== 'text') {
    return { status: 'rejected' as const, reason: 'stale_clarification' as const };
  }
  const request = state.currentRequest!;
  const question = request.question!;
  const revision = request.revision;
  const answer = input.answer.text;
  const active = () =>
    isCurrent() &&
    state.currentRequest === request &&
    request.revision === revision &&
    request.question === question;
  request.clarifying = true;
  try {
    const outcome = await submitSearch(config, {
      currentFilters: { ...state.criteria },
      userText: answer,
      clarification: {
        originalUserText: request.originalUserText,
        turns: request.turns.map((turn) => ({ ...turn })),
        question: questionText(question),
      },
    });
    if (!active()) return { status: 'rejected' as const, reason: 'stale_clarification' as const };
    request.turns.push({ question: questionText(question), answer });
    commitOutcome(state, request, outcome, createId);
    if (!request.question) {
      request.originalUserText = '';
      request.turns = [];
    }
    return clarificationResponse(state, request);
  } catch (error) {
    if (!active()) return { status: 'rejected' as const, reason: 'stale_clarification' as const };
    throw error;
  } finally {
    delete request.clarifying;
  }
}

async function executeCurrentRequest(
  state: SearchState,
  request: SearchRequest,
  http: Pick<TmdbHttpClient, 'get'>,
  isSessionCurrent: () => boolean,
) {
  const revision = request.revision;
  if (!isSessionCurrent() || state.currentRequest !== request)
    return { status: 'superseded' as const };
  if (!request.decision || request.question || request.clarifying) {
    return { status: 'rejected' as const, reason: 'request_not_ready' as const };
  }
  if (request.execution?.revision === revision && request.execution.status !== 'failed') {
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
    if (!isSessionCurrent() || state.currentRequest !== request || request.revision !== revision) {
      return { status: 'superseded' as const };
    }
    return { ...result, requestId: request.requestId, revision };
  } catch (error) {
    execution.status = 'failed';
    if (!isSessionCurrent() || state.currentRequest !== request || request.revision !== revision) {
      return { status: 'superseded' as const };
    }
    throw error;
  }
}
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
  request.originalUserText = userText;
  const outcome = await submitSearch(config, { currentFilters: { ...state.criteria }, userText });
  if (!isSessionCurrent() || state.currentRequest !== request)
    return { status: 'superseded' as const };
  const criteria = outcome.criteria;
  const changed =
    state.criteria.title !== criteria.title ||
    state.criteria.mediaType !== criteria.mediaType ||
    state.criteria.year !== criteria.year;
  if (changed || outcome.decision.status === 'needs_clarification') {
    commitOutcome(state, request, outcome, createQuestionId);
  } else request.decision = outcome.decision;
  if (request.question) {
    return {
      status: 'not_executed' as const,
      ...outcome,
      requestId: request.requestId,
      revision: request.revision,
      question: request.question,
    };
  }
  request.originalUserText = '';
  return executeCurrentRequest(state, request, http, isSessionCurrent);
}
