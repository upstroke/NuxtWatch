# Fixtures

Shared, deterministic test data for unit and integration tests.

Keep fixtures typed where practical and avoid duplicating representative API payloads across test files.

`parser-eval-cases.json` is not a unit-test fixture: it holds the synthetic cases for the live parser evaluation `scripts/parser-eval.mjs` (see [Testing](../../docs/testing.md)).
