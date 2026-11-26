# Verification log: title vertical slice (22 November 2026)

Time-bound evidence for the completed title slice at `d6e071c`. This is a log, not a description of the current state: later changes are not covered. The current rules live in the [search concept](../search-architecture-concept.md).

## Evidence

As of November 22, 2026; do not carry evidence forward to subsequent behavioral changes.

| Evidence       | Scope and source                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `8172f08`      | Title-adapter tests: endpoints/year, cards, direct/multi totals, metadata, isolated person-count failure, and empty pages; test run confirmed by the user                                                                      |
| `0e0e002`      | Real flow/matrix/proposal validation/adapter with controlled external boundaries: criteria preservation/changes, clarification, execute, bindings, reservations, and explicit retry after failure; tests confirmed by the user |
| `e885a7c`      | Real handler/session through isolated H3 HTTP: validation, cookies, session isolation, reset, conflicts, response contract, no-store; tests confirmed by the user                                                              |
| `d6e071c`      | Lint correction: provider-gate check before execution instead of throwing in finally                                                                                                                                           |
| Project checks | At 18:17 CET, the user confirmed tests, lint, and typecheck, followed by coverage above 80%; no exact percentage, metric, or test count supplied; no project commands run independently by the assistant                       |
| Live HTTP      | User run against localhost:3000, 18:23 CET: eight PASSED, zero FAILED, zero BLOCKED; console output and JSON report reviewed in the conversation                                                                               |

Live cases: new request while a question is open; incorrect request/question ID and revision; duplicate answer; reset with old bindings and cookie; stale execute; repeat after success; two concurrently submitted execute requests; explicit movies-and-TV request with a year. Expected conflicts were observed, and the valid current state remained usable afterward. The parallel case produced one completed/200 and one 409, not proof of internal overlap or provider-call counts. All recorded responses were no-store.

Live report `search-flow-audit-report.json`: 17:23:14.748Z to 17:23:31.397Z; commit value `d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69` supplied by the caller, not verified against the server. The audit script was provided locally only and checked with node --check; the script and raw reports were not committed. The audit checks required fields, not the full shared schema.

The reviewed production search paths had no blocking structure/import/text-assignment findings; a project-wide exhaustive scan was explicitly excluded from the completion scope and was not performed. No comprehensive project-wide test-inventory audit is claimed. The earlier deferral of tests was supplemented by separately agreed targeted blocks; the [testing rules](../testing.md) and [development rules](../../AGENTS.md) continue to apply.

The detailed [historical completion record for Task 01](https://github.com/upstroke/NuxtWatch/blob/5ac52968b8f68acfd2db0f838ac012c127c7357c/docs/tasks/search-architecture/01-shared-search-matrix.md) remains accessible through the fixed commit. It also contains earlier B/R/D evidence and its limitations. R04 free-text select 1 remains a historical failure outside the agreed terminal scope; no implicit fix is claimed. D01/D02 remain historical with their original evidence limitations, not a new full acceptance.
