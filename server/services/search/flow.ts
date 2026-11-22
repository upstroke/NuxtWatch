/** Coordinates criteria, bound clarification and execution without HTTP or storage. */
import type {
  SearchCriteria,
  SearchQuestion,
  SearchClarifyRequest,
  SearchExecuteRequest,
} from '@lib/schemas/search';
import type { TmdbHttpClient } from '../tmdb/http';
import { searchTitles } from '../tmdb/title-search';
import type { LlmConfig } from './llm';
import { evaluateSearchPaths } from './matrix';
import { parseSearchProposal } from './parser';
import type { ClarificationTurn, ParserInput } from './parser';

type SearchDecision =
  | {
      status: 'needs_clarification';
      field: 'title';
      message: string;
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

type Proposal = Awaited<ReturnType<typeof parseSearchProposal>>;

type SearchOutcome = {
  criteria: SearchCriteria;
  decision: SearchDecision | Exclude<Proposal, { status: 'ready' }>;
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

function decideSearch(criteria: SearchCriteria): SearchDecision {
  const evaluations = evaluateSearchPaths(criteria);
  const title = criteria.title?.trim();

  if (
    evaluations.every((evaluation) =>
      evaluation.obstacles.includes('title_required'),
    )
  ) {
    return {
      status: 'needs_clarification',
      field: 'title',
      message: 'Welchen Titel möchtest du suchen?',
    };
  }

  if (
    title &&
    evaluations.some((evaluation) => evaluation.obstacles.length === 0)
  ) {
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
async function interpretSearch(
  config: LlmConfig,
  input: ParserInput,
): Promise<SearchOutcome> {
  const proposal = await parseSearchProposal(config, input);
  const criteria = { ...input.currentFilters };

  if (proposal.status !== 'ready') {
    return { criteria, decision: proposal };
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

function openSearchRequest(
  state: SearchState,
  requestId: string,
  userText: string,
): SearchRequest {
  const request: SearchRequest = {
    requestId,
    revision: 1,
    originalUserText: userText,
    turns: [],
  };

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

function clarificationResponse(
  state: SearchState,
  request: SearchRequest,
) {
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
  if (
    !matchesQuestion(state, input, isCurrent) ||
    input.answer.type !== 'text'
  ) {
    return {
      status: 'rejected' as const,
      reason: 'stale_clarification' as const,
    };
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

  const active = () =>
    isSessionCurrent() &&
    state.currentRequest === request &&
    request.revision === revision;

  if (!active()) return { status: 'superseded' as const };

  if (!request.decision || request.question || request.clarifying) {
    return {
      status: 'rejected' as const,
      reason: 'request_not_ready' as const,
    };
  }

  if (
    request.execution?.revision === revision &&
    request.execution.status !== 'failed'
  ) {
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
    const results = await searchTitles(http, confirmed.title, options);
    execution.status = 'completed';

    if (!active()) return { status: 'superseded' as const };

    return {
      status: 'completed' as const,
      ...binding,
      criteria: confirmed,
      results,
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

  const active = () =>
    isSessionCurrent() && state.currentRequest === request;

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
