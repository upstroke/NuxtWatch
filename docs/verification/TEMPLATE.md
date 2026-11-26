# Verification log: <slice> (<DD Month YYYY>)

Copy this file to `docs/verification/YYYY-MM-DD-<slice>.md` when a slice is completed. Fill in every section; write "none" instead of deleting a section. Do not edit a log after it is committed; a later verification gets a new log.

## Scope

- Slice: <what was completed, in one or two sentences>
- Branch and commit: `<branch>` at `<full commit hash>`
- Concept: <link to the reference document that describes the result>

## Checks run by the user

| Check                | Result                                | Date and time |
| -------------------- | ------------------------------------- | ------------- |
| `pnpm test`          | <passed / failed, counts if supplied> |               |
| `pnpm lint`          |                                       |               |
| `pnpm typecheck`     |                                       |               |
| `pnpm test:coverage` | <percentage if supplied>              |               |

## Checks run by the agent

<Commands the agent ran itself and their results, or "none".>

## Live and manual checks

<Live HTTP, terminal or browser runs: cases, environment, results. Name reports that are not committed.>

## Evidence

| Commit         | What it demonstrates                    |
| -------------- | --------------------------------------- |
| `<short hash>` | <tests or changes that cover this part> |

## Not verified

<What this slice does not demonstrate, for example model reliability, race conditions, failure simulations, browser behavior.>
