/** Coordinates criteria, bound clarification and execution without HTTP or storage. */
import type {
  SearchCriteria,
  SearchQuestion,
  SearchClarifyRequest,
  SearchExecuteRequest,
  UnsupportedReason,
} from '@lib/schemas/search';
import type { TmdbHttpClient } from '../tmdb/http';
import { searchTitles } from '../tmdb/title-search';
import { parseSearchProposal } from './llm';
import type { ClarificationTurn, LlmConfig, ParserInput } from './llm';
import { evaluateSearchPaths } from './matrix';
import { searchTexts } from './texts';

type SearchDecision =
  | {
      status: 'needs_clarification';
      field: 'title';
      message: string;
      source: 'application';
    }
  | {
      status: 'needs_clarification';
      message: string;
      source: 'llm';
    }
  | {
      status: 'unsupported';
      reason: UnsupportedReason;
      message: string;
      source: 'application';
    }
  | {
      status: 'needs_clarification';
      field: 'mediaType';
      options: ('movie' | 'tv')[];
    }
  | {
      status: 'ready';
      path: 'title';
      criteria: SearchCriteria & { title: string };
    };

type SearchOutcome = {
  criteria: SearchCriteria;
  decision: SearchDecision;
};

type SearchExecution = {
  revision: number;
  status: 'running' | 'completed' | 'failed';
};

type SearchRequest = {
  requestId: string;
  revision: number;
  originalUserText: string;
  turns: ClarificationTurn[];
  question?: SearchQuestion;
  decision?: SearchOutcome['decision'];
  execution?: SearchExecution;
  clarifying?: boolean;
};

export type SearchState = {
  criteria: SearchCriteria;
  currentRequest?: SearchRequest;
};

type SearchHttpClient = Pick<TmdbHttpClient, 'get'>;
type IsCurrent = () => boolean;
type CreateId = () => string;

/** Determines whether the criteria cover a supported path or require clarification. */
function decideSearch(criteria: SearchCriteria): SearchDecision {
  const evaluations = evaluateSearchPaths(criteria);
  const title = criteria.title?.trim();

  if (evaluations.every((evaluation) => evaluation.obstacles.includes('title_required'))) {
    return {
      status: 'needs_clarification',
      field: 'title',
      message: searchTexts.clarification.titleRequired,
      source: 'application',
    };
  }

  if (title && evaluations.some((evaluation) => evaluation.obstacles.length === 0)) {
    return {
      status: 'ready',
      path: 'title',
      criteria: { ...criteria, title },
    };
  }

  return {
    status: 'needs_clarification',
    field: 'mediaType',
    options: ['movie', 'tv'],
  };
}

/** Validated proposals only change a copy, never the active session directly. */
async function interpretSearch(config: LlmConfig, input: ParserInput): Promise<SearchOutcome> {
  const proposal = await parseSearchProposal(config, input);
  const criteria = { ...input.currentFilters };

  // Model text is kept only for its own questions; refusals are rendered from the catalog.
  if (proposal.status === 'unsupported') {
    return {
      criteria,
      decision: {
        status: 'unsupported',
        reason: proposal.reason,
        message: searchTexts.unsupported[proposal.reason],
        source: 'application',
      },
    };
  }
  if (proposal.status === 'needs_clarification') {
    return {
      criteria,
      decision: { status: 'needs_clarification', message: proposal.message, source: 'llm' },
    };
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
        if (change.value === null) delete criteria.year;
        else criteria.year = change.value;
        break;
    }
  }

  return { criteria, decision: decideSearch(criteria) };
}

/** Replaces the active request while preserving the session's accepted criteria. */
function openSearchRequest(state: SearchState, requestId: string, userText: string): SearchRequest {
  const request: SearchRequest = {
    requestId,
    revision: 1,
    originalUserText: userText,
    turns: [],
  };

  state.currentRequest = request;
  return request;
}

/** Returns the bound question text used in clarification history and model context. */
function questionText(question: SearchQuestion): string {
  return question.message;
}

/** Binds a required clarification to this request and revision, or returns no question. */
function bindQuestion(
  request: SearchRequest,
  decision: SearchOutcome['decision'],
  createId: CreateId,
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
      message: searchTexts.clarification.mediaTypeRequiredForYear,
      options: [...decision.options],
    };
  }

  return {
    ...binding,
    kind: 'free_text',
    source: decision.source,
    message: decision.message,
  };
}

/** Accepts only the current open question binding when no clarification is in progress. */
function matchesQuestion(
  state: SearchState,
  input: SearchClarifyRequest,
  isCurrent: IsCurrent,
): boolean {
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

/** Stores an outcome, advances its revision, and clears context when no question remains. */
function commitOutcome(
  state: SearchState,
  request: SearchRequest,
  outcome: SearchOutcome,
  createId: CreateId,
): void {
  state.criteria = { ...outcome.criteria };
  request.decision = outcome.decision;
  request.revision += 1;
  request.question = bindQuestion(request, outcome.decision, createId);

  if (!request.question) {
    request.originalUserText = '';
    request.turns = [];
  }
}

/** Describes the processed clarification without authorizing or starting execution. */
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

/** Offered selections are validated without LLM or provider calls. */
export function clarifySearch(
  state: SearchState,
  input: SearchClarifyRequest,
  isCurrent: IsCurrent,
) {
  if (!matchesQuestion(state, input, isCurrent)) {
    return {
      status: 'rejected' as const,
      reason: 'stale_clarification' as const,
    };
  }

  const request = state.currentRequest!;
  const question = request.question!;

  if (
    input.answer.type !== 'selection' ||
    question.kind !== 'select_media_type' ||
    !question.options.includes(input.answer.value)
  ) {
    return {
      status: 'rejected' as const,
      reason: 'selection_not_offered' as const,
    };
  }

  const criteria = {
    ...state.criteria,
    mediaType: input.answer.value,
  };

  request.turns.push({
    question: questionText(question),
    answer: input.answer.value,
  });

  commitOutcome(
    state,
    request,
    { criteria, decision: decideSearch(criteria) },
    () => question.questionId,
  );

  return clarificationResponse(state, request);
}

/** Bound free text uses the shared interpreter, but never executes a search. */
export async function clarifySearchText(
  state: SearchState,
  input: SearchClarifyRequest,
  config: LlmConfig,
  isCurrent: IsCurrent,
  createId: CreateId,
) {
  if (!matchesQuestion(state, input, isCurrent) || input.answer.type !== 'text') {
    return {
      status: 'rejected' as const,
      reason: 'stale_clarification' as const,
    };
  }

  const request = state.currentRequest!;
  const question = request.question!;
  const revision = request.revision;
  const answer = input.answer.text;

  /** Checks that asynchronous interpretation still belongs to the same open question. */
  const active = () =>
    isCurrent() &&
    state.currentRequest === request &&
    request.revision === revision &&
    request.question === question;

  request.clarifying = true;

  try {
    const outcome = await interpretSearch(config, {
      currentFilters: { ...state.criteria },
      userText: answer,
      clarification: {
        originalUserText: request.originalUserText,
        turns: request.turns.map((turn) => ({ ...turn })),
        question: questionText(question),
      },
    });

    if (!active()) {
      return {
        status: 'rejected' as const,
        reason: 'stale_clarification' as const,
      };
    }

    request.turns.push({
      question: questionText(question),
      answer,
    });

    commitOutcome(state, request, outcome, createId);
    return clarificationResponse(state, request);
  } catch (error) {
    if (!active()) {
      return {
        status: 'rejected' as const,
        reason: 'stale_clarification' as const,
      };
    }

    throw error;
  } finally {
    delete request.clarifying;
  }
}

/** Shared reservation and execution for both submit and explicit execute. */
async function executeCurrentRequest(
  state: SearchState,
  request: SearchRequest,
  http: SearchHttpClient,
  isSessionCurrent: IsCurrent,
) {
  const revision = request.revision;

  /** Checks that execution still belongs to the current session, request, and revision. */
  const active = () =>
    isSessionCurrent() && state.currentRequest === request && request.revision === revision;

  if (!active()) return { status: 'superseded' as const };

  if (!request.decision || request.question || request.clarifying) {
    return {
      status: 'rejected' as const,
      reason: 'request_not_ready' as const,
    };
  }

  if (request.execution?.revision === revision && request.execution.status !== 'failed') {
    return {
      status: 'rejected' as const,
      reason: 'execution_already_reserved' as const,
    };
  }

  const criteria = { ...state.criteria };
  const binding = { requestId: request.requestId, revision };

  if (request.decision.status !== 'ready') {
    return {
      status: 'not_executed' as const,
      ...binding,
      criteria,
      decision: request.decision,
    };
  }

  const decision = decideSearch(criteria);

  if (decision.status !== 'ready') {
    return {
      status: 'not_executed' as const,
      ...binding,
      criteria,
      decision,
    };
  }

  const confirmed = decision.criteria;
  const options =
    confirmed.mediaType === 'all'
      ? undefined
      : { mediaType: confirmed.mediaType, year: confirmed.year };

  const execution: SearchExecution = {
    revision,
    status: 'running',
  };

  request.execution = execution;

  try {
    const { results, totalResults } = await searchTitles(http, confirmed.title, options);
    execution.status = 'completed';

    if (!active()) return { status: 'superseded' as const };

    return {
      status: 'completed' as const,
      ...binding,
      criteria: confirmed,
      results,
      totalResults,
    };
  } catch (error) {
    execution.status = 'failed';

    if (!active()) return { status: 'superseded' as const };

    throw error;
  }
}

/** Executes only the current bound revision, without language interpretation. */
export async function executeSearch(
  state: SearchState,
  input: SearchExecuteRequest,
  http: SearchHttpClient,
  isSessionCurrent: IsCurrent,
) {
  const request = state.currentRequest;

  if (
    !isSessionCurrent() ||
    !request ||
    request.requestId !== input.requestId ||
    request.revision !== input.revision
  ) {
    return {
      status: 'rejected' as const,
      reason: 'stale_execution' as const,
    };
  }

  return executeCurrentRequest(state, request, http, isSessionCurrent);
}

/** A new explicit submission may execute immediately when no question remains. */
export async function submitForSession(
  state: SearchState,
  requestId: string,
  userText: string,
  config: LlmConfig,
  http: SearchHttpClient,
  isSessionCurrent: IsCurrent,
  createQuestionId: CreateId,
) {
  const request = openSearchRequest(state, requestId, userText);

  /** Prevents a superseded submission from accepting interpretation results. */
  const active = () => isSessionCurrent() && state.currentRequest === request;

  let outcome: SearchOutcome;

  try {
    outcome = await interpretSearch(config, {
      currentFilters: { ...state.criteria },
      userText,
    });
  } catch (error) {
    if (!active()) return { status: 'superseded' as const };
    throw error;
  }

  if (!active()) return { status: 'superseded' as const };

  const criteria = outcome.criteria;
  const changed =
    state.criteria.title !== criteria.title ||
    state.criteria.mediaType !== criteria.mediaType ||
    state.criteria.year !== criteria.year;

  if (changed || outcome.decision.status === 'needs_clarification') {
    commitOutcome(state, request, outcome, createQuestionId);
  } else {
    request.decision = outcome.decision;
  }

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
  request.turns = [];

  return executeCurrentRequest(state, request, http, isSessionCurrent);
}
