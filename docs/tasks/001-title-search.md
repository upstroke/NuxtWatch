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

- [ ] Review the parser output schema and instructions and identify the relevant internal search route, input schema, and tests. Record what can be reused and what is missing. The earlier LLM response was not located; the live response below is available for the first title test.
- [ ] Agree on the smallest implementation scope and test plan. Define how a validated parser proposal updates the shared search object and what the internal API accepts. The API receives complete search criteria, not raw LLM output or TMDb parameters.

Start here. Do not change the prompt or application code until the scope is agreed.

### Findings — chat schema usage

The `git grep` check on `origin/feat/001-title-search` covered `app`, `server`, `src`, and `tests`. Matches for `ChatIntentSchema`, `ChatIntent`, and `baseRevision` were limited to `src/lib/schemas/chat.ts` and `tests/unit/schemas/chat.spec.ts`. `src/lib/schemas/index.ts` re-exports the chat schema, but no application use was found in the checked paths.

`ChatIntentSchema` requires `baseRevision`, while `src/lib/parser/instructions.ts` tells the model not to emit revisions. The schema is therefore not a direct match for the raw model response. Proposed first scope: leave `chat.ts` unchanged, validate a proposal to set a non-empty title, and use it to build the search object (for example, `{ title: 'The Matrix' }`). Reject invalid or unsupported proposals without changing the search state or dispatching a search.

`tests/unit/parser/instructions.spec.ts` checks only the instructions version.

### Findings — live OpenRouter title test

- Input: `Finde The Matrix`
- SDK: `@openrouter/sdk@1.5.108`; requested model: `openrouter/free`; reported model: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.
- Observed model response: `{"status":"ready","changes":[{"field":"title","operation":"set","value":"The Matrix"}]}`
- Result: the response passed the test's strict validation for a single non-empty title change and produced `{"title":"The Matrix"}`.

The manual test used a short title-only prompt and an inline validation schema. It did not use `instructions.ts` or `ChatIntentSchema`, call the internal search API or TMDb, or verify the follow-up turn. The observed response can be used inline in an automated test without a network call or a separate fixture file.

## Phase 2 — Implement and verify

- [ ] Verify “Find The Matrix” first. Use the observed model response above as an inline test input. Validate it, populate the search object, and pass that object to the internal API. With a mocked TMDb transport, verify the `/search/multi` request and returned title cards.
- [ ] Verify that an invalid proposal or one requiring clarification leaves the existing search object unchanged and does not call the internal search API. Ask only when missing or ambiguous information blocks the request as stated; do not silently drop explicit criteria.
- [ ] Verify “I mean the 1999 movie” next. Apply a second validated proposal and check that it retains the title, adds media type and year, and results in `/search/movie` with `primary_release_year=1999`.
- [ ] Change `src/lib/parser/instructions.ts` only if the agreed contract or a parser test shows a concrete need.

## Open decision

Before connecting the UI, agree whether it sends the validated search object immediately or only after the filter review and “Search now” described in the [wizard draft](../clarificaton-wizzard-flow.md). Search readiness is not search execution. This decision does not block the search-object or API tests.

## Out of scope

Discovery, person or keyword resolution, a general pending framework or new store, cross-endpoint result merging, and the full clarification wizard.
