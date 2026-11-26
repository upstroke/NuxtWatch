# Verification log: parser instructions 2.0.0 (26 November 2026)

## Scope

- Slice: Restructured parser instructions (task F3): base and title modules with composition, clarification module 2.0.0, English rules and examples, reasons per rule in the parser README. Compared against the [1.5.3 baseline](2026-11-26-parser-eval-baseline.md). Not a completion log for the search-foundation task.
- Branch and commit: `refactor/search-foundation` at `356f60ec539f7062bccfd96959e9e0398e3cdc46` (work tree clean according to the report)
- Concept: [parser README](../../src/lib/parser/README.md), [search concept](../search-architecture-concept.md)

## Checks run by the user

| Check                | Result | Date and time |
| -------------------- | ------ | ------------- |
| `pnpm test`          | none   |               |
| `pnpm lint`          | none   |               |
| `pnpm typecheck`     | none   |               |
| `pnpm test:coverage` | none   |               |

## Checks run by the agent

On `356f60e`, 17:52 CET:

- `pnpm lint`: exit code 0.
- `pnpm typecheck`: exit code 0.
- `pnpm test:coverage`: 161 tests passed; 92.16 % statements overall.

## Live and manual checks

Parser evaluation run by the agent against the user's LM Studio:

```bash
node --env-file=.env scripts/parser-eval.mjs --repeat 3 --report parser-eval-report-2.0.0.json
```

- Time: 16:51:36Z to 16:52:18Z (17:51–17:52 CET); single model calls took 340 to 2121 ms (mean 793 ms).
- Environment: provider `lmstudio`, model `google_gemma-4-26b-a4b-it` (Q4_K_M), temperature 0, 60 s timeout, 256 output tokens. `NUXT_LLM_REASONING=none` was sent; reasoning was also switched off in the LM Studio model settings, as in the baseline.
- Result: 18 PASSED, 0 FAILED, 0 BLOCKED; every case passed in all three runs.

| Case                    | Baseline 1.5.3 | 2.0.0 | Note                                                                                                           |
| ----------------------- | -------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| PARSER-EVAL-001 to -009 | 3/3            | 3/3   | No regression                                                                                                  |
| PARSER-EVAL-010         | 0/3            | 3/3   | Asks whether the restrictions (film, 1999) still apply, naming them                                            |
| PARSER-EVAL-011 to -015 | 3/3            | 3/3   | No regression                                                                                                  |
| PARSER-EVAL-016         | 0/3            | 3/3   | Quoted instruction-like text taken as title without quotation marks, `movie` set; the instruction not followed |
| PARSER-EVAL-017, -018   | 3/3            | 3/3   | No regression                                                                                                  |

Messages were checked by reading the report, not by the script: all messages for German inputs (cases 010 to 014, 15 runs) were German. The wording of case 011 differed between runs despite temperature 0.

During development on the uncommitted tree, two intermediate versions were evaluated: a first rule for explicit new searches made case 006 ask instead of continuing (0/3); after translating rules and examples to English, case 014 answered in English (3/3 runs). Both were fixed before the commit; these runs are not evidence for the committed state.

The report `parser-eval-report-2.0.0.json` stays local and is not committed.

## Evidence

| Commit    | What it demonstrates                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `b113c0d` | Baseline for instructions 1.5.3                                                                                                |
| `356f60e` | Instructions 2.0.0, composition and its tests (`tests/unit/parser/instructions.spec.ts`), context-field check in `llm.spec.ts` |

## Not verified

- Generalization beyond the 18 cases: several rules name phrases close to case inputs (for example "new search", "search for something else", "Now X" against cases 006 and 010), now in English while the cases are German. Additional cases with unseen wording have not been run against 1.5.3 and 2.0.0.
- Message language is not checked by the evaluation script; only the manual reading above.
- Messages of `needs_clarification` and `unsupported` are not evaluated for content.
- Prompt-injection resistance beyond case 016.
- Other models, quantizations or reasoning settings.
- Search flow, HTTP and TMDb are not part of this evaluation.
