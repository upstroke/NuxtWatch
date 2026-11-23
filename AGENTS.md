# NuxtWatch — Development rules

## Purpose

NuxtWatch is a controlled search application. The LLM proposes structured filter changes or indicates that clarification is needed. The application validates the proposal, resolves criteria as needed, queries TMDb, and generates feedback from translatable templates. The LLM does not construct or execute provider requests.

## Search design

- Follow the [search concept](docs/search-architecture-concept.md), which contains the permanent structure, implementation scope, verification summary and architecture limits. Keep shared rules there rather than duplicating them in completed task folders or progress reports here. Record evidence for future work in its explicitly agreed task documentation.
- Verify each intended search against TMDb before designing the shared search object: record the endpoint, parameters, relevant response fields, and any filtering the application must perform. Never record credentials.
- Derive one shared search object from verified use cases. Keep criterion-specific resolution and provider request mapping separate. Do not guess provider IDs or silently drop unsupported criteria.
- Keep responsibilities distinct: the LLM interprets and proposes; the matrix evaluates full criteria/scope coverage; the flow applies validated changes, binds questions and reserves execution; adapters map provider requests; HTTP and sessions handle transport and ownership. Interfaces must not introduce a second search-rule matrix.
- Preserve confirmed criteria unless explicitly changed. Clarification never starts a title search; after clarification, explicit execute uses the confirmed revision without another LLM interpretation. A new executable submit may search immediately.
- Add clarification and pending transitions only for concrete flows that need them. Do not introduce a store or a general pending framework without explicit agreement. Revisit documented architecture limits when adding criteria rather than assuming the current fallback question covers them.

## Boundaries and validation

- Keep TMDb calls and credentials server-side. Browser code must not import server modules. Reject unexpected credential destinations and redirects. Do not log tokens, headers, raw errors, or user conversations. Do not persist real user conversations permanently.
- Validate LLM output before changing search criteria and validate TMDb responses at the server boundary. Distinguish empty results from missing data and technical failures. Keep language and provider region separate.
- Keep routes focused on HTTP input and output. Separate transport, validation, mapping and domain decisions.
- Follow [Typing](docs/typing.md).

## Untrusted model input and output

- Treat user text, clarification context, external content and model responses as untrusted data. Separate fixed instructions from supplied data; delimiters, JSON formatting and prompt wording are not security boundaries.
- Schema-valid model output is not proof of legitimate user intent. Keep permissions, allowed criteria, request/question/revision bindings, executable-path checks and execution reservations enforced by application code outside the model.
- Do not allow model output to select arbitrary credential destinations, execute commands or grant itself tools or permissions. Do not put provider credentials or other secrets into model context.
- Treat model-generated messages as display data, not trusted HTML, commands or further privileged instructions. Review rendering and external-content ingestion when adding interfaces or model context.
- Separate deterministic application-boundary tests from adversarial tests against the real model. Record the attacks and effects actually tested; functional success, schema validation or a stronger system prompt does not establish prompt-injection resistance. No completed security audit or production approval is implied by these rules.

## Application style and comments

- Prefer straightforward JavaScript and TypeScript that make the behavior easy to follow. Use clear names and explicit control flow. Add abstractions or design patterns only when they solve a concrete problem and make the code easier to understand or change.
- Use ES modules, plain functions, and composition for application code. Do not introduce application classes, inheritance, or custom prototype hierarchies.
- Follow Nuxt, Vue, and the chosen UI library's conventions at their integration points. Use their APIs and required structures as intended, including framework- or library-provided classes where appropriate. Do not add wrappers merely to avoid those APIs.
- Pass dependencies explicitly. Use factory functions and closures when a component needs instance-specific configuration or private state. Expose only the operations callers need. Add adapters for concrete boundary needs and use memoization only when justified; document its scope, key, lifetime, and failure behavior.
- Add a short English header comment to every hand-maintained source file whose format supports comments. State the file's purpose and, where useful, what belongs elsewhere. Keep the header current when responsibilities change.
- Document every function and method, including local helpers and arrow functions, with a short English JSDoc-style comment (`/** ... */`) immediately above it. Explain its purpose and relevant constraints or side effects rather than restating the implementation. Keep exported-function and method comments TSDoc-compatible. Add `@param`, `@returns`, or `@throws` only when they provide useful information beyond the signature and summary; do not repeat TypeScript types. Keep comments current when behavior changes.

## Testing and workflow

- Follow [Testing](docs/testing.md). Use synthetic fixtures, mock external boundaries, and distinguish direct handler tests, isolated H3 HTTP integrations, live Nuxt HTTP checks and browser end-to-end tests. Do not exclude application modules just to improve coverage.
- Verify the target repository and ref, then inspect relevant code and tests. Agree on scope before implementing. Report what changed, which checks actually ran and what remains unverified. Attribute user-run checks separately from assistant-run checks.
- Obtain explicit approval for each GitHub write, including the exact target and content. Approval for one action does not authorize another.
- Treat documents under `docs/ideas` as references from the imported NextWatch Spike, not as the NuxtWatch roadmap. Review any applicable guidance against the current code and agreed scope before carrying it forward. Keep the README current and shared rules in one place.
