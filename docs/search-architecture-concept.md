# NuxtWatch – Search Architecture

Permanent reference for the rules, structure and extension boundaries of shared search. Implemented today: the title search slice (title, media type, optional single year). Limits and open points are listed at the end.

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

This covers the search area, not the complete project tree. Additional TMDb transport/mapping modules and runtime/provider/card contracts remain separate.

## Criteria and Paths

The shared criteria object describes the user's intent, not the endpoint. Currently supported: title, media type, and an optional single year. Confirmed criteria are preserved unless explicitly changed. Prompt 1.5.3 clarifies this preservation rule; model compliance must be evaluated separately.

“Confirmed criteria” means the current criteria state accepted by the application. It implies neither separate user approval of every value nor that the request is already executable.

| Criteria                      | Behavior                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------- |
| Title missing                 | Clarify the title when title search is intended; do not reinterpret other intents |
| Title, `all`, no year         | Multi-search; no optional media-type/year question                                |
| Title, `movie`, optional year | Movie search; year via `primary_release_year`                                     |
| Title, `tv`, optional year    | TV search; year via `first_air_date_year`                                         |
| Title, year, `all`            | Bound choice of `movie` or `tv`; no result search                                 |

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

Nuxt, a model server, and local configuration are required. No provider credentials in the terminal client. TMDb error texts are grouped under three stable English keys in `server/services/tmdb/errors.ts`. There is no i18n infrastructure or language selection yet. Free-form model messages remain separate. There is no web interface or wizard yet.

## Verification

The title slice was completed and verified on 22 November 2026 at `d6e071c`. Evidence, live audit cases and their limits are recorded in the [verification log](verification/2026-11-22-title-slice.md). Record evidence for later changes as a new log in `docs/verification/`.

## Open Architecture and Security Boundaries

1. The concrete matrix path identifier is not passed through to execution. When extending the system, assess unambiguous propagation of the path decision.
2. The media question remains a generic fallback after handling a missing title or a matching path. New criteria require appropriate clarification or a justified rejection rather than unchecked reuse.
3. General partial acceptance during LLM clarification is not fully implemented. Independent criteria and coupled changes require a separate domain decision.
4. Prompt-injection resistance has not been specifically accepted. Schema-valid does not mean faithful to the request; model responses remain untrusted. Agree on deterministic boundary tests and adversarial model tests separately. Security rules are not a passed security audit.

Not fully demonstrated: sustained LLM semantic reliability, instrumented live provider-call counts, guaranteed internal execute overlap, deliberately delayed TMDb responses, controlled real provider/person-count failures, browser cookie races, session expiry/capacity limits, and multi-instance/restart behavior. Controlled service failures/retries do not replace real failure simulations.

This is not evidence of production readiness. Commission further search paths, the web wizard, optional result refinement, full i18n, and operational/security work separately. No next search path is predetermined; keyword search is an option, not an agreed next implementation.
