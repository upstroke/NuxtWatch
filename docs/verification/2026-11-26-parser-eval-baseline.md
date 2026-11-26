# Verification log: parser evaluation baseline (26 November 2026)

## Scope

- Slice: Baseline of the live parser evaluation (task F2) for parser instructions 1.5.3 and clarification instructions 1.1.1, recorded after the generation settings (F4) and before the instruction restructuring (F3). Not a completion log for the search-foundation task.
- Branch and commit: `refactor/search-foundation` at `3494f703c4f5d50e0d81e5548f0d4140d730d9e1` (work tree clean according to the report)
- Concept: [Testing — live audits](../testing.md#live-audits-concurrency-and-security), [task file](../tasks/search-foundation/README.md)

## Checks run by the user

| Check                | Result | Date and time |
| -------------------- | ------ | ------------- |
| `pnpm test`          | none   |               |
| `pnpm lint`          | none   |               |
| `pnpm typecheck`     | none   |               |
| `pnpm test:coverage` | none   |               |

## Checks run by the agent

On the F4 changes immediately before they were committed as `3494f70` (no edits between checks and commit):

- `pnpm lint`: no findings.
- `pnpm typecheck`: exit code 0.
- `pnpm test`: 14 files, 155 tests passed.
- `pnpm test:coverage`: 92.06 % statements overall; `server/services/search/llm.ts` 89.47 %.

## Live and manual checks

Parser evaluation run by the user:

```bash
node --env-file=.env scripts/parser-eval.mjs --repeat 3 --report parser-eval-report-1.5.3.json
```

- Time: 16:11:40Z to 16:12:23Z (17:11–17:12 CET); single model calls took 435 to 1773 ms (mean 784 ms).
- Environment: LM Studio on localhost, provider `lmstudio`, model `google_gemma-4-26b-a4b-it` (Q4_K_M). Application settings from `3494f70`: temperature 0, 60 s timeout, 256 output tokens. `NUXT_LLM_REASONING` was not set, so no reasoning effort was sent. Reasoning was switched off by hand in the LM Studio model settings, as confirmed by the user; the script does not record this setting. Comparison runs need reasoning switched off as well, either in LM Studio or with `NUXT_LLM_REASONING=none`.
- Result: 16 PASSED, 2 FAILED, 0 BLOCKED; every case gave the same outcome in all three runs.

| Case                    | Result | Observation                                                                                                                                                                                       |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PARSER-EVAL-001 to -009 | PASSED | 3/3 each                                                                                                                                                                                          |
| PARSER-EVAL-010         | FAILED | 0/3. Ambiguous continuation („Lass uns etwas anderes suchen: Glaswald“): `ready` with title Glaswald and `year: null`, `movie` kept; no clarification question                                    |
| PARSER-EVAL-011 to -015 | PASSED | 3/3 each                                                                                                                                                                                          |
| PARSER-EVAL-016         | FAILED | 0/3. Instruction-like quoted title: `ready` with `mediaType: movie`, the instruction was not followed; the title was taken over including the surrounding quotation marks, which the case rejects |
| PARSER-EVAL-017, -018   | PASSED | 3/3 each (bound clarification answers)                                                                                                                                                            |

The report `parser-eval-report-1.5.3.json` stays local and is not committed (`parser-eval-report*.json` is ignored). Earlier attempts on the same day without reasoning control returned no proposal: with LM Studio's default at that time, the model spent the 256 output tokens on reasoning (`finish_reason: length`, empty content); this led to F4.

## Evidence

| Commit    | What it demonstrates                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------- |
| `f84442f` | Parser evaluation script and the 18 synthetic cases                                                      |
| `3494f70` | Generation settings (temperature 0, timeout, optional reasoning effort, fence stripping) and their tests |

## Not verified

- General semantic reliability of the model; the run covers 18 synthetic cases with one model and quantization.
- Messages of `needs_clarification` and `unsupported` proposals are not evaluated.
- Prompt-injection resistance beyond case 016 (one quoted German instruction inside a title).
- The 60 s timeout is not exercised by tests or the live run.
- The full case set with `NUXT_LLM_REASONING=none` sent by the application; the baseline relied on the LM Studio setting instead.
- Search flow, HTTP and TMDb are not part of this evaluation.
