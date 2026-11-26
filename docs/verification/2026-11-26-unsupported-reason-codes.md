# Verification log: unsupported reason codes (26 November 2026)

## Scope

- Slice: Unsupported reason codes and message sources (task F7): `unsupported` proposals carry `year_range`, `people`, `unsupported_criterion` or `other`; the application renders the text from its catalog; every decision and question with a message names its source. Parser instructions 3.0.0 (clarification module unchanged at 2.0.0). Not a completion log for the search-foundation task.
- Branch and commit: `refactor/search-foundation` at `b7bdb5b05f65ee938030264e42372025248a8518` (work tree clean according to the report)
- Concept: [search concept — texts and interfaces, language and locale](../search-architecture-concept.md#texts-and-interfaces), [parser README](../../src/lib/parser/README.md)

## Checks run by the user

| Check                | Result | Date and time |
| -------------------- | ------ | ------------- |
| `pnpm test`          | none   |               |
| `pnpm lint`          | none   |               |
| `pnpm typecheck`     | none   |               |
| `pnpm test:coverage` | none   |               |

Before this slice the user tested instructions 2.0.0 with the terminal client against the running application; that session found the English message for a German people request that led to this slice. It is not evidence for `b7bdb5b`.

## Checks run by the agent

On `b7bdb5b`, 18:24 CET:

- `pnpm lint`: exit code 0.
- `pnpm typecheck`: exit code 0.
- `pnpm test:coverage`: 171 tests passed; 92.21 % statements overall. Includes a flow test per reason code, the model-question source test and the HTTP contract test `SEARCH-HTTP-007`.

## Live and manual checks

Parser evaluation run by the agent against the user's LM Studio:

```bash
node --env-file=.env scripts/parser-eval.mjs --repeat 3 --report parser-eval-report-3.0.0.json
```

- Time: 17:24:14Z to 17:24:52Z (18:24 CET); single model calls took 223 to 1883 ms (mean 703 ms).
- Environment: provider `lmstudio`, model `google_gemma-4-26b-a4b-it` (Q4_K_M), temperature 0, 60 s timeout, 256 output tokens, `NUXT_LLM_REASONING=none`; reasoning also off in the LM Studio model settings.
- Result: 18 PASSED, 0 FAILED, 0 BLOCKED; every case passed in all three runs. Cases 012, 013 and 014 now also compare the reason and returned `year_range`, `people` and `unsupported_criterion`. Because of the reason comparison, the result is a new baseline for 3.0.0 rather than a direct comparison with the 2.0.0 log.
- Message language (read from the report): the model questions of cases 010 and 011 were German in all runs.

Language probe run by the agent on the same commit with eight local scratch cases (not committed), three runs each: German people, director, genre and decade, streaming, missing title and new-search inputs, and one English people input. All people requests returned `people`, the genre-and-decade request `unsupported_criterion`, the streaming request ("Was gibt es Neues auf Netflix?") `other`, and both German questions were German in all runs.

Live HTTP check by the agent against the user's running `nuxt dev` on the uncommitted state shortly before the commit: submit "Filme mit Tom Hanks" returned `unsupported`, `reason: people`, the catalog text and `source: application`.

The report `parser-eval-report-3.0.0.json` stays local and is not committed.

## Evidence

| Commit    | What it demonstrates                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| `0a06e01` | Previous evaluation for instructions 2.0.0                                                                 |
| `b7bdb5b` | Reason codes, catalog texts, message sources, instructions 3.0.0, flow and HTTP contract tests, CLI notice |

## Not verified

- The choice between `unsupported_criterion` and `other` is not stable by definition: the streaming request returned `other`, although the definition names streaming services under `unsupported_criterion`. The user sees only a different catalog text.
- Message language is still not checked by the evaluation script.
- The terminal client's new notice line was not run after the commit; only the HTTP response it reads was checked.
- Catalog texts are German until the locale task (F6).
- Generalization beyond the 18 cases and the eight probe cases; other models and settings.
