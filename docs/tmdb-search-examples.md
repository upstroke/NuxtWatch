# TMDb search examples

Collect concrete NuxtWatch searches and observed TMDb responses here. Keep one entry per user request, even when it takes multiple API calls. Never include credentials. Distinguish verified API behavior from proposed application contracts.

## 1. Title search: The Matrix

### User request and search contract

“Finde The Matrix.” No media type or year was supplied; neither is required for the initial search. The search object is `{ title: 'The Matrix' }`. The proposed `TitleSearchSchema` has one required field: `title: z.string().trim().min(1)`.

### TMDb request

`GET https://api.themoviedb.org/3/search/multi?query=The%20Matrix&include_adult=true`

Map `title` to `query`. Always request `include_adult=true` and do not exclude movie or TV hits based on `adult`. The default app locale is `en`: omit `language` for `en`, and explicitly map other supported locales (for example, `de` to `de-DE`). Omit `page` on the initial call; request subsequent pages on demand. These are execution options, not fields in the search object.

### Observed results

The authenticated default request returned HTTP 200, `page: 1`, `total_pages: 4`, and `total_results: 62`. Page 1 contained 20 results: 18 movies and two TV shows. The first result was The Matrix (1999), ID `603`. No hit on this page had `adult: true`. The reported total is the upstream count, not a count of cards. A person hit was observed in an earlier Multi Search run with different options.

#### Comparison request: page 2

Adding only `page=2` to the initial request returned HTTP 200, `page: 2`, `total_pages: 4`, and `total_results: 62`. The response contained 20 movies, no TV shows, and no people. One movie was marked `adult: true`. Pages 3 and 4 were not inspected.

The 20 entries are raw results for page 2, not a count of cards displayed by NuxtWatch. This comparison verifies TMDb pagination, not how NuxtWatch loads or filters subsequent pages.

### Card contract

Map only `movie` and `tv` hits to title cards. Use `id` and `mediaType` together to identify a result; do not merge titles by display name. Map `title` or `name` to `title`, `release_date` or `first_air_date` to `date`, `backdrop_path` to `backdropPath`, and `genre_ids` to `genreIds`. Use `vote_average` as `rating` when `vote_count > 0`; otherwise use `null`. Pagination belongs to the result list, not the card.

Example mapped from the first result:

```json
{
  "id": 603,
  "mediaType": "movie",
  "title": "The Matrix",
  "backdropPath": "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg",
  "date": "1999-03-31",
  "genreIds": [28, 878],
  "rating": 8.263
}
```

Keep `id`, `mediaType`, and `title` required. Preserve missing display data as `null` for `backdropPath`, `date`, or `rating`, and as an empty list for `genreIds`. The Approval Matrix (`tv`, ID `325692`) had no backdrop, no genres, and no votes. The card component will handle display fallbacks later: a fallback graphic for a missing backdrop, fallback text for missing genres, and field-specific choices for the remaining values. Do not inject visual placeholders into mapped data. Age certification, match percentage, and favorite state are outside this TMDb card contract.

Status: API request verified; application schemas and card rendering are not implemented by this documentation change.

## 2. Movie title search with a release year: The Matrix (1999)

User request: “Finde den Film The Matrix von 1999.” The comparison uses the same Movie Search endpoint and query, omitting only `primary_release_year`. Both requests omit `language` and `page`.

### TMDb requests

With `NUXT_TMDB_API_READ_ACCESS_TOKEN` set in the shell, run the comparison request without a year:

```bash
curl --silent --show-error --get \
  --url 'https://api.themoviedb.org/3/search/movie' \
  --data-urlencode 'query=The Matrix' \
  --data-urlencode 'include_adult=true' \
  --header "Authorization: Bearer ${NUXT_TMDB_API_READ_ACCESS_TOKEN:?Set the TMDb read access token}" \
  --header 'accept: application/json' \
  --write-out '\nHTTP %{http_code}\n'
```

For the year-filtered request, add `--data-urlencode 'primary_release_year=1999'` to the same command.

### Observed results

| Request                          | HTTP | `page` | `total_pages` | `total_results` | Results returned |
| -------------------------------- | ---: | -----: | ------------: | --------------: | ---------------: |
| Without year                     |  200 |      1 |             3 |              58 |               20 |
| With `primary_release_year=1999` |  200 |      1 |             1 |               3 |                3 |

_The Matrix_ (1999, ID `603`) ranked first in both responses. Without the year, three sequels ranked second through fourth, and two other entries shared the display title _The Matrix_ (IDs `1386216` and `1502836`). Pages 2 and 3 were not inspected.

The year-filtered response also contained _Making "The Matrix"_ (`684431`) and _The Matrix: What Is Bullet-Time?_ (`684428`). The year narrows the result list but does not make the match unique. The latter result was not on page 1 of the unfiltered response; its position in the full unfiltered list was not checked.

Status: Both API requests verified. No parser, schema, or selection behavior is defined by this example.

## 3. TV title search with a first-air year: The Office (2005)

User request: “Finde die Serie The Office von 2005.” Both requests use the TV Search endpoint, set `include_adult=true`, and omit `language` and `page`. The only difference is `first_air_date_year`.

### TMDb requests

With `NUXT_TMDB_API_READ_ACCESS_TOKEN` set in the shell, run:

```bash
curl --silent --show-error --get \
  --url 'https://api.themoviedb.org/3/search/tv' \
  --data-urlencode 'query=The Office' \
  --data-urlencode 'first_air_date_year=2005' \
  --data-urlencode 'include_adult=true' \
  --header "Authorization: Bearer ${NUXT_TMDB_API_READ_ACCESS_TOKEN:?Set the TMDb read access token}" \
  --header 'accept: application/json' \
  --write-out '\nHTTP %{http_code}\n'
```

For the comparison request without a year, remove only the `first_air_date_year` line.

### Observed results

| Request                         | HTTP | `page` | `total_pages` | `total_results` | Results returned |
| ------------------------------- | ---: | -----: | ------------: | --------------: | ---------------: |
| Without year                    |  200 |      1 |             4 |              61 |               20 |
| With `first_air_date_year=2005` |  200 |      1 |             1 |               1 |                1 |

Without the year, the US series _The Office_ (ID `2316`, first aired `2005-03-24`) ranked first. The UK series with the same display name (ID `2996`, first aired `2001-07-09`) ranked second. Pages 2–4 were not inspected.

With the year, only the US series was returned. Unlike the Movie Search example, this particular filtered request returned a single result. This is an observation, not a general rule for automatic selection. All returned entries in both responses had `adult: false`; the request still sets `include_adult=true`.

Status: Both API requests verified. No parser, schema, or selection behavior is defined by this example.

## 4. Title and year without a media type: The Office (2005)

User request: “Finde The Office von 2005.” No media type was specified. Both requests set `include_adult=true` and omit `language` and `page`.

| Request                                                                           | HTTP | `page` | `total_pages` | `total_results` |
| --------------------------------------------------------------------------------- | ---: | -----: | ------------: | --------------: |
| `/3/search/movie?query=The%20Office&primary_release_year=2005&include_adult=true` |  200 |      1 |             1 |               4 |
| `/3/search/tv?query=The%20Office&first_air_date_year=2005&include_adult=true`     |  200 |      1 |             1 |               1 |

The TV response returned the US series _The Office_ (ID `2316`, first aired `2005-03-24`), the only exact display-title match. The four movie results had different display titles; the first (ID `371175`) had `adult: true`.

Keep all four movie results and the TV result eligible for display. Exact display-title matching is not an exclusion criterion, and do not filter returned results by `adult`. This example does not decide whether to combine the lists, how to rank results across endpoints, or whether to select a result automatically.

Status: Both API requests verified. Parser and schemas are unchanged.

## 5. Keyword candidates for a dark atmosphere

Added 25 November 2026. Evidence source: a keyword response supplied by the user in the project discussion. This entry is not an assistant-run live API test. The exact original URL, request options, execution time, and HTTP status were not captured in the available evidence.

### User request and lookup purpose

“Scifi-Movie aus 2025 mit dunkler Atmosphäre.” The operator supplies `dark` as the keyword lookup term for the initial experiment; automatic query generation is not implemented. Movie, science-fiction, and 2025 are contextual criteria, not a title and not verified query parameters for the keyword endpoint. Do not invent additional themes or settings from them.

The lookup resolves candidate keyword IDs only. It neither returns film cards nor demonstrates that any keyword encodes the requested atmosphere. The [keyword experiment concept](keyword-resolution-concept.md) owns the proposed collection, LLM selection, lifecycle, and testing behavior; the [API analysis](tmdb-api-analysis.md#keyword-candidate-resolution) records the provider boundary and verification gaps.

### Request to reproduce — not an observed request log

```http
GET https://api.themoviedb.org/3/search/keyword?query=dark&page=1
```

This is the intended reproduction target, not proof of the original request's exact parameters. Keep credentials server-side and out of recorded evidence. Do not copy title-search options such as `include_adult`, language, year, or media type onto this endpoint without verifying support.

### User-supplied response summary

| Evidence | Value |
| --- | --- |
| HTTP status | Not supplied |
| Page | 1 |
| Entries on supplied page | 20 |
| Reported total pages | 7 |
| Reported total results | 129 |
| Pages 2–7 | Not inspected in this example |

Selected entries from the supplied first page, not the complete page or complete candidate list:

| Keyword name | TMDb ID |
| --- | ---: |
| `dark` | 259094 |
| `dark future` | 212516 |
| `dark comedy` | 10123 |
| `dark fantasy` | 177895 |

Counts, names, IDs, and ordering are historical supplied evidence, not assertions about a fresh response. No complete raw response fixture is added by this documentation change, and no automated Zod validation was run against the original payload here.

### Interpretation and remaining verification

The metadata reports more than one page; the first 20 entries must not be labelled a complete collection of 129 candidates. The proposed experiment must validate and collect the reported page range before model selection, while exposing failures or inconsistent metadata. Completion of a paginated query would still not prove coverage of every relevant synonym or a transactional provider snapshot.

No keyword in the table is accepted as the correct mood mapping. `dark future` can add a future setting, while `dark comedy` and `dark fantasy` can add genre implications not requested by the user. A lexically matching name or valid candidate ID is not semantic acceptance evidence. The planned model comparison uses the full request and supplied context, permits no match or clarification, and validates selected IDs against the complete supplied set.

Still required: readable official contract evidence and/or an independently observed authenticated response; empty-result behavior; remaining-page collection and consistency; controlled failure/rate-limit handling; and contextual model evaluation. No Discover request, film relevance comparison, AND/OR keyword semantics, or shared-search integration was executed or verified by this example.

Status: User-supplied first-page evidence recorded; independent API verification and implementation remain open. Existing title-search observations above are unchanged.
