# Context-Aware Keyword Resolution

Status: Proposed experiment and conditional follow-up plan. All tasks remain open. This document does not authorize implementation, Discover execution, or integration into shared search.

## Product Goal and Architecture

Enable requests such as "Zeige mir Sci-Fi-Filme mit düsterer Atmosphäre" through the shared natural-language search. Keyword resolution is a possible means of representing the atmospheric preference, not a standalone product goal or a proven mood filter. The optional release-year variant adds "aus 2025"; no year must be invented for the request without it.

Two questions need separate evidence:
1. Can verified TMDb keyword candidates be selected faithfully in the context of the request?
2. Does using those selections in an appropriate result-search path actually return relevant films without distorting the requested preference?

Follow the [shared search architecture](search-architecture-concept.md), [development rules](../AGENTS.md), [typing rules](typing.md), and [testing rules](testing.md). Provider research belongs in the [API analysis](tmdb-api-analysis.md#keyword-candidate-resolution); concrete observations belong in [search example 5](tmdb-search-examples.md#5-keyword-candidates-for-a-dark-atmosphere). This concept owns experiment scope, task acceptance, proposals, and evidence limitations, not a duplicate set of shared search rules.

Keyword selection is a criterion-specific resolver, not an alternative search-intent parser. Separate versioned instructions serve the bounded candidate-selection task; they must not interpret an independent full search object, introduce another readiness matrix, accept criteria, or authorize execution. Valid IDs and schema-valid output do not establish fidelity to user intent or film relevance.

## Responsibilities and Endpoint Applicability

Distinguish looking up keywords from searching for films using keywords.

| Responsibility | Owner |
| --- | --- |
| Interpret the user's requested criteria and explicit changes | Shared interpretation boundary; initially supplied explicitly for the experiment |
| Retrieve and validate keyword names/IDs | TMDb keyword provider service |
| Propose which supplied candidates represent a specified preference in context | Bounded keyword resolver using the shared model transport |
| Validate candidate membership and resolution outcome | Application code outside the model |
| Evaluate whether a result-search path covers all requested criteria and media scope | Shared matrix |
| Accept current transitions, bind questions, and decide the next action | Shared flow during integration |
| Map accepted criteria to verified provider parameters | Result-search adapter |
| Handle HTTP contracts, ownership, and display | Transport/session/interface boundaries |

The matrix must distinguish result-path support for keyword filters from missing resolution. It must not fetch keywords or interpret model prose. A preliminary matrix evaluation may identify a viable but unresolved path; execution must wait until the full request is supported and necessary resolution is complete. Do not prescribe a second orchestration engine or a rigid resolve-before-every-evaluation sequence.

Observed on `feat/keyword-resolution`: `server/services/search/matrix.ts` currently evaluates only `multi`, `movie`, and `tv` title paths. It checks media scope, optional year support, and a required title for each known path. It has no keyword or Discover support. This is current application capability, not an inventory of every TMDb capability.

A future Discover path must not inherit `title_required` merely because the first implemented paths are title searches. Conversely, Discover must not replace free-text title matching or silently discard a requested title. Verify the complete criterion combination and media scope, not just a `supportsKeywords` flag. Unsupported combinations must remain blocked or receive an explicitly agreed resolution; no implicit merging, local filtering, or criterion omission.

The integration investigation must record endpoint-specific support and evidence for title search, Discover Movie, and Discover TV where relevant. Distinguish provider capability, application policy, and implemented support. Do not assume movie/TV parity. Genre/keyword combinations, date meaning, and multiple-keyword semantics need their own verification.

## Phase A — Bounded Resolution Experiment

The initial experiment ends with terminal proposals and diagnostics. It does not return film results. Its purpose is to test the resolver before commissioning a result-search comparison.

Included:
- Server-side keyword lookup for an operator-supplied query such as `dark`.
- Validated complete paging for the range reported by the first response, deduplication, and visible completeness diagnostics.
- Temporary candidates isolated from confirmed search criteria.
- Full request, specified preference, explicitly identified context, and complete candidate input for independently versioned selection instructions.
- Validated proposals, repeated context comparisons, and distinct technical/no-match/clarification outcomes.

Excluded from Phase A:
- Discover or title-result execution, automatic criteria acceptance, and changes to the existing title flow/matrix.
- UI, trending integration, movie/TV result merging, and automatic keyword-query generation.
- A general session/pending framework, full keyword catalog, vector database, or production approval.

Example context may identify movie, science-fiction, and optionally release year 2025. Only the atmospheric preference is being resolved. Supplied experiment context must not be described as implemented or application-confirmed genre support. Context must not add unrequested settings, themes, periods, or plots. Release year is not story setting.

### Provider Collection

1. Validate operator input and fetch page 1 of `/search/keyword` server-side.
2. Validate the response and freeze its expected page range.
3. Fetch remaining expected pages with controlled scheduling; validate returned page identity and metadata.
4. Deduplicate candidates by ID and finalize a complete set, or expose a failed/incomplete result.
5. Explicitly invoke selection against that set and display the validated proposal. Never automatically execute a film search.

Use Zod contracts at external boundaries, derive types, and reuse existing credential/transport boundaries. Specify trimming, numeric bounds, unknown fields, empty-response rules, and consistency behavior after obtaining adequate provider evidence.

No arbitrary fixed page cap is approved. Timeouts, rate limits, provider restrictions, and resource budgets may stop an operation but must produce visible incompleteness, not silent truncation or selection from a partial set. Empty results must terminate without nonexistent page requests. Expected-page collection does not prove a transactional provider snapshot or coverage of every synonym.

Proposals still requiring agreement: sequential requests; treating changing totals or conflicting names for one ID as incomplete; deduplicating identical ID/name pairs; at most two additional per-page attempts for HTTP 429 with valid Retry-After or bounded backoff. Define wait bounds and overall budgets before implementation. No indefinite retries or automatic retry of an entire user action.

### Temporary State and Minimal Experiment Harness

Track only what is needed: query, candidate-set identity, collection status, expected/loaded pages, reported totals, unique candidates, and diagnostics. Define ownership, cleanup, reset, expiry, and limits for the selected harness. New collection/reset/expiry invalidates previous bindings; late provider or model responses cannot overwrite newer state. Repeated selection may reuse a complete current set.

The earlier T1 proposal used a separate HTTP terminal client, endpoint, dedicated cookie, and 30-minute process-local session. This is an option under reassessment, not the selected architecture. Isolation from confirmed criteria does not by itself justify a second session subsystem. T1 must choose the smallest viable server-side harness and explain why each transport/state mechanism is necessary. Keep credentials server-side; no generic store/framework or speculative files.

If HTTP is selected, the provisional route is `POST /api/experiments/keyword-resolution` with `collect`, `select`, and `reset`. Bind select to the session's `candidateSetId`; define request/response limits, safe errors, no-store, ownership, lifetime, capacity, and stale-response checks. These are experiment operations, not replacements for shared submit/clarify/execute. If a simpler approved harness is selected, revise the file/test scope before writing code.

### Model Contract and Instructions

Use dedicated versioned instructions, provisionally `src/lib/parser/keyword-selection-instructions.ts`, through suitable shared generation transport. Keep existing `src/lib/parser/instructions.ts` and title proposal behavior unchanged in Phase A. Static import does not imply sending instructions to the model; dynamic loading is not required for prompt isolation.

Keep trusted instructions separate from untrusted request text, context, provider names, and model output. No credentials enter model input. JSON formatting and prompt wording are not security boundaries.

The model proposes only candidate IDs supplied for the current invocation and may report no match or clarification. Proposed exclusive output variants, not yet approved:

```ts
{ status: 'selected', keywordIds: number[], reason: string }
{ status: 'no_match', reason: string }
{ status: 'needs_clarification', question: string }
```

Proposed selection size: one to three unique IDs. Agree exact bounds and strict status consistency; application code checks membership, duplicates, and current-set binding after structural validation. Resolve display names from validated candidates, not model text. Invalid output is a failure, not permission to drop the preference. Self-reported confidence is not acceptance evidence. Request concise explanations, not private reasoning.

Multiple IDs do not define AND/OR filter semantics. A clarification in Phase A is display-only; it does not create a general pending flow. Later interactive clarification must use shared flow bindings rather than bypass them.

Supply the complete candidate list or report input/model-capacity limitations. Never silently truncate. Agree input limits, output allowance, timeout, and evidence format. No model-capacity or semantic-reliability claim is established yet.

### Terminal and Evaluation

Display the query, completeness, candidate count, context supplied, instruction version, selected names/IDs, and outcome. Distinguish transport failures, invalid output, incomplete collection, no match, and clarification. Keep operational logs free of conversations, raw errors, cookies, and secrets; persist only agreed synthetic/sanitized evidence.

Compare the same complete set with and without relevant context. Include misleading lexical matches, ambiguous preferences, no-match cases, invalid IDs, stale responses, and repeated real-model trials. `dark future`, `dark comedy`, or `dark fantasy` must not be accepted merely from lexical overlap or science-fiction context.

Separate deterministic application-boundary tests, real-model semantic trials, and adversarial model tests. Success in one does not establish success in the others or production readiness.

## Phase B — Conditional Search-Utility Investigation

This follow-up requires separate scope and execution approval after Phase A review. It is necessary evidence for the product goal, not part of the currently approved terminal-only experiment.

Verify appropriate Discover endpoint parameters and compare an agreed baseline, such as science-fiction films, against the same request with selected keyword constraints. Hold other options constant and record exact sanitized requests, date meaning, keyword combination semantics, HTTP status, result metadata, and representative films.

Define relevance assessment before running the comparison. Evaluate whether the requested atmosphere is represented and whether keywords introduce unwanted genre/setting restrictions or remove relevant films. Counts alone do not measure quality. A plausible keyword selection does not establish a useful filter. Decide whether the preference can be a hard filter, requires another agreed treatment, or cannot be supported faithfully; never silently ignore it or broaden the request.

## Phase C — Conditional Shared-Search Integration

Only commission integration if evidence justifies it. Extend shared interpretation/criteria, resolver contracts, matrix, flow, and adapters as a concrete vertical slice; do not turn the experiment route into a second permanent search system.

The integration design must address:
- One shared intent/criteria state, distinguishing requested preferences, resolution status, and accepted IDs without a second search object owned by the resolver.
- Verified endpoint coverage of all requested criteria and media scope, including optional year meaning and unsupported combinations.
- Appropriate clarification/rejection instead of unchecked reuse of the current media-type fallback.
- Current request/revision/question bindings, stale-result rejection, and execution reservation in the shared flow.
- Unambiguous propagation of the evaluated path to the matching adapter; the architecture currently documents this as an open boundary.
- Criterion preservation and atomicity/partial-acceptance decisions where changes are coupled; do not assume general partial acceptance is already implemented.
- Regression tests protecting existing title behavior and the absence of search execution while required resolution or clarification remains open.
- Removal, retention, or explicit isolation of experiment-only infrastructure after integration.

## Tasks and Acceptance

All tasks are open. T1 has inspection evidence but is not complete. Existing identifiers T1–T7 are retained and refined; T8–T9 describe conditional follow-up, not authorization. Agree scope before implementation and obtain approval for each repository write.

- [ ] T1 — Complete evidence and choose the minimal experiment. Preserve the inspection findings below; resolve or explicitly defer the keyword contract evidence gap. Record current matrix limits and the resolver/matrix/flow boundaries. Choose the smallest justified harness, operational limits, output contract, and concrete file/test scope. Do not assume an endpoint or cookie store is mandatory. Acceptance: evidence/proposals/decisions are distinguished, no implementation status is overstated, and Phase A scope is agreed.
- [ ] T2 — Define Phase A boundary contracts. Add only needed Zod contracts and derived types. Test meaningful valid/empty/malformed/inconsistent cases at consuming boundaries, not Zod primitives. Acceptance: keyword proposals cannot become criteria acceptance, endpoint selection, or execution permission.
- [ ] T3 — Implement verified paging and temporary state in the chosen harness. Acceptance: all expected pages or visible incompleteness, deterministic deduplication/conflict behavior, bounded retry/resource outcomes, cleanup/reset/expiry where applicable, and stale-result rejection. No silent reuse or truncation.
- [ ] T4 — Implement bounded keyword selection with independent instructions and shared generation transport. Acceptance: full request/context/candidates, validated IDs and status consistency, distinct failures/no-match/clarification, no title-parser changes or model-driven execution. Add shared-boundary regression coverage where transport changes are necessary.
- [ ] T5 — Expose explicit terminal actions and diagnostics using only justified infrastructure. Acceptance: repeated comparisons can reuse current candidates; no film-result call or confirmed-criteria mutation; selected HTTP boundaries, if any, have ownership/validation/no-store tests.
- [ ] T6 — Evaluate resolution quality and controlled boundaries. Record synthetic contextual comparisons, repeated actual-model trials, and separately scoped adversarial attempts with observed outcomes, model/provider, instruction version, and code reference. Acceptance: no conflation of structural validity, semantic quality, and security evidence.
- [ ] T7 — Review Phase A and gate follow-up. Acceptance: explicitly stop, revise, or propose T8; record semantic failures, harness cost, and remaining limitations. Resolution success alone is not acceptance of the product goal. Automatic query generation is separately commissioned if needed.
- [ ] T8 — Conditionally verify result-search applicability and utility. Requires separate approval. Record endpoint-by-endpoint capability evidence and run the agreed Phase B comparison, including complete criterion combinations and representative film relevance. Acceptance: supported/unsupported cases, combination semantics, and hard-filter limitations are explicit; no shared-search integration is implied.
- [ ] T9 — Conditionally design and implement the shared vertical slice. Requires separate approval and adequate T8 evidence. Acceptance: shared criteria/interpretation, resolver, matrix blockers, flow bindings/reservation, adapter mapping, and targeted regressions work together; title-only requirements do not block valid non-title paths, and no requested criterion is silently dropped. Address documented architecture boundaries and experiment cleanup; no second parser/router/session architecture by default.

## T1 Inspection and Evidence Record — 25 November 2026

The assistant performed targeted read-only inspection on `feat/keyword-resolution` after concept commit `c1134438cc22e4e2a4186806e8d3e50ca084c78e`; findings were recorded in `7faacb3`. This is not an exhaustive repository audit or runtime verification. The subsequent architecture/matrix review refines the proposals above; it does not complete T1.

| Inspected area | Observed behavior and implication |
| --- | --- |
| `server/services/tmdb/http.ts` | Fixed TMDb destination, Bearer authentication, `get(path, query)`, 10-second timeout, automatic retries disabled. Reuse transport. Redirect rejection is the adapter's duty; the search handler sets `redirect: 'error'`. |
| Provider errors | Transport replaces failures with `UPSTREAM_FAILED`; current caller cannot distinguish 429 or obtain Retry-After. Targeted retries require sanitized metadata, not raw headers/errors. `server/services/tmdb/errors.ts` owns safe error mapping. |
| Provider schemas | Separate title/detail/trending/runtime/search contracts exist; no keyword-specific schema was present in the inspected directory. Add a verified contract, not a reused title payload. |
| `server/services/search/llm.ts` | `generateLlmText()` is separate from title-specific `parseSearchProposal()`. Generation uses 256 output tokens, zero retries, and no explicit timeout in the inspected SDK call. Preserve title defaults when introducing necessary keyword limits. |
| `scripts/search.mjs` | HTTP client for `/api/search`, explicit session-cookie forwarding, response validation, no server imports. Keep credentials server-side and avoid adding a second rule matrix in presentation. |
| `server/utils/search-session.ts` | SearchState-coupled process-local Map, 30-minute inactivity lifetime, capacity 1,000, cookie path `/api/search`. Not a generic experiment store; isolation alone does not justify duplicating it. |
| `server/services/search/matrix.ts` | Only title paths `multi`, `movie`, `tv`; title required for each, exact media scope, optional-year support. Keyword/genre/Discover coverage and non-title path rules are not implemented. |

Also inspected: `server/api/search/index.post.ts`, `server/utils/tmdb.ts`, representative provider schemas, `tests/unit/services/llm.spec.ts`, `tests/unit/services/tmdb-layers.spec.ts`, and the architecture/development/typing/testing documents. Existing proposal tests inject generation; they do not prove live model transport behavior.

### Provider Evidence Limits

Verification target: `GET /3/search/keyword`, text query and pagination, response fields `page`, `results`, `total_pages`, `total_results`, and candidate `id`/`name`. Contextual genre/media/year are not established keyword-endpoint parameters. The earlier reference extraction did not expose a usable contract, markdown fetch failed, and the OpenAPI search excerpt was truncated. No complete endpoint excerpt or independent live request was captured in T1; obtain adequate evidence before finalizing schemas.

Official references: [Keyword](https://developer.themoviedb.org/reference/search-keyword), [OpenAPI](https://developer.themoviedb.org/openapi/tmdb-api.json), [rate limiting](https://developer.themoviedb.org/docs/rate-limiting), [errors](https://developer.themoviedb.org/docs/errors), [Discover Movie](https://developer.themoviedb.org/reference/discover-movie), and [Discover TV](https://developer.themoviedb.org/reference/discover-tv). General documentation reports HTTP 429 and page values up to 500; keyword-specific boundary behavior remains unverified. No fixed request-rate allowance is assumed.

The user-supplied `dark` first page contained 20 entries and reported seven pages/129 results, including `dark` ID `259094`. HTTP status, exact original request options, remaining pages, current counts, and suitability are not independently established. See the linked example instead of treating this as a complete fixture or hard-coding its counts.

No assistant-run live TMDb request, real-model trial, project test, lint, typecheck, coverage run, or runtime concurrency check has been completed for this concept. No production or security approval is implied.

### Provisional Phase A File and Test Scope

These are candidate locations, not mandatory files or approved writes. Finalize after the T1 harness decision; omit unnecessary modules.

| Candidate location | Purpose |
| --- | --- |
| `src/lib/schemas/tmdb-keyword.ts` | Verified provider input/response contracts |
| `src/lib/schemas/keyword-resolution.ts` | Necessary selection and, only if selected, HTTP contracts |
| `src/lib/parser/keyword-selection-instructions.ts` | Independent resolver instructions/version |
| `server/services/tmdb/keyword-search.ts` | Collection, validation, consistency, deduplication |
| `server/services/search/keyword-resolution.ts` | Bounded selection, context, and membership validation |
| `server/utils/keyword-experiment-session.ts` | Only if justified by the chosen harness |
| `server/api/experiments/keyword-resolution.post.ts` | Only if HTTP transport is selected |
| `scripts/keyword-resolution.mjs` | Terminal experiment entry, exact transport to be agreed |

Potential shared changes: sanitized retry metadata in TMDb transport/errors and necessary generation limits in the LLM module, with focused regressions and preserved title defaults. Phase A leaves existing title instructions/contracts/matrix/flow/session/client unchanged. Phase C will need its own agreed file scope; this temporary preservation rule is not a permanent prohibition on shared integration.

Proposed tests:
- `tests/unit/services/keyword-search.spec.ts`: page identity/range, empty and invalid responses, metadata changes, duplicate/conflicting IDs, partial failures, and bounded retries using injected transport/time dependencies.
- `tests/unit/services/keyword-resolution.spec.ts`: fixed-instruction/data separation, complete candidates, invalid JSON/IDs/status, and input preservation using controlled model output.
- If HTTP is chosen, `tests/integration/keyword-resolution/keyword-http.spec.ts`: real isolated H3 HTTP with controlled outbound boundaries, ownership, lifecycle, stale results, complete-set gating, safe errors, and no-store. Not a live Nuxt or browser test.
- Extend existing shared transport/LLM tests for changed guarantees. Do not duplicate entire schema matrices or invent generic infrastructure. Add concrete matrix/flow/adapter regressions only with the approved integration slice.

T1 exit: adequate API evidence or explicitly accepted deferral, agreed minimal harness/contracts/operational bounds, and approved Phase A implementation/test scope. All later phases retain their separate gates.
