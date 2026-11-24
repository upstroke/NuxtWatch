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
