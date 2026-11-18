# NuxtWatch

NuxtWatch is a controlled search application with an LLM acting as a semantic parser. The model translates free-form user input into structured filter changes or indicates that clarification is required. The application validates the output, calculates domain-specific consequences, queries TMDb, and generates feedback from translatable templates.

## Starting point

This repository starts from the NextWatch `v0.0.1` Spike source snapshot (`e835d5a7813859ef708c1826963ede62601874a4`), without the original Git history. The description above states the project goal, not what the imported Spike already implements.

## Getting started

Copy `.env.example` to `.env` and add your own TMDb credentials. TMDb requests must remain server-side.

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm test
pnpm test:coverage
pnpm lint
pnpm typecheck
```

See [AGENTS.md](AGENTS.md) for the working agreement and [docs/](docs/) for the imported documentation.
