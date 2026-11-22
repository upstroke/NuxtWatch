# TMDb API analysis

Updated 21 November 2026. API research and candidate flows for NuxtWatch, not a claim that every endpoint is implemented or live-verified. [Observed title-search requests](tmdb-search-examples.md) are already available; the former statement that no requests had been verified is obsolete. The [search concept](search-architecture-concept.md) defines current product rules, implementation scope and verification limits.

## Evidence and current title scope

Use official documentation first, then record authenticated request observations separately. Documentation research is not a live API test. The examples verify Multi title search/pagination, Movie Search with/without `primary_release_year`, TV Search with/without `first_air_date_year`, and separate Movie/TV queries for title plus year without a media type. They do not decide cross-endpoint ranking or automatic result selection.

Current application choice: title alone uses Multi; explicit film/series uses Movie/TV, optionally with one year. Title plus year without a type triggers clarification because we currently choose neither merging two title lists nor local year filtering. Multi has no documented year parameter. Movie's `primary_release_year` denotes the primary release year; TV's `first_air_date_year` denotes the first-air year, not any year in which a series aired. Do not conflate other `year` parameters with these meanings. Additional date meanings require a separate decision and verification.

## Endpoint inventory

All paths are GET requests relative to `https://api.themoviedb.org/3`. An inventory is not an implementation commitment.

| Task                | Endpoints                                                                                                                      | Purpose / boundary                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Text title search   | `/search/multi`, `/search/movie`, `/search/tv`                                                                                 | Multi searches movies, TV and people; Movie does not search TV, TV does not search movies. Keep only movie/TV title cards. |
| Resolve people      | `/search/person`                                                                                                               | Names to candidates/IDs, not final title results.                                                                          |
| Resolve keywords    | `/search/keyword`                                                                                                              | Text to keyword candidates/IDs.                                                                                            |
| Other text searches | `/search/company`, `/search/collection`                                                                                        | Inventory only; no current flow commitment.                                                                                |
| Filtered discovery  | `/discover/movie`, `/discover/tv`                                                                                              | Filters/sorting, not a replacement for free-text title matching.                                                           |
| Trends              | `/trending/all/{time_window}`, `/trending/movie/{time_window}`, `/trending/tv/{time_window}`, `/trending/person/{time_window}` | `day` or `week`; trends are not text-search matches.                                                                       |
| Details             | `/movie/{movie_id}`, `/tv/{series_id}`                                                                                         | Use selected result ID and media type; no external-ID lookup needed.                                                       |
| Providers           | `/movie/{movie_id}/watch/providers`, `/tv/{series_id}/watch/providers`                                                         | Country-specific availability; not direct playback links.                                                                  |
| Genre catalog       | `/genre/movie/list`, `/genre/tv/list`                                                                                          | IDs/names for the relevant type.                                                                                           |
| Person TV credits   | `/person/{person_id}/tv_credits`                                                                                               | Candidate workaround for person-based TV searches; combinations still to verify.                                           |
| Similar titles      | `/movie/{movie_id}/similar`, `/tv/{series_id}/similar`                                                                         | Resolve intended reference work first; cross-media behavior not promised.                                                  |
| External IDs        | `/find/{external_id}`                                                                                                          | External identifier such as IMDb, not a title string.                                                                      |

Official starting points: [finding data](https://developer.themoviedb.org/docs/finding-data), [Multi](https://developer.themoviedb.org/reference/search-multi), [Movie](https://developer.themoviedb.org/reference/search-movie), [TV](https://developer.themoviedb.org/reference/search-tv), [Discover Movie](https://developer.themoviedb.org/reference/discover-movie), [Discover TV](https://developer.themoviedb.org/reference/discover-tv). Dynamic reference pages may not expose their full parameter lists to a text fetch; do not mistake that for proof that parameters do not exist.

## Candidate flows: verify one at a time

| User goal                                             | Next required work                                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Find a title                                          | Use the verified title routes and blocker matrix in the concept.                                                                                          |
| Filtered films/series, e.g. sci-fi from a year onward | Verify every requested filter and date meaning for that endpoint before extending criteria.                                                               |
| Titles like a reference work                          | Resolve the reference through title search; ambiguous reference needs selection, not automatic identity guessing. Then call Similar.                      |
| Open viewing request                                  | Trending is a candidate, not implied by an empty criteria object. Clarify intent only where needed.                                                       |
| Trending and streamable today                         | Daily trends then region-specific provider checks before claiming streamability; ask region if unknown. Provider preference is optional unless requested. |
| Popular and streamable                                | Discover with availability filters/popularity sorting; do not label this daily Trending.                                                                  |
| Named people, keywords or genres                      | Resolve required IDs first. Person-based TV combinations, multiple people and other filters need separate verification.                                   |
| Recent regional theatrical releases                   | Discover is a candidate; it does not prove nearby showtimes today.                                                                                        |

Weekly home cards are separately described in [Home](home.md); explicit daily-trend search is not the same flow. Details require explicit title-card selection even for one result. Reference-title and person selections resolve inputs; they are not final-result navigation. Provider responses distinguish subscription/rent/buy by country and supply a TMDb link, not playback; attribute availability data to JustWatch when displayed.

## Shared orchestration rules

One search object describes intent and accepted criteria, not endpoints. A similarity reference has a different role from the title being sought; model it only when needed. The common coordinator applies validated transitions, evaluates blockers, invokes adapters and processes outcomes. Conceptual decision/search/endpoint tables are not three separate runtime engines. Runtime `matrix.ts` implements one shared evaluation, not a second copy of these tables.

Submit opens a new request using confirmed criteria; reset starts a fresh context. A bound reply updates its question's request. Explicit criterion removal differs from discarding an unresolved lookup. Starting a request must not silently discard filters. The previous generic draft-reset rule is superseded by the agreed concept.

Independent resolved criteria may be accepted while another request is unresolved; coupled changes stay atomic. Example: accepting Brad Pitt does not resolve a pending Tom. Partial acceptance is a target, not fully implemented. Keep unresolved requests separate from accepted filters. Preserve an accepted value until an unresolved replacement is ready. No match, ambiguity and technical failure are distinct lookup outcomes; no automatic retry loop during replanning. Missing pagination data is not proof that a single mapped candidate is unique.

Run only when every requested criterion is applicable and necessary resolution is complete. No silent omission or scope narrowing. No-op edits must not trigger a search merely because they were processed; explicit execution behavior follows the concept. Stale lookups must not revive discarded requests; late results must not overwrite a newer revision. Adapters return data or typed failures, never mutate sessions. HTTP codes/timeouts remain at the transport boundary.

Keep the last successful results tied to their executed revision, including an empty successful list. Previous cards may remain visible while a new draft is blocked or fails, but must be labelled as previous. Derive readiness rather than storing a second independent ready flag. Current storage is process-local, not durable or multi-instance safe.

## Remaining verification and display rules

- Extend the matrix only with a concrete flow and official API research; uncertain mappings need example responses. Similarity plus streaming and multi-person TV credits plus further filters remain unverified combinations.
- Required clarification blocks execution; optional suggestions do not. Empty results do not authorize automatic broadening. Follow-up behavior after zero/many results remains a separate product decision.
- Keep a normalised title-card contract independent of terminal presentation. Identify by ID plus media type, not display name. Terminal uses compact fields, not full provider payloads.
- `include_adult=true` for the current title searches and no adult-based exclusion of returned movie/TV hits. Locale/pagination are execution options; language is not provider region. Provider total counts are not automatically counts of displayed title cards.
- For each new observation record endpoint, relevant parameters, HTTP status, response fields and surprises in the examples. Never include credentials. The existing examples remain historical observations, not promises of fixed future live counts or application implementation status.
