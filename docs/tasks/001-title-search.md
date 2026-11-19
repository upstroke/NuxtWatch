# Task 001 — First title search from chat

## Goal

Turn a chat message into a validated shared search object, send it to the internal search API, and return TMDb results as title cards. A follow-up can refine the criteria without repeating the title.

## Starting point

Work from the current `main` in NuxtWatch. The cleanup is complete; the NextWatch `v0.0.1` Spike is historical context, and its work packages are not the current roadmap. Read [README](../../README.md), [AGENTS](../../AGENTS.md), and [TMDb search examples](../tmdb-search-examples.md).

## Reference flow

| User message | Search criteria | TMDb mapping |
| --- | --- | --- |
| “Find The Matrix” | Set the title; no media type or year is required. | `/search/multi` with `query=The Matrix`; map movie and TV hits to title cards. |
| “I mean the 1999 movie” | Keep the title; add `movie` and `1999`. | `/search/movie` with `query=The Matrix` and `primary_release_year=1999`. |

Multiple title matches are valid results, not a reason to ask for clarification. The follow-up was verified through the internal API routes, not through the chat UI.

## Phase 1 — Inspect and agree

- [x] Review the parser output schema and instructions and inventory the internal search route, input schema, and tests. See the [Phase 1 inventory](001-title-search-phase-1.md).
- [x] Agree on the first implementation scope and test plan. Validate the title proposal and send only the search criteria as JSON to `POST /api/search/title`. Keep the TMDb Multi Search service and its title-card mapper side by side. See the [agreed layout and contract](001-title-search-phase-1.md#agreed-layout-and-contract).

### Findings — chat schema usage

The `git grep` check on `origin/feat/001-title-search` covered `app`, `server`, `src`, and `tests`. Matches for `ChatIntentSchema`, `ChatIntent`, and `baseRevision` were limited to `src/lib/schemas/chat.ts` and `tests/unit/schemas/chat.spec.ts`. `src/lib/schemas/index.ts` re-exports the chat schema, but no application use was found in the checked paths.

`ChatIntentSchema` requires `baseRevision`, while `src/lib/parser/instructions.ts` tells the model not to emit revisions. The schema is not a direct match for the raw model response. The first scope leaves `chat.ts` unchanged, validates a proposal to set a non-empty title, and uses it to build the search object. Invalid or unsupported proposals do not change search state or dispatch a search. `tests/unit/parser/instructions.spec.ts` checks only the instructions version.

### Findings — live OpenRouter title test

- Input: `Finde The Matrix`.
- SDK: `@openrouter/sdk@1.5.108`; requested model: `openrouter/free`; reported model: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.
- Observed model response: `{"status":"ready","changes":[{"field":"title","operation":"set","value":"The Matrix"}]}`.
- Result: strict single-title validation produced `{"title":"The Matrix"}`.

This manual test used a short title-only prompt and inline validation. It did not use `instructions.ts` or `ChatIntentSchema`, call the internal search API or TMDb, or verify the follow-up.

## Phase 2 — Implement and verify (complete)

Phase 2 covers the internal search and refinement paths only. UI integration is not an acceptance criterion.

- [x] Verify the title-only adapter and handler separately. The validated proposal dispatches one `POST /api/search/title` with `{"title":"The Matrix"}`. With controlled TMDb transport, the handler calls `/search/multi` and maps movie and TV hits, excluding people.
- [x] Verify that invalid proposals and a synthetic clarification-status proposal do not dispatch a search or change state. The route rejects invalid request bodies before calling TMDb.
- [x] Verify the reference follow-up through live OpenRouter and TMDb. Starting with `{"title":"The Matrix","mediaType":"all"}` and no year, “I mean the 1999 movie” kept the title and added `movie` and `1999`. The script passed the full criteria to `/api/search/title`. TMDb returned three movies from 1999, including *The Matrix* (`603`).
- [x] Verify the typed TMDb filters. A live OpenRouter follow-up changed the year from 1999 to 2003 with `movie` already set; the full criteria returned ten movies from 2003. Direct TV requests for *Breaking Bad* returned the main series (`1396`) for 2008 and *Breaking Bad: Original Minisodes* (`337563`) for 2009. The TV requests did not involve OpenRouter.
- [x] Confirm tests, coverage, ESLint, and typecheck. All four were reported green for `dffc9e0` on `feat/001-title-search`.

The follow-up uses dedicated `TITLE_REFINEMENT_INSTRUCTIONS` in `src/lib/parser/refine-title-search.ts`. No change to the shared `src/lib/parser/instructions.ts` was required. Vitest handler tests use controlled external transport per [the testing guide](../testing.md): `TMDB-INT-021`–`026` cover the title route, `TMDB-INT-027`–`030` cover refinement, and `TMDB-INT-031`–`034` cover typed search filters.

### Known limitation

An intermittent OpenRouter `400` was observed during the live follow-up; the internal refinement route returned `502`. A subsequent attempt succeeded, but the upstream cause is unknown. `tests/regression/title-refine-provider-error.spec.ts` (`TMDB-INT-035`) verifies the `502` mapping and the `fetch` phase and upstream status in the server log. It does not fix the upstream failure.

## Deferred work

- Chat UI integration and rendering title cards. Before connecting the UI, decide whether it dispatches immediately or waits for filter review and “Search now” as described in the [wizard draft](../clarificaton-wizzard-flow.md). Search readiness is not search execution.
- TV year refinement through OpenRouter. The existing movie-only refinement returns `unchanged` for TV year corrections; direct TV search with a first-air-year filter is already supported.

## Out of scope

Discovery, person or keyword resolution, a general pending framework or new store, cross-endpoint result merging, and the full clarification wizard.
