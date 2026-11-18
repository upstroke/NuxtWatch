# TMDb API analysis

This working document collects findings for NuxtWatch. Start with the API endpoints; record observed responses and decisions separately as we test them. The inventory is not a commitment to use every listed endpoint. No request has been verified live for this document yet.

## Endpoint inventory

All paths below are GET endpoints relative to `https://api.themoviedb.org/3`.

| Group | Endpoint | Documented purpose |
| --- | --- | --- |
| Search | [`/search/movie`](https://developer.themoviedb.org/reference/search-movie) | Find films by title. |
| Search | [`/search/tv`](https://developer.themoviedb.org/reference/search-tv) | Find series by title. |
| Search | [`/search/multi`](https://developer.themoviedb.org/reference/search-multi) | Search films, series and people with one text query. |
| Search | [`/search/person`](https://developer.themoviedb.org/reference/search-person) | Find people by name. |
| Search | [`/search/keyword`](https://developer.themoviedb.org/reference/search-keyword) | Find TMDb keywords by text. |
| Search | [`/search/company`](https://developer.themoviedb.org/reference/search-company) | Find companies by name. |
| Search | [`/search/collection`](https://developer.themoviedb.org/reference/search-collection) | Find film collections by name. |
| Discover | [`/discover/movie`](https://developer.themoviedb.org/reference/discover-movie) | Find films by filters. |
| Discover | [`/discover/tv`](https://developer.themoviedb.org/reference/discover-tv) | Find series by filters. |
| Trending | [`/trending/all/{time_window}`](https://developer.themoviedb.org/reference/trending-all) | List trending films, series and people together. |
| Trending | [`/trending/movie/{time_window}`](https://developer.themoviedb.org/reference/trending-movies) | List trending films. |
| Trending | [`/trending/tv/{time_window}`](https://developer.themoviedb.org/reference/trending-tv) | List trending series. |
| Trending | [`/trending/person/{time_window}`](https://developer.themoviedb.org/reference/trending-people) | List trending people. |
| Details | [`/movie/{movie_id}`](https://developer.themoviedb.org/reference/movie-details) | Get film details by TMDb ID. |
| Details | [`/tv/{series_id}`](https://developer.themoviedb.org/reference/tv-series-details) | Get series details by TMDb ID. |
| Watch providers | [`/movie/{movie_id}/watch/providers`](https://developer.themoviedb.org/reference/movie-watch-providers) | Get film availability by country. |
| Watch providers | [`/tv/{series_id}/watch/providers`](https://developer.themoviedb.org/reference/tv-series-watch-providers) | Get series availability by country. |
| Catalog | [`/genre/movie/list`](https://developer.themoviedb.org/reference/genre-movie-list) | List film genres. |
| Catalog | [`/genre/tv/list`](https://developer.themoviedb.org/reference/genre-tv-list) | List series genres. |
| Credits | [`/person/{person_id}/tv_credits`](https://developer.themoviedb.org/reference/person-tv-credits) | Retrieve a person's TV credits. |
| External ID | [`/find/{external_id}`](https://developer.themoviedb.org/reference/find-by-id) | Look up TMDb entries using an external identifier. |

Trending uses `day` or `week` as `time_window`. It lists trends for that window rather than matching a text query or a set of Discover filters.

For a detail page opened from a TMDb result, use the result's TMDb ID and media type to choose the details endpoint. `/find` is not needed for this flow. The watch-provider endpoints report availability by country (for example, `results.DE` for Germany) and distinguish options such as subscription (`flatrate`), rental (`rent`), and purchase (`buy`). Attribute the data to JustWatch when displaying it. The returned link points to TMDb, not directly to playback.

## Search flows and decisions

Choose the flow from the user's goal and the current conversation, not
from the presence of a particular word. A follow-up may answer an open
question or change an existing search rather than start a new one.

| User request | Flow | When to run it |
| --- | --- | --- |
| "Find The Matrix." | Title search | A title is enough to search. Media type and year can narrow the result. |
| "Show me sci-fi movies from 2015 onwards." | Filtered discovery | Run once the explicitly requested filters can be applied. |
| "Show me movies like The Matrix." | Similarity search | Resolve the reference title first. If it is ambiguous, let the user select the intended work. The selected work is the input to similarity search, not the final result. |
| "I want to watch something today." | Open discovery | Show trending movies and series without requiring a title or filter. Do not assume cinema or streaming. |
| "I want to stream something today. What's trending?" | Trending with availability | Use a known streaming region or ask for it. Check availability before presenting a trending title as streamable. A specific provider is only needed if the user asks for one. |

### Clarification and search readiness

Accept each resolved criterion independently, but run the new search
only when the selected flow has enough information and no explicitly
requested criterion would be silently dropped. Readiness is not a fixed
number of criteria: a title alone can be enough, while "sci-fi movies
with Tom" still needs a person to be resolved.

For example, if "Tom" is unresolved and the user adds Brad Pitt, Brad
Pitt can appear as an accepted filter while the question about Tom
remains open. If the user wants both people, the new search stays blocked.
Results from the last completed search may stay visible, but must not be
presented as results for the pending revision.

An open request can be refined, resolved by selecting a candidate, or
discarded. Uncertainty and no match are reasons a request can remain
open, not necessarily separate states. One mapped candidate does not
prove uniqueness when pagination metadata is missing. Removing an
accepted filter is a separate operation from discarding an open request.
Replacing an accepted value with an unresolved value is a separate
planning case: do not remove the old value before the replacement is ready.

### Guidance and result cards

Distinguish required clarifications from optional suggestions. "Which
Tom?" blocks a search that requires Tom. "In cinemas" or "Streaming at
home" can accompany trending cards without blocking them. Suggestions
change the search only when the user selects them. If no results match,
explain that and offer ways to broaden the request without changing it
automatically.

Show one card per matching title, even for a single result. Opening a
detail page always requires selecting a card; use that result's media
type and TMDb ID. Selecting a person to resolve a filter, or a title to
resolve a similarity reference, has a different purpose: it supplies
input to the search rather than opening a final result.

## Shared search object

Use one shared search object across flows. It describes what the user
is looking for, not how to call TMDb. The execution layer chooses the
endpoint or sequence of endpoints from the search intent and criteria.

Start with `{ title: "The Matrix" }`. The `title` field identifies the
work the user wants to find. Media type and year can narrow that
request when needed. A title used as a similarity reference has a
different role and should be modelled separately when that flow is
added. An empty object does not by itself mean Trending.

Keep unresolved requests and result cards separate from accepted
criteria. Extend the object one flow at a time rather than modelling
every possible filter up front.

## Search orchestration

The three matrices document responsibilities, not runtime lookup tables.
One coordinator applies a validated state transition, plans the next
step, calls an adapter when needed, and feeds the outcome back into the
same cycle. The parser proposes changes; it does not commit state or
choose TMDb endpoints.

### Decision matrix: what changes in the session?

| Event | State transition |
| --- | --- |
| Start a new search | Create a new draft without carrying over criteria from the previous search. |
| Add "with Tom" | Create a referenced pending person request. Keep unrelated accepted criteria. |
| Refine Tom or select a candidate | Target the specific pending request. Refinement triggers a new lookup; a validated selection accepts the person's ID. |
| Discard the pending Tom request | Remove only that pending request, not any accepted person. |
| Remove an accepted person | Target the accepted filter separately. Parser support for this transition remains open in WP 011. |
| Lookup succeeds with no match or ambiguous candidates | Keep the request pending and record the outcome so the planner can offer the appropriate clarification. |
| Lookup fails | Keep the request pending and record a retryable or non-retryable failure. A failure is not a no-match result. |
| Result search succeeds or fails | On success, associate the cards with the executed revision, even if there are zero cards. On failure, keep the previous successful cards and report the failure separately. |
| Target is ambiguous, event is stale, or change is a no-op | Ask when the target is ambiguous; ignore stale events. Do not rerun the same search solely because of a no-op. |

Execution outcomes are domain events. HTTP status codes, timeouts and
transport retry policy stay at the adapter boundary. A late lookup must
not revive a discarded request, and a late search response must not
overwrite a newer result.

### Search matrix: what may run next?

| Draft or outcome | Next step |
| --- | --- |
| Title request with enough information | Run title search. |
| Filtered discovery with an unresolved required person | Resolve the person first. Do not run discovery with that filter silently omitted. |
| Person lookup is ambiguous or returns no match | Ask for a selection or a more precise name as appropriate; allow the pending request to be discarded. |
| Required lookup failed | Keep the result search blocked. Offer retry when appropriate, or let the user discard the pending request. Do not restart the same lookup automatically during replanning. |
| All required discovery criteria are applicable | Run filtered discovery for the selected media type. |
| Similarity request | Resolve the reference work first, then search for similar titles. |
| Open discovery or explicit trending request | Show trends. If streamability is required, check availability in the selected region before showing a title as streamable. |

### Endpoint matrix: how is each task executed?

| Task | TMDb calls | Required data |
| --- | --- | --- |
| Resolve a person | `/search/person` | Candidate IDs and display names; pagination metadata to assess completeness. Missing metadata must not be treated as proof of uniqueness. |
| Find filtered films | `/discover/movie` | Applicable filters in; IDs and card fields out. |
| Check streaming availability for daily trends | `/trending/all/day`, then the movie or TV watch-provider endpoint for each title checked | Media type and ID from Trending; availability for the selected region. |
| Load details after a card click | `/movie/{movie_id}` or `/tv/{series_id}` | Media type and ID from the selected card. |

The adapter returns data or a typed failure; it does not mutate the
session. The inventory lists available endpoints. This matrix records
which task actually needs each call.

### Search session

Build on the existing `SearchState` rather than introducing a parallel
search model. Keep the current draft and its accepted criteria, pending
requests with stable IDs, and the draft revision. Keep the last successful
execution and its cards tied to the revision it ran for. If a newer draft
is blocked or fails, those cards may stay visible as previous results.

Derive search readiness from the draft and pending requests; do not store
a separate `isReady` flag. Bind asynchronous outcomes to the request or
run they originated from, and validate their targets before applying
them. Keep storage scope open until we decide whether the state must
survive reloads or be shared across tabs.

## Open questions and verification

- Trending and streaming: daily trends checked against regional watch
  providers are not the same as Discover results sorted by popularity.
  Label the latter "Popular and streamable", not "Trending today".
- Cinema: recent regional theatrical releases are a possible discovery
  flow. Do not claim a title is playing nearby today without local
  showtime data.
- Combined filters: verify similarity plus streaming, and TV credits
  for multiple people plus other filters, before promising either
  combination. Keep the maximal query as a test case, not a requirement
  for the first implementation.
- Extend the endpoint matrix as each flow is specified. Verify uncertain
  mappings with example responses. Endpoints without a mapped task remain
  in the inventory but are not required by the current scope.

## Observed responses

No observations recorded yet. For each test, record the endpoint and parameters, HTTP status, relevant response fields, and any limits or surprises. Do not include credentials.

## Decisions for NuxtWatch

Open: which endpoints to use, which response fields to retain, when to combine requests or filter results in the application, and whether to use Trending when no search criteria are set.
