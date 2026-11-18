# Task 001 — Plan the first title search

## Goal

Plan the smallest title-search flow that lets a user start with a simple request and refine it in a follow-up message without repeating the title. This task defines the first implementation scope; it does not implement the flow.

## Starting point

Use the current `main` branch of NuxtWatch. The NextWatch `v0.0.1` Spike is the historical baseline, and the cleanup is complete. Inspect the remaining code, schemas, and tests before proposing changes. Do not treat old NextWatch work packages as the current roadmap.

Read [README](../../README.md), [AGENTS](../../AGENTS.md), and [TMDb search examples](../tmdb-search-examples.md).

## Reference flow

| User message | Search criteria | Verified TMDb mapping |
| --- | --- | --- |
| “Find The Matrix” | Start with the title. Neither media type nor year is required. | `/search/multi` with `query=The Matrix`; map only movie and TV hits to title cards. |
| “I mean the 1999 movie” | Keep the title and add movie as the media type and 1999 as the release year. | `/search/movie` with `query=The Matrix` and `primary_release_year=1999`. |

The TMDb calls are verified; that does not establish that either chat turn is implemented. Multiple title matches are valid results, not a reason to ask for clarification before searching.

## Deliverable

- Identify the existing files, schemas, and tests that can support the reference flow. Separate what is implemented, what the TMDb examples verify, and what remains undecided.
- Sketch the path from a chat message to a validated shared search object, then to server-side TMDb request mapping and title cards. The LLM proposes changes; the application validates them and retains criteria not changed by the follow-up. Keep provider parameters out of the shared object.
- Ask for clarification only when missing or ambiguous information blocks the request as stated. Do not partially apply a pending change or silently drop an explicit criterion.
- Decide whether explicit confirmation belongs in the first implementation scope. Search readiness is not search execution. The [wizard draft](../clarificaton-wizzard-flow.md) describes a filter review and “Search now”; neither assume nor discard that step without agreement.
- Propose the smallest implementation step and the tests that would verify it. Agree on scope before changing application code.

## Out of scope

Discovery, person or keyword resolution, a general pending framework or new store, cross-endpoint result merging, and implementation of the full clarification wizard.
