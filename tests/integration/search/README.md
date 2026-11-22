# Search HTTP integration tests

Run `pnpm exec vitest run tests/integration/search/search-http.spec.ts`.

These tests mount the production `/api/search` handler on an isolated H3 HTTP server using an ephemeral loopback port. They exercise real HTTP requests, JSON serialization, request and response schemas, cookie-bound session storage, search coordination, and error/status translation. Nuxt auto-imported H3 functions are supplied by their actual H3 implementations; runtime configuration is supplied by the harness. Only AI SDK text generation and the external TMDb `$fetch` transport are mocked. Internal application modules are not mocked. No external credentials or running model/TMDb/Nuxt server are required.

The cookie clients preserve the `Set-Cookie` session value independently and resend it explicitly. They are not browser cookie-policy tests. Cookie attributes are checked on the HTTP response; HTTPS/Secure behavior is not covered.

This is a handler/session integration test, not a complete Nitro/Nuxt routing or browser end-to-end test. The separate live HTTP audit remains necessary for the running deployment. The suite does not cover expiration, capacity, TLS, process restarts, or deliberately delayed provider responses.

Stable case identifiers are `SEARCH-HTTP-001` through `SEARCH-HTTP-006`; the validation group uses descriptive parameterized variants. Do not reuse these identifiers for unrelated scenarios. Production code, runner configuration, and coverage thresholds are unchanged.
