# Task 001 — First title search from chat

## Goal

Turn a chat message into a validated shared search object, send it to the internal search API, and return TMDb results as title cards. A follow-up can refine the criteria without repeating the title.

## Starting point

Work from the current `main` in NuxtWatch. The cleanup is complete; the NextWatch `v0.0.1` Spike is historical context, and its work packages are not the current roadmap. Read [README](../../README.md), [AGENTS](../../AGENTS.md), and [TMDb search examples](../tmdb-search-examples.md).

## Reference flow

| User message | Search criteria | Verified TMDb mapping |
| --- | --- | --- |
| “Find The Matrix” | Set the title. No media type or year is required. | `/search/multi` with `query=The Matrix`; map only movie and TV hits to title cards. |
| “I mean the 1999 movie” | Keep the title; add movie as the media type and 1999 as the release year. | `/search/movie` with `query=The Matrix` and `primary_release_year=1999`. |

The TMDb requests are verified; the end-to-end chat flow is not. Multiple title matches are valid results, not a reason to ask for clarification.

## Phase 1 — Inspect and agree

- [x] Review the parser output schema and instructions, and inventory the internal search route, input schema, and tests. The [Phase 1 inventory](001-title-search-phase-1.md) records what can be reused and what is missing. The earlier LLM response was not located; the live response below is available for the first title test.
- [x] Agree on the first implementation scope and test plan. Validate the title proposal into the shared search object and send only those criteria as JSON to `POST /api/search/title`. Keep the TMDb Multi Search service and its title-card mapper side by side. See the [agreed layout and verification plan](001-title-search-phase-1.md#agreed-layout-and-contract).

Phase 1 records the design decision. Phase 2 tracks implementation and verification.

### Findings — chat schema usage

The `git grep` check on `origin/feat/001-title-search` covered `app`, `server`, `src`, and `tests`. Matches for `ChatIntentSchema`, `ChatIntent`, and `baseRevision` were limited to `src/lib/schemas/chat.ts` and `tests/unit/schemas/chat.spec.ts`. `src/lib/schemas/index.ts` re-exports the chat schema, but no application use was found in the checked paths.

`ChatIntentSchema` requires `baseRevision`, while `src/lib/parser/instructions.ts` tells the model not to emit revisions. The schema is therefore not a direct match for the raw model response. Agreed first scope: leave `chat.ts` unchanged, validate a proposal to set a non-empty title, and use it to build the search object (for example, `{ title: 'The Matrix' }`). Reject invalid or unsupported proposals without changing the search state or dispatching a search.

`tests/unit/parser/instructions.spec.ts` checks only the instructions version.

### Findings — live OpenRouter title test

- Input: `Finde The Matrix`
- SDK: `@openrouter/sdk@1.5.108`; requested model: `openrouter/free`; reported model: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.
- Observed model response: `{"status":"ready","changes":[{"field":"title","operation":"set","value":"The Matrix"}]}`
- Result: the response passed the test's strict validation for a single non-empty title change and produced `{"title":"The Matrix"}`.

The manual test used a short title-only prompt and an inline validation schema. It did not use `instructions.ts` or `ChatIntentSchema`, call the internal search API or TMDb, or verify the follow-up turn. The observed response can be used inline in an automated test without a network call or a separate fixture file.

## Phase 2 — Implement and verify

- [x] Verify the title-only path in separate adapter and handler tests. The documented model response produces one `POST /api/search/title` with `{"title":"The Matrix"}` as its body. With mocked TMDb transport, the handler calls `/search/multi` and maps movie and TV hits to title cards, excluding person hits.
- [x] Verify that invalid proposals and a synthetic clarification-status proposal do not dispatch a search. The adapter returns `not-dispatched` without calling the internal API and does not modify search state. The route separately rejects invalid request bodies before calling TMDb.
- [ ] Verify “I mean the 1999 movie” next. Apply a second validated proposal and check that it retains the title, adds media type and year, and results in `/search/movie` with `primary_release_year=1999`.
- [ ] Change `src/lib/parser/instructions.ts` only if the agreed contract or a parser test shows a concrete need.

### Verification status

Tests, coverage, ESLint, and typecheck were reported green through `388e872` on `feat/001-title-search`, after aligning the tests with [the testing guide](../testing.md). The adapter unit test in `tests/unit/utils/dispatch-title-search-to-api.spec.ts` mocks `$fetch` and includes coverage-intent comments. The Vitest integration test in `tests/integration/tmdb/title-search.spec.ts` (`TMDB-INT-021`–`TMDB-INT-026`) calls the handler directly with mocked TMDb transport; the superseded unit test was removed.

This verifies the two boundaries separately, not a live end-to-end chat flow. Phase 2 remains open: the follow-up turn and UI integration are not verified. Ask only when missing or ambiguous information blocks the request as stated; do not silently drop explicit criteria.

## Open decision

Before connecting the UI, agree whether it sends the validated search object immediately or only after the filter review and “Search now” described in the [wizard draft](../clarificaton-wizzard-flow.md). Search readiness is not search execution. This decision does not block the search-object or API tests.

## Out of scope

Discovery, person or keyword resolution, a general pending framework or new store, cross-endpoint result merging, and the full clarification wizard.
