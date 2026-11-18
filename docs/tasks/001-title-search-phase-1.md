# Task 001 — Phase 1: route inventory and agreed design

Companion to [Task 001](001-title-search.md). This records the inventory and implementation decision for the first title-only slice.

## Inventory at `bce7c77`

- `server/api/tmdb/` contains trending and movie/TV detail routes, but no search route. `server/services/tmdb/` has no search service on this branch.
- Reuse `server/services/tmdb/http.ts`: its `get(path, query)` supports an injected transport. `server/api/tmdb/trending.get.ts` is a reference for runtime configuration and error handling, not a route to modify.
- `src/lib/schemas/tmdb.ts` provides a paginated movie/TV output model, not a title search input schema. `server/services/tmdb/mappers.ts` contains a trending-specific mapper; do not use it as-is for mixed search results.
- `tests/integration/http/` has trending and detail coverage but no title search test.

## Agreed layout and contract

- `server/api/search/title.post.ts`: `POST /api/search/title` accepts validated search criteria as JSON, initially only a non-empty `title`. It does not accept raw model output or TMDb parameters. The route name describes the application task, independent of the upstream endpoint.
- `server/services/tmdb/search/multi.ts`: uses the existing client to issue `GET /search/multi` with `query` set to the title.
- `server/services/tmdb/search/map-multi-to-title-cards.ts`: maps movie and TV hits to title cards and excludes person hits. Keep the mapper beside `multi.ts`; add directories or additional mappers only when needed.

## First implementation and verification

Use the observed model response from the task as inline test input. Validate it and form `{"title":"The Matrix"}` before calling the internal route. With a mocked TMDb transport, assert the upstream path and query and verify that mixed movie, TV, and person hits produce only movie and TV title cards. Separately verify that invalid proposals and proposals requiring clarification leave the existing search object unchanged and do not call the internal route.

Do not change `instructions.ts` or `OPENROUTER_MODEL` for this slice. The movie/year follow-up and the UI dispatch decision remain separate. This entry records the plan; it does not claim implementation or test execution.
