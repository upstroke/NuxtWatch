# Task: Search Foundation

Branch `refactor/search-foundation`. Prepares shared search for descriptive criteria without adding a new search path: parser instructions, model generation, locale and unsupported-reason codes. Genre (Discover) and keyword resolution follow in their own branches.

## Decisions

- Title search keeps the search endpoints; Discover is added later for descriptive criteria. With `all`, the application asks for movie or TV; movie and TV lists are not merged.
- Parser instructions are split into a base module and criterion modules (title now; genre and keyword later), composed by the application.
- The title spelling-correction rule is removed; TMDb title search is fuzzy and the rule required catalog knowledge the instructions forbid.
- Real-model evaluation is a scripted live audit with synthetic cases; results go into the verification log, not into `pnpm test`.
- Locale: `NUXT_PUBLIC_DEFAULT_LOCALE` (default `en`) replaces `NUXT_APP_DEFAULT_LOCALE`. Application texts use the locale; model clarification messages use the user's language.
- `unsupported` returns a reason code instead of free text. Codes: `year_range`, `people`, `unsupported_criterion`, `other`. The application renders the text from the catalog; `other` shows a generic text.
- `NUXT_LLM_API_KEY` is read and sent when set.

## Tasks

### F1 — Documentation decisions

Search concept (descriptive search, language and locale, next path), keyword concept, API analysis, this task file, `.gitignore` entry for local audit scripts. `docs/ideas/translation-catalog.md` is merged into the search concept and removed by the user (`git rm`).

Acceptance: decisions are in the reference documents; no code changed.

### F2 — Parser evaluation script

`scripts/parser-eval.mjs` with synthetic cases in `tests/fixtures/parser-eval-cases.json`. Calls the configured model through the application's parser path, compares each result with the expected proposal and reports PASSED, FAILED or BLOCKED per case. Cases cover: title only; title and year; explicit movie / TV / both; preserved media type on a new title; correction of one field; year removal; explicit fresh search; ambiguous continuation (clarification); missing title (clarification); year range, people and other unsupported requests; English input; injection-like text inside a title.

Acceptance: baseline results for instructions 1.5.3 are recorded before F3 starts. No credentials, cookies or real conversations are stored.

Guarantee and boundary: semantic behavior of the real model (live audit). Not covered by unit tests.

### F3 — Restructure parser instructions

Split into `base` (trust boundary, input fields, general rules, output contract) and `title` (title, media type and year rules, title examples); the clarification module merges its field descriptions into `base`. Consolidate the media-type rules, remove internal jargon and the stale heading, remove the keyword prohibition from the shared output rules, add examples for `needs_clarification`, `unsupported`, single-field correction, `year: null`, empty changes and English input. Version 2.0.0.

Acceptance: no F2 case regresses against the baseline. A unit test checks module composition and that user data never enters the instructions.

Existing coverage: `tests/unit/services/llm.spec.ts` (proposal parsing with controlled output). Gap: composition.

### F4 — Generation settings

Structured output with the proposal JSON schema where the provider supports it; otherwise strip a surrounding Markdown code fence before parsing. `temperature: 0`. Explicit timeout.

Acceptance: fenced output is accepted; malformed or schema-invalid output remains an error with the existing HTTP mapping. Focused regression tests in `llm.spec.ts`.

### F5 — LLM API key

Add `NUXT_LLM_API_KEY` to `runtimeConfig.llm`, the runtime schema and the client.

Acceptance: a configured key is sent as bearer token; without a key, behavior is unchanged. Key never logged or exposed to the client.

### F6 — Locale

`NUXT_PUBLIC_DEFAULT_LOCALE` → `runtimeConfig.public.defaultLocale`, validated. Map the locale to the TMDb `language` parameter for title search and trending (replacing the fixed `de-DE`). English default texts in `texts.ts`.

Acceptance: adapter tests assert the `language` parameter; clarification texts come from the catalog in the configured locale.

### F7 — Unsupported reason codes

Proposal schema: `unsupported` carries `reason` instead of `message`. Instructions, flow, texts, HTTP response and terminal client updated.

Acceptance: no free model text is shown for unsupported requests; a flow test per code; HTTP contract test updated.

### F8 — Completion

Checks from [Testing](../../testing.md), verification log from the [template](../../verification/TEMPLATE.md), README sections "Current status", "Known issues", "Next steps", lasting rules moved into reference documents, this folder deleted.
