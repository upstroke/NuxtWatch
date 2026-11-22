# NuxtWatch – Search Architecture

As of November 22, 2026. Permanent reference for the rules, structure, and extension boundaries of shared search. The initial search/title vertical slice is complete within the agreed scope. Reviewed code reference: `d6e071c`, branch `feat/shared-search-architecture`; subsequent documentation changes do not constitute new functional verification. This is not comprehensive production, race-condition, browser, or model validation.

## Foundations and Working Approach

The starting points are the [TMDb analysis](tmdb-api-analysis.md) and [verified search examples](tmdb-search-examples.md). API capabilities, product decisions, and implemented behavior remain distinct. Title search is the first acceptance case for the shared architecture, not a basis for separate parsers per search path.

Substantiate and implement new search paths individually as vertical slices: verify the API, extend shared criteria and blockers, test the specific flow, and feed findings back into the design. Do not build a complete matrix, rule engine, second routing matrix, storage architecture, or speculative wrappers/files. Reuse shared methods; do not duplicate domain rules across prompts, the matrix, adapters, and interfaces.

## Responsibilities

- LLM: interpret natural language and bound free-text answers and propose criteria changes; proposal validation takes place in the shared LLM module. No state acceptance, endpoint selection, or search execution. LLM `ready` is not authorization to execute.
- Matrix: evaluate concrete paths against the same criteria state for complete coverage and report blockers. No text generation, question binding, or session management.
- Flow: accept validated changes, check whether state is current, determine the next action, bind questions, and reserve execution.
- Adapter: provider parameters, transport, response validation, cards, and totals. No changes to search intent or sessions.
- HTTP/session: external contracts and status mapping; cookie binding, storage, and lifetime, respectively.
- Interfaces: display server-provided questions, options, and results; no second domain-specific search matrix. Candidate resolution is not a result search.

Proposal validation checks the structure, allowed fields, and values of model output. It does not guarantee that a formally permitted change matches the user's actual intent. The application checks executability and state acceptance separately.

## Structure

```text
server/
├── api/search/index.post.ts       # HTTP contracts, runtime, status mapping
├── services/
│   ├── search/
│   │   ├── flow.ts                # Criteria, currency checks, questions, reservations
│   │   ├── matrix.ts              # Capabilities and blockers
│   │   ├── llm.ts                 # Transport, interpretation, proposal validation
│   │   └── texts.ts               # Application, HTTP, and session texts
│   └── tmdb/
│       ├── title-search.ts        # Title parameters, cards, and totals
│       └── errors.ts              # Error codes, statuses, stable English texts
└── utils/search-session.ts       # Cookie, process-local storage, lifetime
src/lib/
├── schemas/search.ts             # Criteria, proposals, questions, actions, responses
└── parser/
    ├── instructions.ts           # Versioned system instructions
    └── clarification-instructions.ts
scripts/search.mjs               # HTTP terminal client, local presentation catalog
```

This covers the search area, not the complete project tree. Additional TMDb transport/mapping modules and runtime/provider/card contracts remain separate. Legacy workflow/coordinator/submission/parser-execution modules were removed from the reviewed search core; legacy chat contracts/export and the spike error alias were cleaned up selectively. No project-wide exhaustive scan is claimed.

## Criteria and Paths

The shared criteria object describes the user's intent, not the endpoint. Currently supported: title, media type, and an optional single year. Confirmed criteria are preserved unless explicitly changed. Prompt 1.5.3 clarifies this preservation rule; model compliance must be evaluated separately.

“Confirmed criteria” means the current criteria state accepted by the application. It implies neither separate user approval of every value nor that the request is already executable.

| Criteria | Behavior |
| --- | --- |
| Title missing | Clarify the title when title search is intended; do not reinterpret other intents |
| Title, `all`, no year | Multi-search; no optional media-type/year question |
| Title, `movie`, optional year | Movie search; year via `primary_release_year` |
| Title, `tv`, optional year | TV search; year via `first_air_date_year` |
| Title, year, `all` | Bound choice of `movie` or `tv`; no result search |

An unspecified type and an explicit request for movies and TV both mean `all`, unless a different confirmed type still applies. Explicitly resetting the type to both media is allowed. With a year, `all` is an intermediate state requiring clarification: preserve title/year, select the type, then execute. Do not guess a medium, remove the year, merge lists, or implement custom year post-filtering. This is a product decision, not a fundamental API limitation.

Multiple results alone do not require clarification. Year ranges are not implemented; do not reduce exact dates without being asked. Movie year means primary release year; TV year means first-air year. Discover does not replace free-form title matching. Add further criteria only with their specific API evidence and vertical slice.

## Actions, State, and Bindings

- `submit`: a new explicit request based on confirmed server-side criteria. It receives a new `requestId` and replaces the previous request before the model call. Existing criteria are initially preserved; previous question and execute bindings are no longer current. If interpretation fails, the previous request is not automatically restored. If no clarification remains necessary, the new request may search directly. No client-side substitute state.
- `clarify`: validate, accept, and reassess a bound answer; never perform a result search. Offered media choices are handled without the LLM; free text uses shared interpretation. The response status `clarified` means the answer was processed. It may include a follow-up question and does not itself authorize execution.
- `execute`: recheck and explicitly execute the current confirmed revision without another LLM interpretation. Required after clarification is complete. An open question or ongoing free-text clarification blocks execution.
- `reset`: remove the previous session association and create a new session context without old criteria.

Validated criteria may already be stored while clarification remains open; an open question does not start a result search. Stored criteria are not automatically executable.

`requestId`, `revision`, and `questionId` bind answers to the request, state, and question. The revision applies within a request and starts at `1` for each new request. It increases when a criteria/clarification result is accepted, not on every HTTP call or execution result. Distinguish separate requests by their request IDs, not by comparing revision numbers.

Late results must not overwrite newer state or reopen old questions. Asynchronous results are checked again for currency before acceptance. External calls do not need to be cancellable for this safeguard. This server-side protection is not comprehensive proof against browser cookie races.

Submit and execute share the reservation before the provider call. An in-progress or successful revision must not be started again; a technical execution failure permits an explicit retry of the same revision. A new submit is a new request and may execute the same criteria again. Neither submit idempotency nor repeated result delivery on repeated execute is guaranteed.

Session storage is process-local: 30 minutes of inactivity, at most 1,000 sessions, neither restart-persistent nor shared across instances. A supplied session cookie whose session no longer exists or has expired produces `410`. Inapplicable question or execute bindings produce `409` when the session is valid and required configuration is available. Because configuration checks sometimes precede binding checks, missing configuration may produce `503` first. Assess access controls and operational limits separately before public operation.

## Cards and Totals

People from multi-search do not become title cards. `include_adult=true`; no adult-based filtering. Locale/pagination are execution options; language is not the provider region. ID and media type jointly identify a card.

The title adapter returns `results` and `totalResults`. Movie/TV use direct provider totals; multi-search subtracts a separate plausible person count using the same search text/adult parameter and the same defaults. An unavailable or implausible count produces `null`; valid cards remain available. Do not fall back to the unfiltered multi-search total. An empty page does not imply a zero total; no backfilling, additional pages, or reordering.

Distinguish technical errors, successful empty lists, and successful result lists.

For result presentation, results belong to the executed request ID and revision. If an interface continues to display previous results during a new, blocked, or failed request, it must identify them as previous results. This is a presentation requirement, not evidence of an already implemented web interface.

Optional result refinement is separate from mandatory clarification before execution and is not fully implemented.

## Texts and Interfaces

`searchTexts` provides application, HTTP, and session texts. The flow binds the media question as the required `message` field; HTTP validates it and the CLI displays it. The same bound text is used in the free-text context alongside the original request, confirmed criteria, request-specific answers, and current question. Do not maintain general chat history speculatively; do not derive options from model prose.

Terminal-only help, labels, and templates remain in `terminalTexts`. Ordinary text is a submit when no question is open; otherwise, it is a bound answer. `/submit TEXT`, `/select NUMBER`, `/execute`, `/reset`, and `/exit` are explicit commands; `/select` clarifies media and does not select results. A compact table shows title, type, date, and ID; page counts and total counts are separate.

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, a model server, and local configuration are required. No provider credentials in the terminal client. Since `0e7c642`, TMDb error texts have been grouped under three stable English keys in `server/services/tmdb/errors.ts`; wording, codes, and HTTP mapping are unchanged. No additional i18n infrastructure or language selection. Free-form model messages remain separate. Web/wizard integration has not been accepted.

## Verification Status of the Completed Title Vertical Slice

As of November 22, 2026; do not carry evidence forward to subsequent behavioral changes.

| Evidence | Scope and source |
| --- | --- |
| `8172f08` | Title-adapter tests: endpoints/year, cards, direct/multi totals, metadata, isolated person-count failure, and empty pages; test run confirmed by the user |
| `0e0e002` | Real flow/matrix/proposal validation/adapter with controlled external boundaries: criteria preservation/changes, clarification, execute, bindings, reservations, and explicit retry after failure; tests confirmed by the user |
| `e885a7c` | Real handler/session through isolated H3 HTTP: validation, cookies, session isolation, reset, conflicts, response contract, no-store; tests confirmed by the user |
| `d6e071c` | Lint correction: provider-gate check before execution instead of throwing in finally |
| Project checks | At 18:17 CET, the user confirmed tests, lint, and typecheck, followed by coverage above 80%; no exact percentage, metric, or test count supplied; no project commands run independently by the assistant |
| Live HTTP | User run against localhost:3000, 18:23 CET: eight PASSED, zero FAILED, zero BLOCKED; console output and JSON report reviewed in the conversation |

Live cases: new request while a question is open; incorrect request/question ID and revision; duplicate answer; reset with old bindings and cookie; stale execute; repeat after success; two concurrently submitted execute requests; explicit movies-and-TV request with a year. Expected conflicts were observed, and the valid current state remained usable afterward. The parallel case produced one completed/200 and one 409, not proof of internal overlap or provider-call counts. All recorded responses were no-store.

Live report `search-flow-audit-report.json`: 17:23:14.748Z to 17:23:31.397Z; commit value `d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69` supplied by the caller, not verified against the server. The audit script was provided locally only and checked with node --check; the script and raw reports were not committed. The audit checks required fields, not the full shared schema.

The reviewed production search paths had no blocking structure/import/text-assignment findings; a project-wide exhaustive scan was explicitly excluded from the completion scope and was not performed. No comprehensive project-wide test-inventory audit is claimed. The earlier deferral of tests was supplemented by separately agreed targeted blocks; the [testing rules](testing.md) and [development rules](../AGENTS.md) continue to apply.

The detailed [historical completion record for Task 01](https://github.com/upstroke/NuxtWatch/blob/5ac52968b8f68acfd2db0f838ac012c127c7357c/docs/tasks/search-architecture/01-shared-search-matrix.md) remains accessible through the fixed commit. It also contains earlier B/R/D evidence and its limitations. R04 free-text select 1 remains a historical failure outside the agreed terminal scope; no implicit fix is claimed. D01/D02 remain historical with their original evidence limitations, not a new full acceptance.

## Open Architecture and Security Boundaries

1. The concrete matrix path identifier is not passed through to execution. When extending the system, assess unambiguous propagation of the path decision.
2. The media question remains a generic fallback after handling a missing title or a matching path. New criteria require appropriate clarification or a justified rejection rather than unchecked reuse.
3. General partial acceptance during LLM clarification is not fully implemented. Independent criteria and coupled changes require a separate domain decision.
4. Prompt-injection resistance has not been specifically accepted. Schema-valid does not mean faithful to the request; model responses remain untrusted. Agree on deterministic boundary tests and adversarial model tests separately. Security rules are not a passed security audit.

Not fully demonstrated: sustained LLM semantic reliability, instrumented live provider-call counts, guaranteed internal execute overlap, deliberately delayed TMDb responses, controlled real provider/person-count failures, browser cookie races, session expiry/capacity limits, and multi-instance/restart behavior. Controlled service failures/retries do not replace real failure simulations.

This is not evidence of production readiness. Commission further search paths, the web wizard, optional result refinement, full i18n, and operational/security work separately. No next search path is predetermined; keyword search is an option, not an agreed next implementation.
