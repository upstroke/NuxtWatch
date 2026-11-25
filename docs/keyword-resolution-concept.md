# Context-Aware Keyword Resolution

Status: Proposed terminal experiment. Implementation and verification are open. Creating this document does not authorize implementation or integration into shared search.

## Purpose and Architecture Relationship

Evaluate whether an LLM can select suitable TMDb keywords from verified candidates using the complete user request and relevant confirmed criteria. A valid keyword ID does not establish that its meaning matches the user's intent or that matching films have the requested mood.

Follow the [shared search architecture](search-architecture-concept.md), [testing rules](testing.md), [typing rules](typing.md), and [development rules](../AGENTS.md). This document owns the experiment scope, tasks, and evidence. Do not duplicate or replace shared search rules here.

The existing title-search behavior and instructions remain unchanged. This is a bounded resolution experiment, not a second search architecture or evidence of reliable mood filtering.

## Example and Initial Scope

User request: "Ich suche einen Scifi-Movie aus dem Jahr 2025 mit dunkler Atmosphaere."

Supply the complete request, the preference being resolved, and any application-confirmed criteria. Movie, science-fiction, and 2025 provide context; only the mood is being mapped to keywords. Genre support is not assumed to exist in shared search. Experiment fixtures must distinguish supplied context from real confirmed application state.

Initially, the operator supplies the keyword query, for example `dark`. Automatic query generation is a separate future decision.

Included:
- Server-side TMDb keyword lookup with validated input and responses.
- All pages reported by the first validated response for one keyword query.
- An isolated temporary candidate set associated with the terminal experiment session.
- Independently versioned keyword-selection instructions and validated model output.
- Terminal presentation and controlled comparisons.

Excluded:
- UI, trending integration, Discover execution, and film/TV list merging.
- Automatic acceptance into confirmed search criteria or automatic searches.
- A complete local keyword catalog, vector database, or general session framework.
- Automatic keyword-query generation and production approval.

## Experimental Flow

1. Receive the user request, preference, explicit context, and operator-selected keyword query.
2. Fetch and validate page 1 of `/search/keyword` server-side.
3. Fetch the remaining pages up to the first response's `total_pages`.
4. Validate each page, deduplicate keywords by ID, and finalize the candidate set.
5. Explicitly invoke keyword selection with the current candidate set and full context.
6. Validate the model response and its membership in the supplied candidate set.
7. Display the proposal or resolution failure. Do not execute a film search.

## Provider Boundary and Pagination

Verify the exact TMDb request and response contract before implementation. Record synthetic or sanitized evidence without credentials.

Define Zod contracts for the query/page input, keyword ID/name, paginated provider response, selection input, and selection output. Specify trimming, empty results, numeric bounds, and unknown-field handling deliberately rather than assuming the provider's complete shape.

Use the existing server-side credential and transport boundaries where applicable. A separate internal HTTP route is needed only if justified by the terminal transport; the provider endpoint does not itself require a new public application endpoint.

Fetch each expected page once, except for bounded explicit retry handling. Validate that the returned page matches the requested page. Apply request timeouts, controlled request scheduling, and bounded retries with appropriate handling of rate-limit responses. Never retry indefinitely.

Do not add an arbitrary fixed page cap for this experiment. Freeze the expected page range from the first response rather than following an expanding page count indefinitely. Empty results must terminate without requesting nonexistent pages.

If a page fails or metadata changes, report the condition. Do not silently treat a partial or inconsistent collection as a complete candidate set. Completion means the expected validated page range was collected; it is not proof of a transactional provider snapshot or coverage of all synonyms.

## Temporary Candidate State

Keep state isolated from the confirmed title-search state. Inspect existing lifecycle and ownership mechanisms before choosing the smallest suitable implementation; no new general-purpose store is approved by this concept.

Track the query, candidate-set identity, status, expected and loaded pages, reported totals, unique candidates, and relevant collection diagnostics. Define cleanup, reset, expiry, and failure behavior before implementation.

A new collection invalidates selection bindings to the previous set. Late provider or model responses must not overwrite a newer set. Selection is available only for a finalized complete set. Do not silently reuse stale or expired state.

The model receives an explicit copy of the relevant candidates; it cannot inspect server memory automatically. Never silently truncate the list to fit model input. If it does not fit, report that limitation and agree on a separate processing strategy.

## Independent Instructions and Model Contract

Add a dedicated keyword-selection instruction module with its own version, for example `src/lib/parser/keyword-selection-instructions.ts`. Send only the instructions required for this task. A static code import does not mean that its text is sent to the model; dynamic loading is optional, not a prerequisite for prompt isolation.

Keep fixed trusted instructions separate from user text, context, and provider candidate names. Treat all supplied content as untrusted data. Prompt wording and JSON formatting are not security boundaries.

The model must:
- Use the full request and relevant confirmed context to interpret the specified preference.
- Select only candidate IDs supplied for this invocation.
- Avoid adding unrequested genres, settings, periods, themes, or plot requirements.
- Distinguish release year from the time in which a story is set.
- Allow `no_match` and `needs_clarification` instead of forcing a selection.
- Produce a proposal only; never modify criteria, select endpoints, or execute searches.

Choose the exact output schema during implementation planning. It must distinguish a selection, no suitable match, and a clarification question. Record concise reasons, not a request for private reasoning. Do not treat self-reported model confidence as acceptance evidence.

After schema validation, application code checks ID membership, duplicates, allowed selection size, status consistency, and current candidate-set binding. Invalid model output is a resolution failure, not permission to drop the preference.

## Terminal Experiment and Evaluation

Show the operator query, collection completeness, unique candidate count, context supplied to the model, instruction version, selected keyword names/IDs, and concise outcome explanation. Distinguish transport failures, invalid output, no match, and clarification.

Support repeated selection against the same finalized set without refetching it unnecessarily. Keep operational logs free of real conversations and credentials. Persist only agreed synthetic fixtures and sanitized evidence.

Compare the same candidate set with and without relevant context. Include ambiguous mood words, misleading lexical matches, no-match cases, invalid IDs, stale responses, and repeated real-model trials. Examples such as `dark future` must not be accepted merely because science-fiction makes them plausible.

Separate deterministic boundary tests from real-model semantic evaluation and adversarial input tests. A passing schema or example is not evidence of prompt-injection resistance or general semantic reliability. Film relevance and the effects of keyword filtering require a later Discover experiment.

## Tasks and Acceptance

All tasks are open. Implementation requires a separately agreed change scope and approval for each repository write.

- [ ] T1: Inspect existing provider transport, schemas, LLM module, terminal client, and session handling. Record verified API behavior and propose a concrete file/test scope.
- [ ] T2: Define Zod contracts and deterministic tests for valid, empty, malformed, and inconsistent inputs/responses.
- [ ] T3: Implement complete paging and isolated temporary state. Test deduplication, failures, metadata changes, reset/expiry, and stale-response rejection.
- [ ] T4: Add independent versioned instructions and keyword selection through suitable shared model transport. Test output validation and candidate membership without changing title-search behavior.
- [ ] T5: Add explicit terminal experiment actions and diagnostics. Confirm that no film search or confirmed-criteria mutation occurs.
- [ ] T6: Run synthetic contextual comparisons, repeated real-model trials, and agreed adversarial cases. Record outcomes and limitations, including model/provider and instruction version.
- [ ] T7: Review evidence and decide whether to stop, revise, or commission query generation and/or a Discover comparison separately.

## Evidence and Open Decisions

No implementation checks or real-model trials have been completed for this concept.

A user-supplied `dark` response contained page 1 with 20 candidates, `total_pages: 7`, and `total_results: 129`, including `dark` with ID `259094`. This is an illustrative user-provided response, not a current independent API audit or proof of keyword suitability. Do not hard-code its counts or ordering.

Decide during T1: exact terminal/HTTP contract, temporary-state ownership and lifecycle, output schema and selection size, handling of changing pagination metadata, model-input feasibility, and evidence format.

Decide only after evaluation: automatic query generation, multiple keyword combination semantics, user confirmation policy, mood as a hard filter versus ranking preference, and integration into shared search.

## T1 Inspection Record — 25 November 2026

Status: Repository inspection and implementation proposal recorded. T1 remains open. Recording proposals does not approve their implementation or establish live API behavior.

### Inspected Basis and Findings

The assistant read the relevant files on `feat/keyword-resolution`; the inspection followed the concept commit `c1134438cc22e4e2a4186806e8d3e50ca084c78e`. This is a targeted code review, not an exhaustive repository audit or execution-based verification.

| Area | Observed code | Consequence |
| --- | --- | --- |
| Provider transport | `server/services/tmdb/http.ts` exposes `get(path, query)`, fixes the TMDb destination, adds Bearer authentication, uses a 10-second timeout, and disables automatic retries. | Reuse this transport rather than build another authenticated client. Redirect rejection remains the request adapter's responsibility; the search handler sets `redirect: 'error'`. |
| Provider errors | The HTTP client catches request failures and replaces them with `UPSTREAM_FAILED`. `server/services/tmdb/errors.ts` provides sanitized application errors. | A caller cannot currently distinguish a 429 response or obtain `Retry-After`. Targeted retry handling needs sanitized transport metadata, not raw error/header propagation. |
| Schemas | Separate title, detail, trending, runtime, and search contracts exist under `src/lib/schemas`; no keyword-specific schema was present in the inspected directory. | Add a dedicated provider contract rather than reuse a title response schema. |
| Model boundary | `server/services/search/llm.ts` separates `generateLlmText()` from `parseSearchProposal()`. The latter validates the existing title/media/year proposal contract. | Reuse text generation; do not use or expand the title proposal parser for this isolated experiment. |
| Model transport limits | `generateLlmText()` sets `maxOutputTokens: 256` and `maxRetries: 0`; the inspected SDK call does not set an explicit timeout. | Agree output and runtime limits for keyword selection while preserving existing title defaults. Input feasibility for the configured model is not demonstrated. |
| Terminal | `scripts/search.mjs` calls `/api/search`, forwards its session cookie, validates displayed response fields, and imports no server modules. | Preserve the server-side credential boundary and keep experiment commands separate from title search. |
| Session | `server/utils/search-session.ts` combines storage with `SearchState`: process-local Map, 30-minute inactivity lifetime, capacity 1,000, and cookie path `/api/search`. | Do not append experimental candidates to confirmed search state or assume this cookie reaches a separate experiment route. |

The review also covered `server/api/search/index.post.ts`, `server/utils/tmdb.ts`, representative provider schemas, `tests/unit/services/llm.spec.ts`, `tests/unit/services/tmdb-layers.spec.ts`, and the shared architecture, typing, testing, and development rules. Existing LLM tests inject generation and protect proposal validation/input separation; they do not prove behavior of the live model transport.

### API Evidence and Remaining Verification

The T1 discussion recorded the following documentation-based contract for `GET /3/search/keyword`: required string `query`, integer `page` defaulting to 1, and a response containing `page`, `results`, `total_pages`, and `total_results`, with candidate `id` and `name` fields. Language, genre, media type, and release year were not identified as endpoint parameters; they belong to selection context, not invented provider query parameters.

Documentation references for verification:
- [Keyword reference](https://developer.themoviedb.org/reference/search-keyword)
- [Official OpenAPI specification](https://developer.themoviedb.org/openapi/tmdb-api.json)
- [Rate limiting](https://developer.themoviedb.org/docs/rate-limiting)
- [Errors](https://developer.themoviedb.org/docs/errors)

Evidence limitation: the keyword reference did not expose a usable response contract through page extraction, and its markdown fetch failed. The earlier OpenAPI search result was truncated; no complete endpoint excerpt or independent live request was captured during this inspection. Treat the summarized contract as a verification target, not a completed API audit. Capture a readable official endpoint definition and/or sanitized synthetic live response before finalizing the provider schema.

The general TMDb error documentation reports page values from 1 to 500 and rate-limit failures with HTTP 429. Endpoint-specific behavior at that page boundary remains unverified. A provider-imposed limit is not an arbitrary application page cap: if the reported range cannot be collected, fail visibly rather than label a truncated set complete. Rate-limit guidance requires respecting 429 responses; no fixed request-rate allowance is assumed.

No assistant-run live TMDb request, real-model trial, project test, lint, typecheck, coverage run, or runtime concurrency check was performed for T1. The previously supplied `dark` response retains its user-provided evidence status.

### Proposed Transport and Lifecycle — Not Yet Approved

Use a separate HTTP terminal experiment, justified by keeping Nuxt runtime configuration and credentials on the server:

```text
scripts/keyword-resolution.mjs
  -> POST /api/experiments/keyword-resolution
     -> isolated experiment session
        -> TMDb keyword collection
        -> keyword selection through shared model transport
```

Proposed actions:
- `collect`: accept an operator-selected query, immediately invalidate previous candidate bindings, and collect the first response's expected page range.
- `select`: accept `candidateSetId`, the complete user request, the preference being resolved, and explicitly identified context; select only from that session's finalized complete set. Repeated contextual comparisons need not refetch candidates.
- `reset`: discard experiment state and invalidate outstanding operations.

Propose a dedicated cookie scoped to the experiment route and a small process-local session implementation, initially with a 30-minute inactivity lifetime. Keep title sessions untouched; do not introduce a general session framework. Capacity, memory limits, cleanup details, request-size limits, and overall operation budgets still need explicit values before implementation. Check session and candidate identity again after asynchronous calls so superseded results cannot become current.

For the first experiment, propose sequential page requests and strict consistency handling: check requested page numbers; reject changing total metadata as an incomplete collection; deduplicate identical ID/name pairs; report conflicting names for the same ID rather than silently choose one. Retain collection diagnostics without restoring a previous successful set as an implicit fallback.

Propose at most two additional attempts per page for HTTP 429, honoring a valid `Retry-After` or using bounded backoff. If the required wait exceeds the agreed operation budget, stop visibly as incomplete. Other technical failures may fail immediately for the initial experiment. Exact wait bounds and the operation budget remain open. Do not automatically retry entire collect or select actions.

### Proposed Selection Contract — Not Yet Approved

Use three exclusive model-output variants:

```ts
{ status: 'selected', keywordIds: number[], reason: string }
{ status: 'no_match', reason: string }
{ status: 'needs_clarification', question: string }
```

Propose one to three unique candidate IDs for `selected`, with no IDs on the other variants and bounded explanation/question text. Application code resolves display names from validated candidates and checks membership and current candidate-set binding. Multiple selected IDs are suggestions for evaluation, not approved AND/OR Discover semantics. A clarification is display-only in this scope; no general pending-question framework is implied.

Keep fixed keyword instructions separate from all supplied context and candidate names. Pass the full candidate list or report input-size/model-capacity limitations; never silently truncate. Final string bounds, input-size policy, output-token allowance, timeout, and evidence format remain to be agreed and tested with the actual configured model.

### Proposed File Scope for T2–T5 — Not Implementation Approval

| New file | Responsibility |
| --- | --- |
| `src/lib/schemas/tmdb-keyword.ts` | Provider query/page and response contracts with derived types |
| `src/lib/schemas/keyword-resolution.ts` | Experiment HTTP and model input/output contracts |
| `src/lib/parser/keyword-selection-instructions.ts` | Independent versioned keyword instructions |
| `server/services/tmdb/keyword-search.ts` | Page collection, validation, consistency, and deduplication |
| `server/services/search/keyword-resolution.ts` | Selection context, model call, and candidate membership checks |
| `server/utils/keyword-experiment-session.ts` | Isolated ownership/lifetime and stale-result protection |
| `server/api/experiments/keyword-resolution.post.ts` | Thin HTTP/configuration/error boundary |
| `scripts/keyword-resolution.mjs` | Explicit terminal actions and presentation |

Potential existing-file changes are limited to `server/services/tmdb/http.ts` and `errors.ts` for sanitized retry metadata, `server/services/search/llm.ts` for necessary generation limits while preserving title defaults, and this concept for evidence. Inspect and update the relevant regression tests with each shared-boundary change.

Keep `src/lib/parser/instructions.ts`, existing title-search contracts, matrix, flow, `server/utils/search-session.ts`, and `scripts/search.mjs` unchanged. Do not add Discover execution, UI, automatic query generation, or automatic confirmed-criteria mutation.

### Proposed Test Scope and T1 Exit Conditions

- `tests/unit/services/keyword-search.spec.ts`: expected page range, requested/returned page mismatch, empty results, invalid/changing metadata, duplicate/conflicting candidates, partial failures, and bounded retry outcomes with injected transport/time dependencies.
- `tests/unit/services/keyword-resolution.spec.ts`: context/instruction separation, full supplied candidates, invalid JSON, foreign/duplicate IDs, selection/status consistency, and input preservation using controlled model output.
- `tests/integration/keyword-resolution/keyword-http.spec.ts`: real isolated H3 HTTP with controlled outbound boundaries; independent clients, lifecycle, reset/expiry, stale asynchronous responses, complete-set gating, sanitized errors, and no-store. This is not a live Nuxt or browser test.
- Extend existing transport/LLM boundary tests where shared behavior changes; retain the title regression suite. Reuse fixtures/mocks only where there is concrete overlap. Do not duplicate a full schema matrix at every level.

T1 remains unchecked until the API evidence gap is resolved or explicitly accepted as a documented deferral, the experiment contracts and operational bounds are agreed, and the implementation/test scope is approved. This documentation change records findings and proposals only. It neither executes T2–T5 nor grants approval for later repository writes.
