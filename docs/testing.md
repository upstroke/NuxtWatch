# Testing

NuxtWatch uses [Vitest](https://vitest.dev/) for unit and integration tests and [Playwright](https://playwright.dev/) for HTTP integration tests and future browser end-to-end tests. The existing suite focuses on TMDb validation, orchestration, mapping, errors, and Nitro routes.

## Current exception: exploratory search slices

Decision of 21 November 2026: automated testing work is deferred for the current exploratory search-architecture phase, including [Task 01](tasks/search-architecture/01-shared-search-matrix.md). This scoped decision takes precedence over the regression-test-before-change instruction below for these slices; it is not a permanent project-wide abandonment of tests.

- Keep numbered acceptance criteria. Initially assess them through code review and documented manual terminal walkthroughs. Run typecheck and lint as separate technical checks; neither proves functional correctness.
- Do not add, extend, duplicate or refactor automated tests as part of these exploratory slices. Automated test runs are not a required acceptance step in this phase; report them as deferred/not run rather than passed.
- Do not delete existing tests wholesale. Record incompatibilities caused by renamed modules or changed contracts in the active task instead of starting an incidental test migration. Do not hide failures through exclusions, changed configuration or unnecessary production compatibility layers.
- If unchanged tests cause typecheck/lint failures, record the actual failure and cause; do not claim success, silently narrow the check or infer approval to edit tests. Agree any required exception separately.
- A manual walkthrough or code review is not a full concurrency/race-condition verification. Record which behavior was actually reproduced and leave unverified parts open. Exploratory acceptance is not production-release assurance.
- Revisit automation after the architecture stabilises under a separate agreement: inventory existing tests first, map each guarantee to a suitable boundary, reuse/consolidate coverage and avoid repeating a full case matrix across layers.

The remaining sections retain the general policy and conventions for later automated work and unrelated agreed tasks.

## Commands

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

For the current exploratory slices, the planned technical checks are `pnpm typecheck` and `pnpm lint`; the test commands above are documented, not a requirement to run them now.

## When and what to test

- Define observable acceptance criteria before implementation. For new features, first build a working end-to-end slice, then close meaningful automated test gaps before release. Test-driven development is not mandatory. Before changing existing behavior that must be preserved, add a focused regression test if none protects it, except under the scoped exploratory decision above.
- Organize tests by behavior and boundary, not by task or schema. Before adding a test, identify the concrete failure that existing tests would miss. Reuse, extend, or consolidate existing tests when they protect the same guarantee.
- Use the smallest scope that reliably detects the relevant failure. Overlap in code exercised is fine if assertions protect different guarantees; do not repeat the same input matrix at several levels. Prefer observable outcomes over implementation details or non-contractual wording. For parser prompts, verify separation of fixed instructions and user input rather than exact wording unless contractual.
- Do not retest Zod primitives or require a dedicated test per schema. Test important HTTP and LLM input contracts where validation is actually used. Add a focused test for a consequential project-specific default, normalization or cross-field rule if not otherwise covered. See [Typing](typing.md).
- A missing `questionId` is rejected at the HTTP boundary; a stale revision is rejected by the flow. These are different guarantees, not reasons for duplicate standalone schema tests.
- Record guarantee → boundary → existing test or gap in the active task. Deferred plans do not authorise implementation now.

## Boundaries and locations

| Scope                  | Location                                      | Runner     | Focus                                                                      |
| ---------------------- | --------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| Unit                   | `tests/unit` (`schemas`, `services`, `utils`) | Vitest     | Cohesive validation, service, mapper, parameter, error or utility behavior |
| Controlled integration | `tests/integration/tmdb` for TMDb             | Vitest     | Real internal flow with controlled outbound transport                      |
| HTTP integration       | `tests/integration/http`                      | Playwright | HTTP requests to a running Nuxt server                                     |
| Browser end-to-end     | `tests/e2e`                                   | Playwright | User journeys; do not expand browser coverage for now                      |

- Keep `src/lib` and `server/services` framework-free. H3 helpers belong in `server/utils`, thin Nitro handlers in `server/api`: validate, delegate, map errors, respond.
- Inject external transports. Unit tests do not access the real network. Controlled integrations mock outbound TMDb transport, not internal modules. Never mock the module under test.
- Reusable deterministic data belongs in `tests/fixtures`, shared transport/Nitro doubles in `tests/mocks`.

## Identifiers and coverage

- Each unit `it` starts with `// Statement coverage:` for an execution path or `// Branch coverage:` for a conditional/error/fallback/boundary. HTTP integrations do not require these comments.
- Integration tests use stable unique identifiers such as `TMDB-INT-001`; HTTP test titles include `TMDB-INT-…`. Browser journeys use identifiers such as `SEARCH-001` and link to acceptance criteria, e.g. `SEARCH-001-AC1`. Never reuse retired identifiers.
- V8 coverage applies to `src/lib/**` and `server/**`. The global statement threshold is currently 80%; `vitest.config.ts` is authoritative. Thresholds are minimums, not per-file goals. Do not change thresholds/exclusions to mask deferred work; no coverage target or coverage run is required for the exploratory slices.

## Import aliases

- `@lib` → `src/lib`
- `@server` → `server`
- `@tests` → `tests`
- `@test-mocks` → `tests/mocks`

Do not use Nuxt's default `@` or `~` for shared application code; they resolve to Nuxt's application source directory.
