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
- Keep routes focused on HTTP input and output. Separate transport, validation, mapping and domain decisions. Prefer plain functions and explicit dependencies over speculative abstractions.
- Follow [Typing](docs/typing.md). Document exported functions and methods with concise TSDoc-compatible comments.

## Testing and workflow

- Follow [Testing](docs/testing.md). Use synthetic fixtures, mock external boundaries, and distinguish direct handler tests from integration tests that run a real HTTP server. Do not exclude application modules just to improve coverage.
- Verify the target repository and ref, then inspect relevant code and tests. Agree on scope before implementing. Report what changed, which checks actually ran and what remains unverified.
- Obtain explicit approval for each GitHub write, including the exact target and content. Approval for one action does not authorize another.
- Treat documents under `docs/work/` as references from the imported NextWatch Spike, not as the NuxtWatch roadmap. Review any applicable guidance against the current code and agreed scope before carrying it forward. Keep the README current and shared rules in one place.
