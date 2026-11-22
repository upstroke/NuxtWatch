# Testing

NuxtWatch uses Vitest for unit and controlled integration tests, including isolated H3 HTTP integrations. Playwright covers HTTP requests against a running Nuxt server and future browser end-to-end tests. Classify a test by the boundary it actually exercises, not merely by the runner.

## Search architecture: historical exception and completion

On 21 November 2026, automated test work was deferred for exploratory search-architecture slices. Acceptance initially used code review and documented terminal walkthroughs, with typecheck and lint recorded separately. That was a scoped, temporary decision, not a permanent project-wide test policy.

Subsequently, specific title-adapter, shared-flow and HTTP/session test blocks were separately agreed and approved. The first shared-search/title slice is closed in its agreed scope. On 22 November, the user confirmed passing tests, lint and typecheck, then coverage above 80%; the reviewed local live-audit report recorded eight passed, zero failed and zero blocked cases. Attribution, commits, structure and limits are summarized in the [search concept](sucharchitektur-konzept.md), which links the fixed historical task record. No exact coverage metric, percentage or test count was supplied for the project checks.

The old exploratory deferral is no longer a blanket instruction to skip tests for the completed slice. It does not authorize broad test migrations or additional work either. Agree any new scoped exception explicitly and record its duration, permitted changes and missing evidence in the relevant task.

Do not delete existing tests wholesale, hide failures through exclusions/configuration, or add unnecessary production compatibility layers. Investigate incompatibilities and agree consequential test changes. Historical retired identifiers remain retired; successful new tests do not retroactively turn older failed or blocked audits into passes.

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm test:e2e
pnpm lint
pnpm typecheck
```

Tests, coverage, lint and typecheck are different checks. Lint/typecheck do not prove behavior; coverage is not proof of functional completeness or security. A documented command is not evidence that it ran. Record the actual result, code reference and who executed it; do not transfer historical success to later behavioral changes.

## When and what to test

- Define observable acceptance criteria before implementation. For new features, first build a working end-to-end slice, then close meaningful automated test gaps before release. Test-driven development is not mandatory. Before changing existing behavior that must be preserved, add a focused regression test if none protects it, unless a scoped exception is explicitly agreed.
- Organize tests by behavior and boundary, not by task or schema. Before adding a test, identify the concrete failure that existing tests would miss. Reuse, extend or consolidate existing tests when they protect the same guarantee.
- Use the smallest scope that reliably detects the relevant failure. Overlap in exercised code is fine when assertions protect different guarantees; do not repeat a full input matrix at several levels. Prefer observable outcomes over implementation details or non-contractual wording. For parser prompts, verify separation of fixed instructions and user input rather than exact wording unless contractual.
- Do not retest Zod primitives or require a dedicated test per schema. Test important HTTP and LLM contracts where validation is used. Add a focused test for a consequential project-specific default, normalization or cross-field rule if otherwise unprotected. See [Typing](typing.md).
- A missing questionId is rejected at the HTTP boundary; a stale revision is rejected by the flow. These are different guarantees, not reasons for duplicate standalone schema tests.
- Record guarantee, boundary, existing coverage and meaningful gaps in the active task. A deferred plan or list of remaining limits does not authorize implementation.

## Boundaries and locations

| Scope                                   | Location                             | Runner     | Actual boundary                                                                                     |
| --------------------------------------- | ------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| Unit                                    | `tests/unit`                         | Vitest     | Cohesive validation, service, mapper, parameter, error or utility behavior                          |
| Controlled TMDb integration             | `tests/integration/tmdb` when needed | Vitest     | Real internal flow with controlled outbound transport; directory convention, not an inventory claim |
| Search handler/session HTTP integration | `tests/integration/search`           | Vitest     | Real HTTP requests to an isolated H3 server mounting the production handler and session store       |
| Running Nuxt HTTP integration           | `tests/integration/http`             | Playwright | Requests against a running Nuxt server                                                              |
| Browser end-to-end                      | `tests/e2e` when agreed              | Playwright | Browser journeys, rendering and browser-enforced behavior; no general expansion authorized          |

- Keep `src/lib` and `server/services` framework-free. H3 helpers belong in `server/utils`, thin Nitro handlers in `server/api`: validate, delegate, map errors, respond.
- Inject external transports. Unit tests do not access the real network. Controlled integrations mock external model generation or outbound TMDb transport, not internal application modules. Never mock the module under test. Isolated HTTP tests use actual loopback HTTP, not live external providers.
- The search HTTP harness supplies Nuxt-autoimported H3 helpers with their actual H3 implementations and controls runtime configuration. It does not verify Nuxt startup, Nitro route discovery or production middleware. See [search integration details](../tests/integration/search/README.md).
- Explicitly resent cookie values verify session ownership, not browser enforcement of SameSite, HttpOnly, Secure or cookie ordering. Header assertions and browser-policy checks are different evidence.
- Reusable deterministic data belongs in `tests/fixtures`, shared transport/Nitro doubles in `tests/mocks`. Do not add generic test infrastructure without concrete reuse.

## Current targeted search guarantees

- `tests/unit/services/title-search.spec.ts`: endpoint/year mapping, cards, direct and Multi/person totals, absent or implausible metadata, isolated count failures and empty pages.
- `tests/unit/services/search-flow.spec.ts`: actual flow/matrix/proposal validation/adapter with controlled outer boundaries; criteria preservation/edits, clarification, execute, bindings, reservation and explicit retry after failure.
- `tests/integration/search/search-http.spec.ts`: HTTP validation/serialization, cookie-bound ownership, independent clients, reset, conflicts, response contracts and no-store.

These blocks are complementary. A controlled failure test does not establish that the same real provider failure was reproduced live. A successful local model example does not establish general semantic reliability.

## Live audits, concurrency and security

Live audits exercise a running application with real configured providers and must be explicitly scoped. Use synthetic inputs and independent session contexts. Do not persist credentials, cookies, raw errors or real user conversations. Distinguish PASSED, FAILED and BLOCKED; blocked or unreproduced cases are not passes. Do not imply that a locally supplied script or report is versioned when it is not.

Concurrent client dispatch alone does not prove internal server overlap or an exact provider call count. Deterministic gates can test reservation on a controlled boundary; delayed-response, session-lifetime, browser and multi-instance checks need their own setup and evidence. Do not claim a full race audit from normal walkthroughs.

Prompt-injection testing remains a separate security concern, not an outcome of the completed functional search tests. Use controlled model outputs to test application boundaries even when the model misbehaves, and separately agreed adversarial real-model inputs to assess model behavior. Schema-valid output may still violate intent; prompt wording alone is not a defense guarantee. Record specific attempted attacks and observed effects, not a blanket claim of injection resistance.

## Identifiers and coverage

- Begin each unit test case with a coverage-intent comment: `// Statement coverage:` for an execution path or `// Branch coverage:` for a conditional/error/fallback/boundary. Vitest controlled integrations use the same convention; HTTP Playwright tests do not require these comments.
- Use stable scenario identifiers for integrations. Existing TMDb cases use `TMDB-INT-…`; the search HTTP suite uses `SEARCH-HTTP-001` through `SEARCH-HTTP-006`, with descriptive parameterized variants in its validation group. Keep variant titles distinct and never reuse retired identifiers for unrelated scenarios.
- Browser journeys use identifiers such as `SEARCH-001` linked to acceptance criteria, for example `SEARCH-001-AC1`. Do not relabel handler-only checks as browser journeys.
- V8 coverage applies to `src/lib/**` and `server/**`. The global statement threshold is 80%; `vitest.config.ts` is authoritative. Thresholds are minimums, not per-file goals. Do not change thresholds or exclusions to conceal missing coverage. A broad user report of coverage above 80% does not identify an exact metric or percentage.

## Import aliases

- `@lib` → `src/lib`
- `@server` → `server`
- `@tests` → `tests`
- `@test-mocks` → `tests/mocks`

Do not use Nuxt's default `@` or `~` for shared application code; they resolve to Nuxt's application source directory.
