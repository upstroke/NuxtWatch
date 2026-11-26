# NuxtWatch

NuxtWatch helps people find movies and TV shows by describing what they want in their own words. The LLM proposes structured criteria changes; the application validates them, decides whether clarification is required, and executes verified TMDb requests server-side.

The project is also an exploration of working with AI agents: the documentation is written so that an agent can join at any time and continue from the current state. Agents start with [AGENTS.md](AGENTS.md).

## Current status

Version 0.1.0. Implemented: the shared title search through `POST /api/search` and the terminal client. There is no web page yet; the terminal client is the interface for clarifying contracts and flows.

- Criteria: title, media type (`all`, `movie`, `tv`) and an optional single year.
- Title with `all` and no year uses Multi search; explicit movie or TV scope uses the corresponding endpoint.
- Title plus year with `all` requires a movie/TV selection before searching. Title and year are preserved; lists are not merged and the year is not dropped.
- Actions: `submit` (new request, may search immediately), `clarify` (answers a bound question, never searches), `execute` (runs the confirmed state after clarification without another LLM call), `reset` (new session).
- Search cards exclude people. Page results and total counts are separate; an unavailable total is `null`, not zero.

Last verified state: 22 November 2026 at `d6e071c` (tests, lint, typecheck, coverage above 80 %, live HTTP audit). Details and limits: [verification log](docs/verification/2026-11-22-title-slice.md).

## Known issues

- `NUXT_LLM_API_KEY` is not read: it is missing from `runtimeConfig.llm`, the runtime schema and the LLM client. Only model servers without authentication work.
- `NUXT_APP_DEFAULT_LOCALE` is not read by the application.
- The model answer is parsed with `JSON.parse` on free text. Output wrapped in Markdown fences or truncated by the 256-token limit causes a 502; there is no structured output mode and no retry.

## Next steps

- Keyword resolution experiment, Phase A: resolver only, no result search. See the [keyword resolution concept](docs/keyword-resolution-concept.md); all tasks are open.
- Open architecture points: see the end of the [search concept](docs/search-architecture-concept.md).
- Web interface with Nuxt UI: not scheduled yet. Design references from the NextWatch spike are below.

## Getting started

Copy `.env.example` to `.env` and configure TMDb and a local OpenAI-compatible model server (for example LM Studio). Provider credentials stay server-side.

```bash
pnpm install
pnpm dev
node scripts/search.mjs http://localhost:3000   # terminal client
```

Checks:

```bash
pnpm test
pnpm test:coverage
pnpm lint
pnpm typecheck
```

## Documentation

| Document                                                         | Content                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                           | Development rules and entry point for agents         |
| [Search concept](docs/search-architecture-concept.md)            | Current search architecture, rules and open points   |
| [Keyword resolution concept](docs/keyword-resolution-concept.md) | Planned experiment for keyword-based preferences     |
| [TMDb API analysis](docs/tmdb-api-analysis.md)                   | Endpoint research and candidate flows                |
| [TMDb search examples](docs/tmdb-search-examples.md)             | Observed requests and responses                      |
| [Home screen](docs/home.md)                                      | Goal for the trending home screen (not implemented)  |
| [Typing](docs/typing.md), [Testing](docs/testing.md)             | Type and test rules                                  |
| [Verification logs](docs/verification/)                          | Time-bound evidence per completed slice              |
| [Ideas](docs/ideas/)                                             | References from the NextWatch spike, not the roadmap |

## Origin

The repository originated from the NextWatch `v0.0.1` spike source snapshot (`e835d5a7813859ef708c1826963ede62601874a4`), without its original Git history.

The following screenshots are design references from that spike. They do not show the current NuxtWatch implementation.

![Discover design reference](docs/images/discover_dark-desktop.png)
![Details design reference](docs/images/details_dark-deskotp.png)
