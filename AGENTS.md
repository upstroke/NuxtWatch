# NuxtWatch — Development rules

## Purpose

NuxtWatch is a controlled search application. The LLM proposes structured filter changes or indicates that clarification is needed. The application validates the proposal, resolves criteria as needed, queries TMDb, and generates feedback from translatable templates. The LLM does not construct or execute provider requests.

## Search design

- Verify each intended search against TMDb before designing the shared search object: record the endpoint, parameters, relevant response fields, and any filtering the application must perform. Never record credentials.
- Derive one shared search object from verified use cases. Keep criterion-specific resolution and provider request mapping separate. Do not guess provider IDs or silently drop unsupported criteria.
- Add clarification and pending transitions only for concrete flows that need them. Do not introduce a store or a general pending framework without explicit agreement.

## Boundaries and validation

- Keep TMDb calls and credentials server-side. Browser code must not import server modules. Reject unexpected credential destinations and redirects. Do not log tokens, headers, raw errors, or user conversations. Do not persist real user conversations permanently.
- Validate LLM output before changing search criteria and validate TMDb responses at the server boundary. Distinguish empty results from missing data and technical failures. Keep language and provider region separate.
- Keep routes focused on HTTP input and output. Separate transport, validation, mapping and domain decisions.
- Follow [Typing](docs/typing.md).

## Application style and comments

- Prefer straightforward JavaScript and TypeScript that make the behavior easy to follow. Use clear names and explicit control flow. Add abstractions or design patterns only when they solve a concrete problem and make the code easier to understand or change.
- Use ES modules, plain functions, and composition for application code. Do not introduce application classes, inheritance, or custom prototype hierarchies.
- Follow Nuxt, Vue, and the chosen UI library's conventions at their integration points. Use their APIs and required structures as intended, including framework- or library-provided classes where appropriate. Do not add wrappers merely to avoid those APIs.
- Pass dependencies explicitly. Use factory functions and closures when a component needs instance-specific configuration or private state. Expose only the operations callers need. Add adapters for concrete boundary needs and use memoization only when justified; document its scope, key, lifetime, and failure behavior.
- Add a short English header comment to every hand-maintained source file whose format supports comments. State the file's purpose and, where useful, what belongs elsewhere. Keep the header current when responsibilities change.
- Document each function and method with a short English comment explaining its purpose. Use TSDoc-compatible comments for exported functions and methods. Explain intent, constraints, or side effects rather than restating the implementation.

## Testing and workflow

- Follow [Testing](docs/testing.md). Use synthetic fixtures, mock external boundaries, and distinguish direct handler tests from integration tests that run a real HTTP server. Do not exclude application modules just to improve coverage.
- Verify the target repository and ref, then inspect relevant code and tests. Agree on scope before implementing. Report what changed, which checks actually ran and what remains unverified.
- Obtain explicit approval for each GitHub write, including the exact target and content. Approval for one action does not authorize another.
- Treat documents under `docs/work/` as references from the imported NextWatch Spike, not as the NuxtWatch roadmap. Review any applicable guidance against the current code and agreed scope before carrying it forward. Keep the README current and shared rules in one place.
