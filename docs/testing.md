# Testing

NuxtWatch uses [Vitest](https://vitest.dev/) for unit and integration tests and [Playwright](https://playwright.dev/) for HTTP integration tests and future browser end-to-end tests. The existing suite focuses on TMDb validation, orchestration, mapping, errors, and Nitro routes.

## Commands

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

## When and what to test

- Define observable acceptance criteria before implementation. For new features, first build a working end-to-end slice, then close meaningful automated test gaps before release. Test-driven development is not mandatory. Before changing existing behavior that must be preserved, add a focused regression test if none protects it.
- Organize tests by behavior and boundary, not by task or schema. Before adding a test, identify the concrete failure that existing tests would miss. Reuse, extend, or consolidate existing tests when they protect the same guarantee.
- Use the smallest scope that reliably detects the relevant failure. Overlap in code exercised is fine if the assertions protect different guarantees; do not repeat the same input matrix at several levels. Prefer observable outcomes over implementation details or non-contractual wording. For parser prompts, verify the separation of fixed instructions and user input rather than exact wording unless the wording is contractual.
- Do not retest Zod primitives or require a dedicated test for each schema. Test important HTTP and LLM input contracts where validation is actually used. Add a focused test for a project-specific default, normalization, or cross-field rule if it is consequential and not otherwise covered. See [Typing](typing.md).
- Example: A `clarify` request without `questionId` is rejected at the HTTP boundary without changing criteria. A well-formed request with a stale `revision` is rejected by the search flow. These are different guarantees; neither needs a duplicate standalone schema test.
- For a feature test inventory, record guarantee → test boundary → existing test or gap. Keep feature-specific inventories in the corresponding task documentation.

## Boundaries and locations

| Scope | Location | Runner | Focus |
| --- | --- | --- | --- |
| Unit | `tests/unit` (`schemas`, `services`, `utils`) | Vitest | One cohesive unit: project-specific validation, service, mapper, parameter, error, or utility behavior |
| Controlled integration | `tests/integration/tmdb` for TMDb | Vitest | Route-to-response or service flow with a controlled outbound transport |
| HTTP integration | `tests/integration/http` | Playwright | Real HTTP requests to a running Nuxt server |
| Browser end-to-end | `tests/e2e` | Playwright | User journeys; do not expand browser coverage for now |

- Keep `src/lib` and `server/services` framework-free. Put H3 helpers in `server/utils` and thin Nitro route handlers in `server/api`: validate, delegate, map errors, respond.
- Inject external transports. Unit tests do not access the real network. In controlled integrations, mock the outbound TMDb transport rather than internal modules. Never mock the module under test.
- Keep reusable deterministic data in `tests/fixtures` and shared transport or Nitro-event doubles in `tests/mocks`.

## Identifiers and coverage

- Each unit `it` block starts with `// Statement coverage:` for a verified execution path or `// Branch coverage:` for a conditional path, error branch, fallback, or boundary. HTTP integration tests do not require these comments.
- Give integration tests stable identifiers such as `TMDB-INT-001`. HTTP integration tests must include a `TMDB-INT-…` identifier in the title. Give browser journeys an identifier such as `SEARCH-001` and link each test to its acceptance criterion, for example `SEARCH-001-AC1`. Use distinct identifiers for distinct tests; never reuse retired identifiers.
- V8 coverage applies to `src/lib/**` and `server/**`. The global statement threshold is currently 80%; `vitest.config.ts` is authoritative. Thresholds are minimums, not per-file targets. Use reports to find meaningful gaps, not to justify redundant tests.

## Import aliases

- `@lib` → `src/lib`
- `@server` → `server`
- `@tests` → `tests`
- `@test-mocks` → `tests/mocks`

Do not use Nuxt’s default `@` or `~` aliases for shared application code; they resolve to Nuxt’s application source directory.
